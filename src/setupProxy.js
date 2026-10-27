const { registerRoutes } = require('../server/lib/routes');

// ── Simple in-memory rate limiter ──────────────────────────────────────
const hits = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 120; // local dev only; production uses server/index.js limits

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
  if (!process.env.GNEWS_API_KEY) {
    console.warn(
      '\n' +
        '  ============================================================\n' +
        '  NOTE: GNEWS_API_KEY not set — headlines will come from the\n' +
        '  free Google News RSS feed (no images).\n' +
        '  Get a free key at https://gnews.io/register\n' +
        '  ============================================================\n'
    );
  }

  registerRoutes(app, rateLimit);
};
