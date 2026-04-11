# NewsGlobe

**24-Hour Global News Intelligence Dashboard**

A news monitoring platform that aggregates RSS feeds from international sources, uses Google Gemini AI to categorize, summarize, and analyze sentiment, then plots everything on an interactive world map with a newspaper-inspired UI.

Built with Next.js 14, TypeScript, Leaflet, Tailwind CSS, and Upstash Redis.

**Live:** [24-h-global-news-digest.vercel.app](https://24-h-global-news-digest.vercel.app/)

---

## Features

### Core
- **Interactive World Map** — Countries appear as pulsing dots sized by story count. Click to drill into stories. Three visualization modes: default, heatmap, and sentiment overlay.
- **Multi-Source RSS Aggregation** — Pulls headlines from ARY News, Geo TV, Arab News, and BBC News in parallel with a 24-hour recency filter.
- **AI-Powered Analysis** — Google Gemini categorizes stories by country and topic (conflict, politics, economy, sports, tech, health), detects breaking news, and assigns sentiment scores.
- **Light & Dark Theme** — Full theme toggle with CSS custom properties. Light mode uses warm parchment tones; dark mode uses navy/slate with cyan accents. Map tiles automatically adapt via CSS filter inversion.

### News Consumption
- **Breaking News Ticker** — Auto-scrolling marquee highlights breaking stories across all sources.
- **Search & Filter** — Full-text headline/summary search and colored category pill filters.
- **Sentiment Analysis** — Per-story and per-country sentiment indicators (positive / negative / neutral) with a dedicated map sentiment overlay and legend.
- **Speed Reading (Zap Me)** — Full-screen auto-scrolling briefing organized by category and country. Conflict zones prioritized. Adjustable speed (1x / 1.5x / 2x), pause/play, keyboard controls (Space / Escape), progress bar, and read time estimate.
- **Trends Dashboard** — Category distribution bars, top 8 countries tag cloud, and trending keyword extraction (NLP-lite with stopword filtering).
- **News Timeline** — Historical snapshots captured on every fetch (up to 12 retained), displayed on a vertical timeline with timestamps and story counts.

### AI Features
- **AI Chat (Ask the News)** — RAG-style Q&A powered by Gemini. Ask questions like "What's happening in Pakistan?" and get answers grounded in today's headlines.
- **Multi-Language Translation** — Translate any story into Urdu, Arabic, French, Spanish, or Chinese via Gemini.
- **Text-to-Speech** — Listen to stories using the browser's SpeechSynthesis API.

### Sharing & Personalization
- **Share** — Share stories via the Web Share API (mobile) or copy to clipboard with AI disclaimer.
- **Personalization** — Save favorite categories and countries. Favorites are sorted to the top with a star indicator.

### Infrastructure
- **Upstash Redis Caching** — Shared server-side cache via Upstash Redis. 24-hour fresh TTL with 7-day expiry. Stale data served as fallback on API errors. All devices/browsers see the same cached data.
- **Vercel Cron Jobs** — Automatic background news refresh (configured for every 6 hours) so the cache stays fresh without requiring a visitor to trigger it.
- **Graceful Degradation** — Stale cache fallback on errors, per-feed resilience via `Promise.allSettled`, Gemini model fallback chain (2.5 Flash → 2.0 Flash), lenient JSON parsing, and story deduplication.
- **Responsive Design** — Mobile sidebar (bottom sheet with grab handle), hamburger menu, and touch-friendly map controls.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 3.4 |
| Map | Leaflet, CartoDB tile layers |
| AI | Google Gemini 2.5 Flash (fallback: 2.0 Flash) |
| Cache | Upstash Redis |
| RSS | rss-parser |
| Streaming | Server-Sent Events (ReadableStream) |
| TTS | Web SpeechSynthesis API |
| Sharing | Web Share API |
| Hosting | Vercel (with Cron Jobs) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A free [Google Gemini API key](https://aistudio.google.com/apikey)
- An [Upstash Redis](https://upstash.com/) database (free tier)

### Installation

```bash
git clone https://github.com/muharis007/24H_GlobalNewsDigest.git
cd 24H_GlobalNewsDigest
npm install
```

### Configuration

Create a `.env.local` file in the project root:

```
GEMINI_API_KEY=your_gemini_api_key_here
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

1. Push to GitHub
2. Import the repo at [vercel.com](https://vercel.com)
3. Add the following environment variables in project settings:
   - `GEMINI_API_KEY`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. Deploy — the cron job (`vercel.json`) will be automatically registered

> **Note:** On the Vercel Hobby (free) plan, cron jobs run once per day. Upgrade to Pro for the full every-6-hours schedule.

---

## Project Structure

```
app/
  page.tsx                  Main client component (state, fetch logic, layout)
  layout.tsx                Root layout with fonts, metadata, and ThemeProvider
  globals.css               Tailwind config, Leaflet overrides, animations, theme styles
  contexts/
    ThemeContext.tsx         Light/dark theme provider with CSS custom properties
  api/
    news/
      route.ts              REST endpoint: cache check → RSS → Gemini → Redis
      stream/route.ts       SSE endpoint: same pipeline with live status events
      cached/route.ts       Returns cached data from Redis (ignores freshness)
    rss/route.ts            Raw RSS feed fetcher with per-feed diagnostics
    summarize/route.ts      Headlines → Gemini summarization with deduplication
    chat/route.ts           RAG chat: question + news context → Gemini
    translate/route.ts      Translation via Gemini (5 languages)
    timeline/route.ts       Returns snapshot metadata for timeline view
    cron/route.ts           Vercel Cron handler for background news refresh
  components/
    Map.tsx                 Leaflet map (default, heatmap, sentiment modes)
    Sidebar.tsx             Country list + story detail panel
    Header.tsx              Newspaper-style masthead with controls
    StoryCard.tsx           Story card with share, listen, translate actions
    NewsTicker.tsx          Breaking news scrolling ticker
    SearchFilter.tsx        Text search + category pill filters
    SentimentBadge.tsx      Sentiment indicator + map legend
    LoadingOverlay.tsx      Floating status bar with rotating messages
    ZapMe.tsx               Full-screen speed reading overlay
    TrendPanel.tsx          Category distribution + countries + keywords
    Timeline.tsx            Historical snapshot timeline
    Preferences.tsx         Favorite categories/countries settings
    NewsChat.tsx            Chat overlay with Gemini Q&A
    EmptyState.tsx          Shown when no data loaded
    ErrorBanner.tsx         Dismissible error/warning/info banner
lib/
  rss.ts                    Parallel RSS fetcher (4 sources, 7s timeout, resilient)
  gemini.ts                 Gemini API with retry logic and model fallback chain
  cache.ts                  Upstash Redis cache (24h fresh, 7-day expiry, snapshots)
  countries.ts              Country code → lat/lng coordinates (65 countries)
types/
  news.ts                   TypeScript interfaces (Story, Country, NewsData, etc.)
  css.d.ts                  CSS module type declarations
vercel.json                 Cron job configuration (every 6 hours)
```

---

## How It Works

1. **Cron or visitor triggers a fetch** — Vercel Cron runs the pipeline automatically (daily on Hobby, every 6h on Pro). If the cache has expired when a user visits, the client triggers it instead.
2. **Cache-first loading** — On page load, the client checks `/api/news/cached` for existing Redis data. If found, it's displayed instantly with no API calls.
3. **RSS aggregation** — If no cache exists, RSS feeds from 4 international sources are fetched in parallel with per-feed error isolation.
4. **AI summarization** — Headlines are sent to Gemini with a structured prompt requesting country mapping, categorization, sentiment analysis, and breaking news detection.
5. **Caching & storage** — Parsed results are stored in Upstash Redis (24h fresh TTL, 7-day expiry) and a snapshot is pushed to the timeline history.
6. **Map rendering** — Countries appear as pulsing dots on the Leaflet map. Click to explore stories in the sidebar.
7. **On-demand AI** — Chat, translation, and TTS features query Gemini or browser APIs when the user requests them.

---

## License

MIT

---

Built by **Muhammad Haris**
