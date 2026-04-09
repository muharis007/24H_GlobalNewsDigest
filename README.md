# NewsGlobe 🌍

24-hour global news intelligence dashboard. Scans ARY News, Geo TV, Arab News & BBC, summarizes with AI, displays on interactive map.

## Setup

1. Clone this repo
2. Get a free Gemini API key from https://aistudio.google.com/apikey
3. Create `.env.local` and add: `GEMINI_API_KEY=your_key_here`
4. `npm install`
5. `npm run dev`
6. Open http://localhost:3000

## Deploy to Vercel (free)

1. Push to GitHub
2. Go to vercel.com, import the repo
3. Add `GEMINI_API_KEY` as an environment variable
4. Deploy — you'll get a public URL to share

## Tech Stack

- Next.js 14 + TypeScript
- Tailwind CSS
- Leaflet + OpenStreetMap (free map tiles)
- Google Gemini 2.5 Flash (free API)
- rss-parser for RSS feeds

## Architecture

```
/app
  /api/news/route.ts   → API route: fetches RSS, calls Gemini, returns JSON
  /page.tsx             → Main page with map + sidebar
  /components
    Map.tsx             → Leaflet map with pulsing country dots
    Sidebar.tsx         → Country list + story detail panel
    Header.tsx          → Top bar with status & controls
    StoryCard.tsx       → Individual story card with category badge
    LoadingOverlay.tsx  → Scanning animation overlay
    EmptyState.tsx      → Welcome screen before first fetch
/lib
  rss.ts               → RSS feed fetcher using rss-parser
  gemini.ts            → Gemini API integration
  cache.ts             → File-based cache (TTL: 4 hours)
  countries.ts         → Country code → lat/lng mapping
/types
  news.ts              → TypeScript interfaces
```

## How It Works

1. Click **FETCH NEWS** to trigger a scan
2. The API route fetches RSS feeds from 4 sources in parallel
3. Headlines are sent to Google Gemini to categorize by country
4. Results are cached for 4 hours to avoid rate limits
5. Countries appear as pulsing dots on the map
6. Click a dot or country name to see stories
