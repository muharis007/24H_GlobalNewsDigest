# NewsGlobe

**24-Hour Global News Intelligence Dashboard**

A real-time news monitoring platform that scrapes RSS feeds from international sources, uses Google Gemini AI to categorize, summarize, and analyze sentiment, then plots everything on an interactive dark-themed world map.

Built with Next.js 14, TypeScript, Leaflet, and Tailwind CSS.

---

## Features

- **Interactive World Map** — Countries appear as pulsing dots sized by story count. Click to drill into stories. Supports default, heatmap, and sentiment visualization modes.
- **Multi-Source RSS Aggregation** — Pulls headlines from ARY News, Geo TV, Arab News, and BBC News in parallel with a 24-hour date filter.
- **AI-Powered Analysis** — Google Gemini categorizes stories by country and topic (conflict, politics, economy, sports, tech, health), detects breaking news, and assigns sentiment scores.
- **Breaking News Ticker** — Auto-scrolling marquee highlights breaking stories across all sources.
- **Search & Filter** — Full-text search and category pill filters to narrow down stories.
- **Sentiment Analysis** — Per-story and per-country sentiment indicators (positive / negative / neutral) with a map-wide sentiment overlay mode.
- **Speed Reading (Zap Me)** — A full-screen, auto-scrolling briefing that walks through every story organized by category and country. Adjustable speed (1x / 1.5x / 2x), pause/play, keyboard controls.
- **Trends Dashboard** — Category distribution bars, top countries, and trending keyword extraction.
- **News Timeline** — Historical snapshots captured on every fetch, displayed on a vertical timeline.
- **AI Chat (Ask the News)** — RAG-style Q&A powered by Gemini. Ask questions like "What's happening in Pakistan?" and get answers grounded in today's headlines.
- **Multi-Language Translation** — Translate any story into Urdu, Arabic, French, Spanish, or Chinese via Gemini.
- **Text-to-Speech** — Listen to stories using the browser's SpeechSynthesis API.
- **Share** — Share stories via the Web Share API or copy to clipboard.
- **Personalization** — Save favorite categories and countries. Favorites are sorted to the top with a star indicator.
- **Live SSE Streaming** — Real-time status updates during fetch via Server-Sent Events.
- **Offline Persistence** — News data is cached in localStorage (48-hour TTL) so stories survive page reloads without burning API quota.
- **Server-Side Caching** — File-based JSON cache with a 4-hour TTL plus timestamped snapshots (up to 12 retained).
- **Dark Theme** — Full dark UI with JetBrains Mono + Space Grotesk typography, custom accent colors, and Leaflet dark tiles.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 3.4 |
| Map | Leaflet + React-Leaflet, CartoDB Dark Matter tiles |
| AI | Google Gemini 2.5 Flash (fallback: 2.0 Flash) |
| RSS | rss-parser |
| Streaming | Server-Sent Events (ReadableStream) |
| TTS | Web SpeechSynthesis API |
| Sharing | Web Share API |
| Persistence | localStorage (client), /tmp JSON files (server) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A free [Google Gemini API key](https://aistudio.google.com/apikey)

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
3. Add `GEMINI_API_KEY` as an environment variable in project settings
4. Deploy — you'll get a public URL

---

## Project Structure

```
app/
  page.tsx                  Main client component (state, layout, orchestration)
  layout.tsx                Root layout with fonts and metadata
  globals.css               Tailwind config, Leaflet overrides, animations
  api/
    news/
      route.ts              REST endpoint: RSS -> Gemini -> cached JSON
      stream/route.ts       SSE endpoint: same pipeline with live status updates
    chat/route.ts           RAG chat: question + news context -> Gemini
    translate/route.ts      Translation via Gemini
    timeline/route.ts       Returns snapshot metadata for timeline view
  components/
    Map.tsx                 Leaflet map (heatmap, sentiment, default modes)
    Sidebar.tsx             Country list + story detail panel
    Header.tsx              Top bar with status, controls, and action buttons
    StoryCard.tsx           Story card with badges, share, listen, translate
    NewsTicker.tsx          Breaking news scrolling ticker
    SearchFilter.tsx        Text search + category pill filters
    SentimentBadge.tsx      Sentiment indicator component
    LoadingOverlay.tsx      Compact floating status bar during fetch
    ZapMe.tsx               Full-screen speed reading overlay
    TrendPanel.tsx          Category distribution + top countries + keywords
    Timeline.tsx            Historical snapshot timeline
    Preferences.tsx         Favorite categories/countries (localStorage)
    NewsChat.tsx            Chat overlay with Gemini Q&A
lib/
  rss.ts                    Parallel RSS fetcher (4 sources, 24h filter)
  gemini.ts                 Gemini API with retry logic and model fallback
  cache.ts                  /tmp file cache (4h TTL) + snapshot management
  countries.ts              Country code -> lat/lng coordinates (60+ countries)
types/
  news.ts                   TypeScript interfaces (Story, Country, NewsData, etc.)
```

---

## How It Works

1. On page load (or every 6 hours), the app connects to the SSE endpoint
2. RSS feeds from 4 sources are fetched in parallel
3. Raw headlines are sent to Gemini with a structured prompt requesting country mapping, categorization, sentiment analysis, and breaking news detection
4. Gemini's JSON response is parsed, validated, and enriched with original article links
5. Results are cached server-side (4h) and client-side (48h) to minimize API usage
6. Countries appear as pulsing dots on the map — click to explore stories
7. Chat, translation, and TTS features query Gemini or browser APIs on demand

---

## License

MIT

---

Built by **Muhammad Haris**
