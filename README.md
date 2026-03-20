# Daily Bugle AI Newsroom

A dual-identity AI newsroom app inspired by Spider-Man. The app transforms between **Peter Parker Mode** (Daily Bugle newspaper) and **Spider-Man Mode** (tactical command center) with a complete UI, AI persona, and content overhaul.

## Design

The UI for both modes was designed in **Figma** and then implemented pixel-by-pixel with Tailwind CSS:

- **Peter Parker Mode** — Warm newspaper aesthetic with yellows, cream, and ink black. Serif typography, halftone textures, comic panel article cards.
- **Spider-Man Mode** — Dark tactical HUD with navy, neon red, and electric blue. Monospace tech typography, circuit line patterns, glowing data widgets.

## Features

### Dual-Mode System
Toggle between two completely different identities with a single button:

| Feature | Peter Parker Mode | Spider-Man Mode |
|---------|------------------|-----------------|
| **Theme** | Warm newspaper (yellows, cream) | Dark tactical HUD (navy, neon red) |
| **AI Persona** | J. Jonah Jameson (angry editor) | Spider-Sense Threat Analyst (cold, tactical) |
| **News Feed** | General US headlines | Crime & security focused news |
| **Layout** | Newspaper grid with comic panels | Dashboard with data widgets |
| **Cursor Effect** | Ink splatter particles | Glowing neon web strands |
| **Job Board** | - | Recruitment Terminal (Spider-Man jobs) |

### AI-Powered Editorial Desk
- **Claude AI (Haiku 4.5)** with web search tool rewrites real news through two personas
- **J. Jonah Jameson** — Rewrites any topic with anti-Spider-Man bias, sensationalist headlines, and angry editorial takes
- **Spider-Sense Threat Analyst** — Classifies threats by severity (Green/Yellow/Red), delivers tactical intelligence briefings
- Structured JSON output with graceful fallback parsing
- Token-optimized: trimmed prompts, `max_uses: 1` on web search, 768 max_tokens

### Real-Time Data Integrations
- **GNews API** — Real headlines for both modes (general + crime/security). Free tier: 100 req/day
- **YouTube Data API v3** — Live crime news video feed with inline embedded player. Free tier: 10,000 units/day
- **NYC Open Data 311** — Real-time community reports from actual New Yorkers (noise complaints, emergencies, street issues). Completely free, no API key needed
- **Animated Stats Panel** — Live-updating numbers (sightings, lives saved, crimes stopped) with flash animations

### Interactive Features
- **Cinematic Splash Screen** — 4-second intro with web animations and screen shake
- **Theme Song** — Spectacular Spider-Man (2008) intro via YouTube IFrame API (audio only)
- **Web-Shooter Cursor** — Canvas 2D overlay with two modes: ink splatter (Peter) and neon web strand (Spider-Man)
- **Recruitment Terminal** — AI-generated job listings Spider-Man would apply for (cybersecurity, stunt performer, pest control, etc.)
- **Info Button** — Glasses icon with topic suggestion chips to guide users
- **Uncle Ben Memorial** — "With great power comes great responsibility" tribute in Spider-Man mode
- **FX Toggle** — Enable/disable cursor effects

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 19 + TypeScript | Frontend framework |
| Tailwind CSS 3 | Styling (utility-first) |
| Claude AI (Haiku 4.5) | AI editorial desk + job generation |
| GNews API | Real news headlines |
| YouTube Data API v3 | Crime news video feed |
| NYC Open Data (SODA) | Real-time 311 community reports |
| YouTube IFrame API | Theme song audio player |
| HTML5 Canvas 2D | Cursor trail effects |
| Express.js | Production server + API proxy |
| Google Fonts | Bangers, Courier Prime, Space Mono |
| Lucide React | Icons |

## Architecture

```
Browser (React SPA)
    |
    |-- /api/chat ---------> Express Proxy ---------> Anthropic API (Claude)
    |-- /api/news/* -------> Express Proxy ---------> GNews API
    |-- /api/youtube/* ----> Express Proxy ---------> YouTube Data API
    |-- NYC 311 -----------> Direct fetch ----------> data.cityofnewyork.us (no key)
    |-- YouTube IFrame ----> Direct embed ----------> youtube.com (audio only)
```

All API keys are kept server-side in the Express proxy. The frontend never touches secrets.

## Project Structure

```
src/
├── App.tsx                          # Root: splash -> dual-mode app
├── App.css                          # Splash, transitions, mode toggle styles
├── components/
│   ├── SplashScreen.tsx             # Cinematic 4-second intro
│   ├── ModeToggle.tsx               # Logo button (suit up / mask off)
│   ├── WebShooterCursor.tsx         # Canvas cursor overlay
│   ├── bugle/                       # Peter Parker mode components
│   │   ├── BugleHeader.tsx          # Newspaper masthead
│   │   ├── BugleMainStory.tsx       # AI editorial desk + search
│   │   ├── BugleSecondaryStories.tsx# Real news grid
│   │   ├── BugleOpinionSection.tsx  # Static Jameson editorial
│   │   └── BugleFooter.tsx          # Newspaper footer
│   ├── spidey/                      # Spider-Man mode components
│   │   ├── SpideyHeader.tsx         # SPIDEY.WATCH HUD header
│   │   ├── StatsPanel.tsx           # Animated live stats
│   │   ├── SpideyFeaturedStory.tsx  # AI threat scanner + search
│   │   ├── NewsGrid.tsx             # Crime news grid
│   │   ├── LiveFeed.tsx             # YouTube crime video feed
│   │   ├── CommunitySection.tsx     # NYC 311 real-time reports
│   │   ├── JobBoard.tsx             # AI recruitment terminal
│   │   ├── UncleBenReminder.tsx     # Uncle Ben memorial
│   │   ├── WebPattern.tsx           # SVG web background
│   │   └── SpideyFooter.tsx         # Tactical footer
│   └── shared/
│       └── ImageWithFallback.tsx    # Image with error fallback
├── hooks/
│   ├── useClaudeAPI.ts              # Anthropic API integration
│   ├── useNewsAPI.ts                # GNews headline fetcher
│   ├── useYouTubeNews.ts            # YouTube video search
│   ├── useYouTubePlayer.ts          # Theme song player
│   ├── useNYC311.ts                 # NYC Open Data 311 reports
│   ├── useJobSearch.ts              # AI job listing generator
│   └── useWebShooter.ts            # Canvas cursor trail logic
├── prompts/
│   ├── jameson.ts                   # Jameson AI system prompt
│   └── threatAnalyst.ts            # Threat analyst system prompt
├── utils/
│   └── parseArticle.ts             # JSON parser + citation stripper
└── types/
    └── news.ts                      # ArticleData, ThreatData, NewsApiArticle
```

## Getting Started

### Prerequisites
- Node.js 18+
- API keys (all free tiers available)

### Installation

```bash
git clone https://github.com/Pedriux0/daily-bugle-newsroom.git
cd daily-bugle-newsroom
npm install --legacy-peer-deps
```

### Environment Setup

Copy the example env file and add your keys:

```bash
cp .env.example .env
```

Edit `.env` with your keys:
```env
ANTHROPIC_API_KEY=sk-ant-your-key    # https://console.anthropic.com
GNEWS_API_KEY=your-gnews-key         # https://gnews.io/register
YOUTUBE_API_KEY=your-youtube-key     # https://console.cloud.google.com/apis
```

### Development

```bash
npm start
```

Opens at [http://localhost:3000](http://localhost:3000). The dev proxy handles API routing automatically.

### Production Build & Deploy

```bash
npm run build
npm run serve
```

The Express server serves the React build and proxies all API calls on port 3001.

For VPS deployment with PM2:
```bash
npm install -g pm2
pm2 start server/index.js --name daily-bugle
pm2 save && pm2 startup
```

## API Cost Optimization

The app is optimized to minimize API costs:
- **Model**: Claude Haiku 4.5 (10x cheaper than Sonnet)
- **Web search**: Limited to `max_uses: 1` per call
- **max_tokens**: Capped at 768 (responses are short)
- **System prompts**: Trimmed to ~200 tokens each
- **Job search**: No web search tool (pure generation)
- **NYC 311 + YouTube**: Free APIs with no token cost
- **Estimated cost**: ~$0.001 per editorial search

## What I Learned

This project was built to learn about:
1. **API Keys** — Managing multiple API keys, proxying through a backend, rate limiting, .env security
2. **AI Agents** — Same model (Claude), completely different behavior through system prompts and tool configuration
3. **MCPs** — Attempted Indeed MCP integration (learned it's a Claude Desktop feature, not API), used NYC Open Data as an alternative external data source
4. **Token Economics** — Prompt optimization, max_tokens tuning, web search cost control
5. **Real-time Data** — Integrating 5 external APIs (Anthropic, GNews, YouTube, NYC Open Data, YouTube IFrame) into a single app

## License

MIT

---

*"With great power comes great responsibility." — Uncle Ben*
