const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security middleware ────────────────────────────────────────────────

// JSON body parsing with size limit
app.use(express.json({ limit: '100kb' }));

// CORS — only allow known origins
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://daily-bugglespiderman.com',
  'http://daily-bugglespiderman.com',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Rate limiting — 20 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded. Try again later.' },
});

// ── Serve React build ──────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'build')));

// ── Helper: convert GNews response → News API-compatible format ────────
function normalizeGnewsResponse(data) {
  if (!data || !data.articles) {
    return { status: 'error', totalResults: 0, articles: [] };
  }
  return {
    status: 'ok',
    totalResults: data.totalArticles || data.articles.length,
    articles: data.articles.map((a) => ({
      title: a.title,
      description: a.description || null,
      url: a.url,
      urlToImage: a.image || null,
      source: { id: null, name: a.source?.name || 'Unknown' },
      publishedAt: a.publishedAt,
      author: null,
      content: a.content || null,
    })),
  };
}

// ── GNews API endpoints ─────────────────────────────────────────────────

app.get('/api/news/top-headlines', apiLimiter, async (req, res) => {
  try {
    const gnewsApiKey = process.env.GNEWS_API_KEY;
    if (!gnewsApiKey) {
      return res.status(500).json({ error: 'GNews API key not configured' });
    }
    const params = new URLSearchParams({
      apikey: gnewsApiKey,
      lang: 'en',
      country: req.query.country || 'us',
      max: req.query.pageSize || '10',
      ...(req.query.category && { topic: req.query.category }),
    });
    const response = await fetch(`https://gnews.io/api/v4/top-headlines?${params}`);
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ status: 'error', message: data.errors || 'GNews error' });
    }
    res.json(normalizeGnewsResponse(data));
  } catch (error) {
    console.error('GNews API error:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

app.get('/api/news/search', apiLimiter, async (req, res) => {
  try {
    const gnewsApiKey = process.env.GNEWS_API_KEY;
    if (!gnewsApiKey) {
      return res.status(500).json({ error: 'GNews API key not configured' });
    }
    if (!req.query.q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    const params = new URLSearchParams({
      apikey: gnewsApiKey,
      q: req.query.q,
      lang: req.query.language || 'en',
      max: req.query.pageSize || '10',
    });
    const response = await fetch(`https://gnews.io/api/v4/search?${params}`);
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ status: 'error', message: data.errors || 'GNews error' });
    }
    res.json(normalizeGnewsResponse(data));
  } catch (error) {
    console.error('GNews search error:', error);
    res.status(500).json({ error: 'Failed to search news' });
  }
});

// ── YouTube Data API endpoint ──────────────────────────────────────────

app.get('/api/youtube/search', apiLimiter, async (req, res) => {
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
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
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

// ── Claude API proxy endpoint ─────────────────────────────────────────
app.post('/api/chat', apiLimiter, async (req, res) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured on server' });
    }

    // Validate request shape
    const { model, max_tokens, system, messages, tools, mcp_servers } = req.body;
    if (!messages || !Array.isArray(messages) || !model) {
      return res.status(400).json({ error: 'Invalid request: model and messages required' });
    }

    // Build sanitized payload — only forward known safe fields
    const payload = {
      model,
      max_tokens: Math.min(max_tokens || 768, 1024),
      system,
      messages,
      ...(tools && { tools }),
      ...(mcp_servers && { mcp_servers }),
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('API proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── SPA fallback ───────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

// ── Start ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Daily Bugle server running on port ${PORT}`);
});
