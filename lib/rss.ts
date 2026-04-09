import Parser from "rss-parser";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "NewsGlobe/1.0",
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
}

export async function fetchAllFeeds(): Promise<RawHeadline[]> {
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
  const results = await Promise.allSettled(
    RSS_SOURCES.map(async (src) => {
      const feed = await parser.parseURL(src.url);
      return (feed.items || [])
        .filter((item) => {
          if (!item.pubDate) return true;
          const d = new Date(item.pubDate).getTime();
          return d > twentyFourHoursAgo;
        })
        .map((item) => ({
          title: item.title || "",
          description: (item.contentSnippet || item.content || "").slice(0, 200),
          pubDate: item.pubDate || new Date().toISOString(),
          source: src.name,
        }));
    })
  );

  const headlines: RawHeadline[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      headlines.push(...result.value);
    }
  }

  return headlines;
}
