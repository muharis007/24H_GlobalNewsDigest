import { NextResponse } from "next/server";
import { fetchAllFeeds } from "@/lib/rss";
import { summarizeNews } from "@/lib/gemini";
import { getCachedData, getCachedDataStale, setCachedData } from "@/lib/cache";
import { NewsData } from "@/types/news";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "true";

  // Check cache first
  if (!forceRefresh) {
    const cached = await getCachedData();
    if (cached) {
      return NextResponse.json(cached);
    }
  }

  try {
    // Fetch all RSS feeds
    console.log("[NewsGlobe] Fetching RSS feeds...");
    const { items: headlines } = await fetchAllFeeds();
    console.log(`[NewsGlobe] Got ${headlines.length} headlines`);

    if (headlines.length === 0) {
      const stale = await getCachedDataStale();
      if (stale) {
        return NextResponse.json(stale);
      }
      return NextResponse.json(
        { countries: [], updated_at: new Date().toISOString() } as NewsData
      );
    }

    // Format headlines for Gemini (cap at 15 to stay within rate limits)
    const capped = headlines.slice(0, 15);
    const formatHeadlines = (items: typeof capped) =>
      items.map((h, i) => `${i + 1}. [${h.source}] ${h.title}\n   ${h.description}`).join("\n\n");

    // Build a title→link lookup for post-processing
    const linkMap = new Map<string, string>();
    const sourceLinkMap = new Map<string, { title: string; link: string }[]>();
    for (const h of headlines) {
      if (h.link) {
        linkMap.set(h.title.toLowerCase().trim(), h.link);
        if (!sourceLinkMap.has(h.source)) sourceLinkMap.set(h.source, []);
        sourceLinkMap.get(h.source)!.push({ title: h.title.toLowerCase().trim(), link: h.link });
      }
    }

    let rawResponse: string;
    try {
      console.log(`[NewsGlobe] Sending ${capped.length} headlines to Gemini...`);
      rawResponse = await summarizeNews(formatHeadlines(capped));
    } catch {
      // If full batch fails, try with fewer headlines
      console.log("[NewsGlobe] Full batch failed, trying with 15 headlines...");
      const smaller = headlines.slice(0, 15);
      rawResponse = await summarizeNews(formatHeadlines(smaller));
    }
    console.log("[NewsGlobe] Gemini response length:", rawResponse.length);

    // Parse JSON from response - strip markdown fences if present
    let jsonStr = rawResponse.trim();
    // Remove markdown code fences
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1];
    }

    const data: NewsData = JSON.parse(jsonStr);

    // Inject original article links by matching headlines
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

        // Fallback: try the old linkMap approach if no links found
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

    // Ensure updated_at is set
    if (!data.updated_at) {
      data.updated_at = new Date().toISOString();
    }

    // Cache the result
    await setCachedData(data);

    return NextResponse.json(data);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[NewsGlobe] Error:", msg);

    const isQuotaError = msg.includes("429") || msg.includes("quota");

    // Try to return stale cache on error
    const stale = await getCachedDataStale();
    if (stale) {
      return NextResponse.json({
        ...stale,
        error: isQuotaError ? "API quota exhausted. Showing cached data." : undefined,
      });
    }

    return NextResponse.json(
      {
        error: isQuotaError
          ? "API quota exhausted. Free tier limit reached — news will refresh automatically when the quota resets."
          : msg,
        countries: [],
        updated_at: new Date().toISOString(),
      },
      { status: isQuotaError ? 429 : 500 }
    );
  }
}
