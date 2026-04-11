import Parser from "rss-parser";

const parser = new Parser({
  timeout: 7000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; NewsGlobe/1.0; +https://newsglobe.vercel.app)",
  },
});

export const RSS_SOURCES = [
  { url: "https://arynews.tv/feed/", name: "ARY News" },
  { url: "https://www.geo.tv/rss/1/1", name: "Geo TV" },
  { url: "https://www.arabnews.com/rss.xml", name: "Arab News" },
  { url: "https://feeds.bbci.co.uk/news/rss.xml", name: "BBC News" },
];

export interface RawHeadline {
  title: string;
  description: string;
  pubDate: string;
  source: string;
  link: string;
}

function isWithin24Hours(item: { pubDate?: string; isoDate?: string }): boolean {
  if (!item.pubDate && !item.isoDate) return true;
  const date = new Date(item.isoDate || item.pubDate || "");
  if (isNaN(date.getTime())) return true;
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
  return date.getTime() > twentyFourHoursAgo;
}

async function fetchFeedWithTimeout(url: string, timeoutMs = 7000): Promise<Parser.Output<Record<string, unknown>>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; NewsGlobe/1.0; +https://newsglobe.vercel.app)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    const text = await response.text();
    return await parser.parseString(text);
  } finally {
    clearTimeout(timeout);
  }
}

interface FeedResult {
  source: string;
  status: "ok" | "error";
  count: number;
  error?: string;
}

export async function fetchAllFeeds(): Promise<{ items: RawHeadline[]; feedResults: FeedResult[] }> {
  const feedResults: FeedResult[] = [];

  const results = await Promise.allSettled(
    RSS_SOURCES.map(async (src) => {
      try {
        const feed = await fetchFeedWithTimeout(src.url);
        const items = (feed.items || [])
          .filter((item) => isWithin24Hours(item))
          .map((item) => ({
            title: item.title || "",
            description: (item.contentSnippet || item.content || "").slice(0, 200),
            pubDate: item.isoDate || item.pubDate || new Date().toISOString(),
            source: src.name,
            link: item.link || "",
          }));
        feedResults.push({ source: src.name, status: "ok", count: items.length });
        return items;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[RSS] Failed to fetch ${src.name} (${src.url}):`, errMsg);
        feedResults.push({ source: src.name, status: "error", count: 0, error: errMsg });
        return [];
      }
    })
  );

  const headlines: RawHeadline[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      headlines.push(...result.value);
    }
  }

  console.log("[RSS] Feed results:", JSON.stringify(feedResults));
  return { items: headlines, feedResults };
}
