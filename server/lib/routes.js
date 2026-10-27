// Shared API routes for both the production server (server/index.js) and the
// CRA dev server (src/setupProxy.js), so the two can't drift apart.
//
// News:  Publisher RSS feeds with photos (free, no key) → GNews (if a key is
//        set) → Google News RSS, with an in-memory cache and stale-on-error
//        so the page never hangs.
// AI:    Local neural network via Ollama (free) → template writer fallback.
//        Requests to the model are queued one at a time (a CPU-only VPS can't
//        run several at once) and streamed so text appears as it's written.

const fs = require('fs');
const path = require('path');
const express = require('express');
const { JAMESON_PROMPT, THREAT_ANALYST_PROMPT, JOB_PROMPT, JAMESON_CHAT_PROMPT } = require('./prompts');

const OLLAMA_URL = (process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

const FETCH_TIMEOUT_MS = 6000;
const LLM_TIMEOUT_MS = 180000; // CPU inference + first request loads the model
const MODEL_CONCURRENCY = Number(process.env.OLLAMA_CONCURRENCY || 1);
const MODEL_MAX_QUEUE = Number(process.env.OLLAMA_MAX_QUEUE || 6);
const ARTICLE_TTL_MS = 6 * 60 * 60 * 1000;
const CHAT_MAX_MESSAGES = 12;
const CHAT_MAX_CHARS = 600;
const HEADLINE_TTL_MS = 30 * 60 * 1000; // keeps GNews well under 100 req/day
const SEARCH_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;

const jsonBody = express.json({ limit: '100kb' });

// ── Cache: TTL + in-flight dedupe + serve stale on error ──────────────
const cache = new Map();
const inflight = new Map();

function getCached(key, ttl) {
  const hit = cache.get(key);
  return hit && Date.now() - hit.time < ttl ? hit.value : undefined;
}

function setCached(key, value) {
  cache.delete(key);
  cache.set(key, { value, time: Date.now() });
  if (cache.size > MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value);
}

function cached(key, ttl, loader) {
  const fresh = getCached(key, ttl);
  if (fresh !== undefined) return Promise.resolve(fresh);
  if (inflight.has(key)) return inflight.get(key);
  const hit = cache.get(key);

  const promise = loader()
    .then((value) => {
      setCached(key, value);
      return value;
    })
    .catch((err) => {
      if (hit) {
        console.warn(`Serving stale "${key}":`, err.message);
        return hit.value;
      }
      throw err;
    })
    .finally(() => inflight.delete(key));

  inflight.set(key, promise);
  return promise;
}

// ── GNews ──────────────────────────────────────────────────────────────
async function fetchGnews(endpoint, params) {
  const apikey = process.env.GNEWS_API_KEY;
  if (!apikey) throw new Error('GNews API key not configured');

  const response = await fetch(
    `https://gnews.io/api/v4/${endpoint}?${new URLSearchParams({ apikey, ...params })}`,
    { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`GNews ${response.status}: ${JSON.stringify(data.errors || 'error')}`);
  }
  return (data.articles || []).map((a) => ({
    title: a.title,
    description: a.description || null,
    url: a.url,
    urlToImage: a.image || null,
    source: { id: null, name: a.source?.name || 'Unknown' },
    publishedAt: a.publishedAt,
    author: null,
    content: a.content || null,
  }));
}

// ── Google News RSS (free, no key) ─────────────────────────────────────
function decodeEntities(text) {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function fetchGoogleNewsRss(query) {
  const locale = 'hl=en-US&gl=US&ceid=US:en';
  const url = query
    ? `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&${locale}`
    : `https://news.google.com/rss?${locale}`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { 'User-Agent': 'Mozilla/5.0 (DailyBugleNewsroom)' },
  });
  if (!response.ok) throw new Error(`Google News RSS ${response.status}`);
  const xml = await response.text();

  return (xml.match(/<item>[\s\S]*?<\/item>/g) || [])
    .map((item) => {
      const tag = (name) => {
        const m = item.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
        return m ? decodeEntities(m[1]).trim() : '';
      };
      const sourceName = tag('source') || 'Google News';
      const published = new Date(tag('pubDate'));
      return {
        // Google appends " - Source" to every title
        title: tag('title').replace(new RegExp(`\\s+-\\s+${escapeRegExp(sourceName)}$`), ''),
        description: null,
        url: tag('link'),
        urlToImage: null,
        source: { id: null, name: sourceName },
        publishedAt: (isNaN(published.getTime()) ? new Date() : published).toISOString(),
        author: null,
        content: null,
      };
    })
    .filter((a) => a.title && a.url);
}

/** Try GNews first (has images), fall back to RSS if it fails or is empty. */
async function withRssFallback(gnewsLoader, rssQuery, max) {
  try {
    const articles = await gnewsLoader();
    if (articles.length > 0) return articles;
    throw new Error('GNews returned no articles');
  } catch (err) {
    console.warn('GNews unavailable, using Google News RSS:', err.message);
    return (await fetchGoogleNewsRss(rssQuery)).slice(0, max);
  }
}

// ── Publisher feeds: free, no key, and they carry the story's own photo ─
const PUBLISHER_FEEDS = {
  // Bugle mode: the day's national and world front page
  bugle: [
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', source: 'The New York Times' },
    { url: 'https://www.theguardian.com/us-news/rss', source: 'The Guardian' },
    { url: 'https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml', source: 'BBC News' },
  ],
  // Spider-Man mode: New York's own streets
  spidey: [
    { url: 'https://nypost.com/metro/feed/', source: 'New York Post' },
    { url: 'https://abc7ny.com/feed/', source: 'ABC7 New York' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/NYRegion.xml', source: 'The New York Times' },
  ],
};

const CRIME_WORDS = /crime|police|nypd|arrest|shoot|stab|robber|theft|steal|murder|kill|charged|suspect|assault|fire|crash|subway|attack|scam|gun|cops?\b|court|sentenc/i;
const FEED_TTL_MS = 15 * 60 * 1000;
const YOUTUBE_TTL_MS = 30 * 60 * 1000;

function xmlAttr(attrs, name) {
  const m = attrs.match(new RegExp(`\\b${name}="([^"]*)"`));
  return m ? decodeEntities(m[1]) : '';
}

/** The largest image a feed item offers, sized for the page */
function itemImage(item) {
  const candidates = [];
  for (const m of item.matchAll(/<(media:content|media:thumbnail|enclosure)\b([^>]*)>/g)) {
    const url = xmlAttr(m[2], 'url');
    const type = xmlAttr(m[2], 'type');
    const medium = xmlAttr(m[2], 'medium');
    if (!url || (type && !type.startsWith('image')) || (medium && medium !== 'image')) continue;
    candidates.push({ url, width: Number(xmlAttr(m[2], 'width')) || 0 });
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.width - a.width);
  let url = candidates[0].url;
  // NY Post encodes its paths and serves multi-megabyte originals unless asked for a width
  if (url.includes('%2F')) url = decodeURIComponent(url);
  if (url.includes('nypost.com/wp-content')) url = url.replace(/\?.*$/, '?quality=80&strip=all&w=1200');
  // BBC thumbnails are 240px wide; the same image exists at 800
  return url.replace('/ace/standard/240/', '/ace/standard/800/');
}

function stripHtml(html) {
  return decodeEntities(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/The post .* appeared first on .*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function shorten(text, max = 220) {
  if (text.length <= max) return text;
  return `${text.slice(0, text.lastIndexOf(' ', max))}…`;
}

async function fetchPublisherFeed({ url, source }) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { 'User-Agent': 'Mozilla/5.0 (DailyBugleNewsroom)' },
  });
  if (!response.ok) throw new Error(`${source} feed ${response.status}`);
  const xml = await response.text();

  return (xml.match(/<item[\s>][\s\S]*?<\/item>/g) || [])
    .map((item) => {
      const tag = (name) => {
        const m = item.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
        return m ? decodeEntities(m[1]).trim() : '';
      };
      const published = new Date(tag('pubDate'));
      const description = shorten(stripHtml(tag('description')));
      return {
        title: stripHtml(tag('title')),
        description: description || null,
        url: tag('link'),
        urlToImage: itemImage(item),
        source: { id: null, name: source },
        publishedAt: (isNaN(published.getTime()) ? new Date() : published).toISOString(),
        author: null,
        content: null,
      };
    })
    .filter((a) => a.title && a.url);
}

/** Mixes the feeds story by story, so no single paper takes over the page */
function interleave(lists) {
  const seen = new Set();
  const out = [];
  for (let i = 0; lists.some((list) => i < list.length); i++) {
    for (const list of lists) {
      const article = list[i];
      if (!article) continue;
      const key = article.title.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(article);
    }
  }
  return out;
}

async function loadFeed(name, max) {
  const results = await Promise.allSettled(PUBLISHER_FEEDS[name].map(fetchPublisherFeed));
  results
    .filter((r) => r.status === 'rejected')
    .forEach((r) => console.warn('Publisher feed failed:', r.reason.message));
  // Stories with a photo lead; Spider-Man mode puts crime and police news first
  const lists = results.filter((r) => r.status === 'fulfilled').map((r) => r.value.filter((a) => a.urlToImage));
  let articles = interleave(lists);
  if (name === 'spidey') {
    articles = [...articles.filter((a) => CRIME_WORDS.test(a.title)), ...articles.filter((a) => !CRIME_WORDS.test(a.title))];
  }
  if (articles.length >= 3) return articles.slice(0, max);

  // Not enough from the publishers: GNews if configured, then Google News
  const query = name === 'spidey' ? 'New York crime OR police OR arrest' : null;
  return withRssFallback(
    () => (query ? fetchGnews('search', { q: query, lang: 'en', max: String(max) }) : fetchGnews('top-headlines', { lang: 'en', country: 'us', max: String(max) })),
    query,
    max
  );
}

function newsResponse(articles) {
  return { status: 'ok', totalResults: articles.length, articles };
}

// ── Local AI via Ollama ────────────────────────────────────────────────
const ARTICLE_SCHEMA = {
  type: 'object',
  properties: {
    headline: { type: 'string' },
    subheadline: { type: 'string' },
    body: { type: 'string' },
    jamesons_take: { type: 'string' },
  },
  required: ['headline', 'subheadline', 'body', 'jamesons_take'],
};

const THREAT_SCHEMA = {
  type: 'object',
  properties: {
    threat_level: { type: 'string', enum: ['Green', 'Yellow', 'Red'] },
    summary: { type: 'string' },
    analysis: { type: 'string' },
    recommended_actions: { type: 'array', items: { type: 'string' } },
  },
  required: ['threat_level', 'summary', 'analysis', 'recommended_actions'],
};

const JOBS_SCHEMA = {
  type: 'object',
  properties: {
    jobs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          company: { type: 'string' },
          location: { type: 'string' },
          description: { type: 'string' },
          salary: { type: 'string' },
        },
        required: ['title', 'company', 'location', 'description', 'salary'],
      },
    },
  },
  required: ['jobs'],
};

// ── Model queue: one generation at a time, bounded waiting line ────────
let activeGenerations = 0;
const waitingGenerations = [];

class ModelBusyError extends Error {}

function withModelSlot(task) {
  if (activeGenerations >= MODEL_CONCURRENCY && waitingGenerations.length >= MODEL_MAX_QUEUE) {
    return Promise.reject(new ModelBusyError('Local model is busy'));
  }
  return new Promise((resolve, reject) => {
    const run = () => {
      activeGenerations++;
      task()
        .then(resolve, reject)
        .finally(() => {
          activeGenerations--;
          const next = waitingGenerations.shift();
          if (next) next();
        });
    };
    if (activeGenerations < MODEL_CONCURRENCY) run();
    else waitingGenerations.push(run);
  });
}

/**
 * Streams a chat completion from the local model, calling onToken for each
 * piece of text. Resolves with the full text. Pass a schema to constrain the
 * output to JSON. `signal` aborts generation (e.g. when the visitor leaves).
 */
function ollamaChat(messages, { schema, maxTokens, signal, onToken = () => {} }) {
  return withModelSlot(async () => {
    if (signal?.aborted) throw new Error('Request aborted');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort);

    try {
      const response = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          stream: true,
          ...(schema && { format: schema }),
          keep_alive: '30m',
          options: { temperature: 0.8, num_predict: maxTokens },
          messages,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Ollama responded with status ${response.status}`);
      }

      // Ollama streams newline-delimited JSON chunks
      const decoder = new TextDecoder();
      let buffer = '';
      let text = '';
      for await (const chunk of response.body) {
        buffer += decoder.decode(chunk, { stream: true });
        let newline;
        while ((newline = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, newline).trim();
          buffer = buffer.slice(newline + 1);
          if (!line) continue;
          const data = JSON.parse(line);
          if (data.error) throw new Error(data.error);
          const piece = data.message?.content || '';
          if (piece) {
            text += piece;
            onToken(piece);
          }
        }
      }
      if (!text) throw new Error('Empty response from local model');
      return text;
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abort);
    }
  });
}

/** Aborts when the client disconnects before the response finished. */
function clientAbortSignal(res) {
  const controller = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) controller.abort();
  });
  return controller.signal;
}

function startStream(res, contentType) {
  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'no-cache',
    'X-Accel-Buffering': 'no', // stop nginx from buffering the stream
  });
}

async function checkOllama() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(2000) });
    const { models = [] } = await response.json();
    const names = models.map((m) => m.name);
    const wanted = OLLAMA_MODEL.includes(':') ? OLLAMA_MODEL : `${OLLAMA_MODEL}:latest`;
    if (names.includes(wanted)) {
      console.log(`  Local AI ready: Ollama model "${OLLAMA_MODEL}"`);
    } else {
      console.warn(`\n  WARNING: Ollama is running but "${OLLAMA_MODEL}" is not pulled.\n  Run: ollama pull ${OLLAMA_MODEL}\n`);
    }
  } catch {
    console.warn(
      `\n  WARNING: Ollama not reachable at ${OLLAMA_URL} — using the template writer.\n` +
        '  Install the free local AI: https://ollama.com/download\n' +
        `  then run: ollama pull ${OLLAMA_MODEL}\n`
    );
  }
}

// ── Template writers (used when the local model is unavailable) ────────
const pick = (list) => list[Math.floor(Math.random() * list.length)];

const JAMESON_RANTS = [
  "Spider-Man is a THREAT to this city and I'll keep printing it until somebody listens! — J. Jonah Jameson",
  "Where was the wall-crawling menace when New York needed him? Probably causing the problem! — J. Jonah Jameson",
  "I want that webbed freak behind bars, and I want PICTURES! — J. Jonah Jameson",
];

function templateArticle(query, headlines) {
  const [first, second] = headlines;
  return {
    headline: `${query.toUpperCase()}: IS SPIDER-MAN BEHIND IT?!`,
    subheadline: first
      ? `As ${first.source.name} reports "${first.title}", the Bugle asks the questions nobody else will`
      : 'The Daily Bugle demands answers the wall-crawler won\'t give',
    body: [
      first
        ? `The people of New York woke up to more trouble today: ${first.title}. And where was the wall-crawling menace? Nowhere to be found — AGAIN!`
        : `The people of New York are asking about ${query}, and the Daily Bugle has ONE question: where was Spider-Man?!`,
      second
        ? `Meanwhile, ${second.title}. Coincidence? The Daily Bugle does NOT believe in coincidences!`
        : 'Our sources say a masked figure was seen swinging nearby. Coincidence? The Daily Bugle does NOT believe in coincidences!',
      'This newspaper will not rest until that webbed freak is unmasked and held accountable!',
    ].join('\n\n'),
    jamesons_take: pick(JAMESON_RANTS),
  };
}

const RED_SIGNALS = /shoot|killed|murder|attack|explosion|bomb|terror|hostage|stabb|fire|dead/i;
const YELLOW_SIGNALS = /robbery|theft|arrest|assault|fraud|hack|cyber|breach|crash|police|scam|weapon|traffick|threat|crime/i;

function templateThreat(query, headlines) {
  const signals = [query, ...headlines.map((h) => h.title)].join(' ');
  const level = RED_SIGNALS.test(signals) ? 'Red' : YELLOW_SIGNALS.test(signals) ? 'Yellow' : 'Green';
  const [first, second] = headlines;
  const actions = {
    Red: ['Deploy to sector immediately', 'Coordinate with NYPD emergency units', 'Prioritize civilian evacuation'],
    Yellow: ['Increase patrol frequency in sector', 'Monitor police scanner traffic', 'Prepare web-fluid reserves'],
    Green: ['Maintain routine patrol', 'Log intel for pattern analysis', 'Re-scan in 12 hours'],
  }[level];

  return {
    threat_level: level,
    summary: `${headlines.length} active reports matched "${query}". Threat level ${level.toUpperCase()}.`,
    analysis: [
      first ? `Primary signal: ${first.title} (${first.source.name}).` : 'No primary signal detected in open-source feeds.',
      second ? `Secondary signal: ${second.title}. Operative should cross-reference.` : 'Insufficient corroborating intel. Confidence low.',
    ].join('\n\n'),
    recommended_actions: actions,
  };
}

const TEMPLATE_COMPANIES = ['Oscorp Industries', 'Horizon Labs', 'Empire State University', 'Daily Bugle', 'Stark Industries', 'Alchemax'];
const TEMPLATE_SALARIES = ['$55,000 - $70,000', '$70,000 - $90,000', '$85,000 - $110,000', '$45,000 - $60,000', '$95,000 - $125,000', '$60,000 - $80,000'];
const TEMPLATE_PREFIXES = ['', 'Senior ', 'Junior ', 'Lead ', 'Night Shift ', 'Contract '];

function templateJobs(category) {
  const title = category.replace(/\b\w/g, (c) => c.toUpperCase());
  return TEMPLATE_PREFIXES.map((prefix, i) => ({
    title: `${prefix}${title}`,
    company: TEMPLATE_COMPANIES[i],
    location: 'New York, NY',
    description: `Spider-sense, quick reflexes and a genius-level science background make Peter a natural ${category}.`,
    salary: TEMPLATE_SALARIES[i],
  }));
}

const CHAT_FALLBACKS = [
  "PARKER?! Is that you? The phone lines are jammed — call back later, and BRING ME PICTURES OF SPIDER-MAN!",
  "I don't have time for this! The presses are down and that wall-crawling menace is probably behind it! Call back!",
  "Hold on — Robbie's on the other line about Spider-Man. Call me back, and make it QUICK!",
];

function indeedSearchUrl(title) {
  return `https://www.indeed.com/jobs?${new URLSearchParams({ q: title, l: 'New York, NY' })}`;
}

// ── Candles for Ben: a shared count, kept in a small file ──────────────
const CANDLES_FILE = process.env.CANDLES_FILE || path.join(__dirname, '..', 'data', 'candles.json');
const CANDLE_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const litByVisitor = new Map(); // visitor address -> when they last lit one (memory only, never saved)

function readCandleCount() {
  try {
    return Number(JSON.parse(fs.readFileSync(CANDLES_FILE, 'utf8')).count) || 0;
  } catch {
    return 0;
  }
}

let candleCount = readCandleCount();

function saveCandleCount() {
  fs.mkdirSync(path.dirname(CANDLES_FILE), { recursive: true });
  // Write then rename, so a crash mid-write never leaves a broken file
  const tmp = `${CANDLES_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify({ count: candleCount, updatedAt: new Date().toISOString() }));
  fs.renameSync(tmp, CANDLES_FILE);
}

// ── Routes ─────────────────────────────────────────────────────────────
function registerRoutes(app, limiter) {
  checkOllama();

  // GET /api/news/top-headlines?country=us&category=general&pageSize=10
  app.get('/api/news/top-headlines', limiter, async (req, res) => {
    const country = String(req.query.country || 'us');
    const max = String(req.query.pageSize || '10');
    const topic = req.query.category ? String(req.query.category) : undefined;
    try {
      const articles = await cached(`top:${country}:${topic}:${max}`, HEADLINE_TTL_MS, () =>
        withRssFallback(
          () => fetchGnews('top-headlines', { lang: 'en', country, max, ...(topic && { topic }) }),
          null,
          Number(max)
        )
      );
      res.json(newsResponse(articles));
    } catch (error) {
      console.error('Top headlines error:', error.message);
      res.status(502).json({ error: 'Failed to fetch news' });
    }
  });

  // GET /api/news/feed/bugle | /api/news/feed/spidey — curated feeds with photos
  app.get('/api/news/feed/:name', limiter, async (req, res) => {
    const name = req.params.name;
    if (!PUBLISHER_FEEDS[name]) return res.status(404).json({ error: 'Unknown feed' });
    try {
      const articles = await cached(`feed:${name}`, FEED_TTL_MS, () => loadFeed(name, 12));
      res.json(newsResponse(articles));
    } catch (error) {
      console.error('Feed error:', error.message);
      res.status(502).json({ error: 'Failed to load the news feed' });
    }
  });

  // GET /api/news/search?q=keyword&pageSize=10
  app.get('/api/news/search', limiter, async (req, res) => {
    if (!req.query.q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    const q = String(req.query.q);
    const lang = String(req.query.language || 'en');
    const max = String(req.query.pageSize || '10');
    try {
      const articles = await cached(`search:${q}:${lang}:${max}`, HEADLINE_TTL_MS, () =>
        withRssFallback(() => fetchGnews('search', { q, lang, max }), q, Number(max))
      );
      res.json(newsResponse(articles));
    } catch (error) {
      console.error('News search error:', error.message);
      res.status(502).json({ error: 'Failed to search news' });
    }
  });

  // GET /api/youtube/search?q=keyword&maxResults=5
  // Each search costs 100 of YouTube's 10,000 free daily units, so results are
  // cached for 30 minutes per query (and served stale if YouTube errors).
  app.get('/api/youtube/search', limiter, async (req, res) => {
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    if (!youtubeApiKey) {
      return res.status(500).json({ error: 'YouTube API key not configured' });
    }
    const q = String(req.query.q || 'NYC crime news').slice(0, 120);
    const maxResults = String(Math.min(Number(req.query.maxResults) || 5, 10));

    try {
      const videos = await cached(`youtube:${q.toLowerCase()}:${maxResults}`, YOUTUBE_TTL_MS, async () => {
        const params = new URLSearchParams({
          key: youtubeApiKey,
          part: 'snippet',
          type: 'video',
          q,
          maxResults,
          order: 'date',
          relevanceLanguage: 'en',
          safeSearch: 'none',
        });
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, {
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'YouTube API error');
        return (data.items || []).map((item) => ({
          videoId: item.id?.videoId,
          title: item.snippet?.title,
          description: item.snippet?.description,
          thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
          channelTitle: item.snippet?.channelTitle,
          publishedAt: item.snippet?.publishedAt,
        }));
      });
      res.json({ videos });
    } catch (error) {
      console.error('YouTube API error:', error.message);
      res.status(502).json({ error: 'Failed to fetch videos' });
    }
  });

  // GET /api/candles → { count }
  app.get('/api/candles', (req, res) => {
    res.json({ count: candleCount });
  });

  // POST /api/candles → { count, counted } — one candle per visitor per day
  app.post('/api/candles', limiter, (req, res) => {
    const visitor = req.ip || 'unknown';
    const last = litByVisitor.get(visitor);
    if (last && Date.now() - last < CANDLE_COOLDOWN_MS) {
      return res.json({ count: candleCount, counted: false });
    }
    litByVisitor.set(visitor, Date.now());
    candleCount += 1;
    try {
      saveCandleCount();
    } catch (err) {
      console.error('Could not save the candle count:', err.message);
    }
    res.json({ count: candleCount, counted: true });
  });

  // POST /api/newsroom { query, mode } → NDJSON stream:
  //   {"type":"token","text":"..."}*  then  {"type":"done","text":"<json>","engine":"local-ai|template|cache"}
  app.post('/api/newsroom', limiter, jsonBody, async (req, res) => {
    const query = typeof req.body?.query === 'string' ? req.body.query.trim().slice(0, 200) : '';
    const mode = req.body?.mode === 'spiderman' ? 'spiderman' : 'peter';
    if (!query) return res.status(400).json({ error: 'Query is required' });

    startStream(res, 'application/x-ndjson');
    const send = (event) => res.write(`${JSON.stringify(event)}\n`);

    const cacheKey = `article:${mode}:${query.toLowerCase()}`;
    const hit = getCached(cacheKey, ARTICLE_TTL_MS);
    if (hit) {
      send({ type: 'done', text: hit, engine: 'cache' });
      return res.end();
    }

    // Real news for grounding — RSS keeps the GNews quota for the homepage
    let headlines = [];
    try {
      headlines = (await cached(`rss:${query}`, SEARCH_TTL_MS, () => fetchGoogleNewsRss(query))).slice(0, 5);
    } catch (err) {
      console.warn('Grounding search failed:', err.message);
    }

    const headlineList = headlines.length
      ? headlines.map((h, i) => `${i + 1}. ${h.title} (${h.source.name})`).join('\n')
      : 'No headlines found — write about the topic in general terms.';
    const prompt = `Topic: ${query}\n\nReal headlines:\n${headlineList}`;

    try {
      const text = await ollamaChat(
        [
          { role: 'system', content: mode === 'peter' ? JAMESON_PROMPT : THREAT_ANALYST_PROMPT },
          { role: 'user', content: prompt },
        ],
        {
          schema: mode === 'peter' ? ARTICLE_SCHEMA : THREAT_SCHEMA,
          maxTokens: mode === 'peter' ? 450 : 350,
          signal: clientAbortSignal(res),
          onToken: (piece) => send({ type: 'token', text: piece }),
        }
      );
      setCached(cacheKey, text);
      send({ type: 'done', text, engine: 'local-ai' });
    } catch (err) {
      if (res.destroyed) return;
      console.warn('Local AI unavailable, using template writer:', err.message);
      const result = mode === 'peter' ? templateArticle(query, headlines) : templateThreat(query, headlines);
      send({ type: 'done', text: JSON.stringify(result), engine: 'template' });
    }
    res.end();
  });

  // POST /api/jameson/chat { messages: [{ role, content }] } → plain-text stream
  app.post('/api/jameson/chat', limiter, jsonBody, async (req, res) => {
    const raw = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const messages = raw
      .filter((m) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string')
      .slice(-CHAT_MAX_MESSAGES)
      .map((m) => ({ role: m.role, content: m.content.slice(0, CHAT_MAX_CHARS) }));
    if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
      return res.status(400).json({ error: 'Last message must be from the user' });
    }

    startStream(res, 'text/plain; charset=utf-8');
    let wroteAny = false;
    try {
      await ollamaChat([{ role: 'system', content: JAMESON_CHAT_PROMPT }, ...messages], {
        maxTokens: 220,
        signal: clientAbortSignal(res),
        onToken: (piece) => {
          wroteAny = true;
          res.write(piece);
        },
      });
    } catch (err) {
      if (res.destroyed) return;
      console.warn('Jameson chat fallback:', err.message);
      if (!wroteAny) res.write(pick(CHAT_FALLBACKS));
    }
    res.end();
  });

  // POST /api/jobs { category } → { jobs, engine }
  app.post('/api/jobs', limiter, jsonBody, async (req, res) => {
    const category = typeof req.body?.category === 'string' ? req.body.category.trim().slice(0, 100) : '';
    if (!category) return res.status(400).json({ error: 'Category is required' });

    let jobs;
    let engine = 'local-ai';
    try {
      const text = await ollamaChat(
        [
          { role: 'system', content: JOB_PROMPT },
          { role: 'user', content: `Generate "${category}" job listings in New York City.` },
        ],
        { schema: JOBS_SCHEMA, maxTokens: 700, signal: clientAbortSignal(res) }
      );
      jobs = JSON.parse(text).jobs;
      if (!Array.isArray(jobs) || jobs.length === 0) throw new Error('Model returned no jobs');
    } catch (err) {
      console.warn('Local AI unavailable for jobs, using templates:', err.message);
      jobs = templateJobs(category);
      engine = 'template';
    }

    // The model can't know real posting URLs, so link to a live Indeed search
    res.json({
      jobs: jobs.slice(0, 6).map((job) => ({ ...job, url: indeedSearchUrl(job.title) })),
      engine,
    });
  });
}

module.exports = { registerRoutes };
