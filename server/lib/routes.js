// Shared API routes for both the production server (server/index.js) and the
// CRA dev server (src/setupProxy.js), so the two can't drift apart.
//
// News:  GNews (if a key is set) → Google News RSS (free, no key) fallback,
//        with an in-memory cache and stale-on-error so the page never hangs.
// AI:    Local neural network via Ollama (free) → template writer fallback.

const express = require('express');
const { JAMESON_PROMPT, THREAT_ANALYST_PROMPT, JOB_PROMPT } = require('./prompts');

const OLLAMA_URL = (process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

const FETCH_TIMEOUT_MS = 6000;
const LLM_TIMEOUT_MS = 120000; // first request also loads the model into memory
const HEADLINE_TTL_MS = 30 * 60 * 1000; // keeps GNews well under 100 req/day
const SEARCH_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;

const jsonBody = express.json({ limit: '100kb' });

// ── Cache: TTL + in-flight dedupe + serve stale on error ──────────────
const cache = new Map();
const inflight = new Map();

function cached(key, ttl, loader) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.time < ttl) return Promise.resolve(hit.value);
  if (inflight.has(key)) return inflight.get(key);

  const promise = loader()
    .then((value) => {
      cache.delete(key);
      cache.set(key, { value, time: Date.now() });
      if (cache.size > MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value);
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

/** Runs the local model with JSON-schema constrained output. Returns raw JSON text. */
async function ollamaChat(system, prompt, schema, maxTokens) {
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      format: schema,
      keep_alive: '30m',
      options: { temperature: 0.8, num_predict: maxTokens },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Ollama responded with status ${response.status}`);
  const text = data.message?.content;
  if (!text) throw new Error('Empty response from local model');
  return text;
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

function indeedSearchUrl(title) {
  return `https://www.indeed.com/jobs?${new URLSearchParams({ q: title, l: 'New York, NY' })}`;
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
  app.get('/api/youtube/search', limiter, async (req, res) => {
    try {
      const youtubeApiKey = process.env.YOUTUBE_API_KEY;
      if (!youtubeApiKey) {
        return res.status(500).json({ error: 'YouTube API key not configured' });
      }
      const params = new URLSearchParams({
        key: youtubeApiKey,
        part: 'snippet',
        type: 'video',
        q: req.query.q || 'NYC crime news',
        maxResults: req.query.maxResults || '5',
        order: 'date',
        relevanceLanguage: 'en',
        safeSearch: 'none',
      });
      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({ error: data.error?.message || 'YouTube API error' });
      }
      const videos = (data.items || []).map((item) => ({
        videoId: item.id?.videoId,
        title: item.snippet?.title,
        description: item.snippet?.description,
        thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
        channelTitle: item.snippet?.channelTitle,
        publishedAt: item.snippet?.publishedAt,
      }));
      res.json({ videos });
    } catch (error) {
      console.error('YouTube API error:', error);
      res.status(500).json({ error: 'Failed to fetch videos' });
    }
  });

  // POST /api/newsroom { query, mode } → { text, engine }
  app.post('/api/newsroom', limiter, jsonBody, async (req, res) => {
    const query = typeof req.body?.query === 'string' ? req.body.query.trim().slice(0, 200) : '';
    const mode = req.body?.mode === 'spiderman' ? 'spiderman' : 'peter';
    if (!query) return res.status(400).json({ error: 'Query is required' });

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
      const text =
        mode === 'peter'
          ? await ollamaChat(JAMESON_PROMPT, prompt, ARTICLE_SCHEMA, 450)
          : await ollamaChat(THREAT_ANALYST_PROMPT, prompt, THREAT_SCHEMA, 350);
      res.json({ text, engine: 'local-ai' });
    } catch (err) {
      console.warn('Local AI unavailable, using template writer:', err.message);
      const result = mode === 'peter' ? templateArticle(query, headlines) : templateThreat(query, headlines);
      res.json({ text: JSON.stringify(result), engine: 'template' });
    }
  });

  // POST /api/jobs { category } → { jobs, engine }
  app.post('/api/jobs', limiter, jsonBody, async (req, res) => {
    const category = typeof req.body?.category === 'string' ? req.body.category.trim().slice(0, 100) : '';
    if (!category) return res.status(400).json({ error: 'Category is required' });

    let jobs;
    let engine = 'local-ai';
    try {
      const text = await ollamaChat(
        JOB_PROMPT,
        `Generate "${category}" job listings in New York City.`,
        JOBS_SCHEMA,
        700
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
