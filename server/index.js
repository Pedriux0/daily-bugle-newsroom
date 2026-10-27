const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { registerRoutes } = require('./lib/routes');

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

// ── API routes (news, YouTube, local AI) ───────────────────────────────
registerRoutes(app, apiLimiter);

// ── SPA fallback ───────────────────────────────────────────────────────
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

// ── Start ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Daily Bugle server running on port ${PORT}`);
});
