import { fetchAllFeeds } from "@/lib/rss";
import { summarizeNews } from "@/lib/gemini";
import { getCachedData, getCachedDataStale, setCachedData } from "@/lib/cache";
import { NewsData } from "@/types/news";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function sseMessage(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseMessage(event, data)));
      };

      try {
        // Check cache first
        const cached = await getCachedData();
        if (cached) {
          send("status", { step: "cache-hit", message: "Using cached data" });
          send("done", cached);
          controller.close();
          return;
        }

        send("status", { step: "rss", message: "Fetching RSS feeds..." });
        const { items: headlines } = await fetchAllFeeds();
        send("status", { step: "rss-done", message: `Got ${headlines.length} headlines` });

        if (headlines.length === 0) {
          const stale = await getCachedDataStale();
          send("done", stale ?? { countries: [], updated_at: new Date().toISOString() });
          controller.close();
          return;
        }

        const capped = headlines.slice(0, 30);
        const formatHeadlines = (items: typeof capped) =>
          items.map((h, i) => `${i + 1}. [${h.source}] ${h.title}\n   ${h.description}`).join("\n\n");

        // Build link map
        const linkMap = new Map<string, string>();
        const sourceLinkMap = new Map<string, { title: string; link: string }[]>();
        for (const h of headlines) {
          if (h.link) {
            linkMap.set(h.title.toLowerCase().trim(), h.link);
            if (!sourceLinkMap.has(h.source)) sourceLinkMap.set(h.source, []);
            sourceLinkMap.get(h.source)!.push({ title: h.title.toLowerCase().trim(), link: h.link });
          }
        }

        send("status", { step: "ai", message: "Analyzing with Gemini AI..." });

        let rawResponse: string;
        try {
          rawResponse = await summarizeNews(formatHeadlines(capped));
        } catch {
          send("status", { step: "retry", message: "Retrying with fewer headlines..." });
          const smaller = headlines.slice(0, 15);
          rawResponse = await summarizeNews(formatHeadlines(smaller));
        }

        send("status", { step: "parsing", message: "Processing results..." });

        let jsonStr = rawResponse.trim();
        const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (fenceMatch) jsonStr = fenceMatch[1];

        const data: NewsData = JSON.parse(jsonStr);

        // Inject links
        for (const country of data.countries) {
          for (const story of country.stories) {
            const key = story.headline.toLowerCase().trim();
            const sources = story.source.split(/,\s*/);
            const foundLinks: { source: string; url: string }[] = [];

            for (const src of sources) {
              const srcEntries = sourceLinkMap.get(src);
              if (srcEntries) {
                const exact = srcEntries.find(e => e.title === key);
                if (exact) {
                  foundLinks.push({ source: src, url: exact.link });
                  continue;
                }
                const partial = srcEntries.find(e =>
                  key.includes(e.title.substring(0, 30)) || e.title.includes(key.substring(0, 30))
                );
                if (partial) {
                  foundLinks.push({ source: src, url: partial.link });
                }
              }
            }

            if (foundLinks.length === 0) {
              if (linkMap.has(key)) {
                foundLinks.push({ source: sources[0], url: linkMap.get(key)! });
              } else {
                const entries = Array.from(linkMap.entries());
                for (const [title, link] of entries) {
                  if (key.includes(title.substring(0, 30)) || title.includes(key.substring(0, 30))) {
                    foundLinks.push({ source: sources[0], url: link });
                    break;
                  }
                }
              }
            }

            if (foundLinks.length > 0) {
              story.link = foundLinks[0].url;
              const seen = new Set<string>();
              story.links = foundLinks.filter(l => {
                if (seen.has(l.url)) return false;
                seen.add(l.url);
                return true;
              });
            }
          }
        }

        if (!data.updated_at) data.updated_at = new Date().toISOString();
        await setCachedData(data);

        send("done", data);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        const isQuota = msg.includes("429") || msg.includes("quota");

        const stale = await getCachedDataStale();
        if (stale) {
          send("done", {
            ...stale,
            error: isQuota ? "API quota exhausted. Showing cached data." : msg,
          });
        } else {
          send("error", {
            error: isQuota
              ? "API quota exhausted. Free tier limit reached."
              : msg,
          });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
