const { createProxyMiddleware } = require('http-proxy-middleware');

// ── Simple in-memory rate limiter ──────────────────────────────────────
const hits = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 20;

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || 'local';
  const now = Date.now();
  const record = hits.get(ip);

  if (!record || now > record.reset) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    return next();
  }

  record.count++;
  if (record.count > MAX_REQUESTS) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }));
  }
  next();
}

// ── Setup ──────────────────────────────────────────────────────────────
module.exports = function (app) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const gnewsApiKey = process.env.GNEWS_API_KEY;

  if (!apiKey) {
    console.warn(
      '\n' +
        '  ============================================================\n' +
        '  WARNING: ANTHROPIC_API_KEY not found in environment.\n' +
        '  Create a .env file in the project root with:\n' +
        '    ANTHROPIC_API_KEY=sk-ant-your-key-here\n' +
        '  ============================================================\n'
    );
  }

  if (!gnewsApiKey) {
    console.warn(
      '\n' +
        '  ============================================================\n' +
        '  WARNING: GNEWS_API_KEY not found in environment.\n' +
        '  Add to .env: GNEWS_API_KEY=your-gnews-key\n' +
        '  Get a free key at https://gnews.io/register\n' +
        '  ============================================================\n'
    );
  }

  // ── Helper: convert GNews response → News API-compatible format ──────
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

  // ── GNews API proxy endpoints ─────────────────────────────────────────

  // GET /api/news/top-headlines?country=us&category=general&pageSize=10
  app.get('/api/news/top-headlines', rateLimit, async (req, res) => {
    try {
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

  // GET /api/news/search?q=keyword&pageSize=10
  app.get('/api/news/search', rateLimit, async (req, res) => {
    try {
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

  // ── YouTube Data API proxy ───────────────────────────────────────────

  const youtubeApiKey = process.env.YOUTUBE_API_KEY;

  // GET /api/youtube/search?q=keyword&maxResults=5
  app.get('/api/youtube/search', rateLimit, async (req, res) => {
    try {
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
      // Normalize response
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

  // ── Claude API proxy ──────────────────────────────────────────────────

  // Rate limit the API proxy
  app.use('/api/chat', rateLimit);

  // Proxy /api/chat → Anthropic /v1/messages
  app.use(
    '/api/chat',
    createProxyMiddleware({
      target: 'https://api.anthropic.com',
      changeOrigin: true,
      pathRewrite: { '^/api/chat': '/v1/messages' },
      onProxyReq: (proxyReq) => {
        if (apiKey) {
          proxyReq.setHeader('x-api-key', apiKey);
        }
        proxyReq.setHeader('anthropic-version', '2023-06-01');
        proxyReq.setHeader('anthropic-dangerous-direct-browser-access', 'true');
        // Strip browser headers so Anthropic doesn't reject as CORS
        proxyReq.removeHeader('origin');
        proxyReq.removeHeader('referer');
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err.message);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Proxy error connecting to Anthropic API' }));
      },
    })
  );
};
