import { NextResponse } from "next/server";
import { summarizeNews } from "@/lib/gemini";
import { getCachedData, getCachedDataStale, setCachedData } from "@/lib/cache";
import { NewsData, Country, Story } from "@/types/news";
import { RawHeadline } from "@/lib/rss";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function parseLenientJSON(text: string): NewsData | null {
  // Try direct parse
  try { return JSON.parse(text); } catch {}

  // Try extracting JSON block
  const match = text.match(/\{[\s\S]*"countries"[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }

  // Try removing markdown fences
  const cleaned = text.replace(/```json\n?|```\n?/g, "").trim();
  try { return JSON.parse(cleaned); } catch {}

  return null;
}

function similarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  const intersection = Array.from(wordsA).filter(w => wordsB.has(w));
  return intersection.length / Math.max(wordsA.size, wordsB.size);
}

function deduplicateStories(countries: Country[]): Country[] {
  return countries.map(country => ({
    ...country,
    stories: country.stories.reduce((acc: Story[], story: Story) => {
      const existing = acc.find(e => similarity(e.headline, story.headline) > 0.7);
      if (existing) {
        if (!existing.source.includes(story.source)) {
          existing.source += `, ${story.source}`;
        }
        return acc;
      }
      return [...acc, story];
    }, [])
  }));
}

const VALID_CODES = new Set([
  "PAK", "SAU", "GBR", "USA", "IND", "CHN", "RUS", "IRN", "ISR", "UKR",
  "AFG", "IRQ", "SYR", "TUR", "EGY", "FRA", "DEU", "JPN", "KOR", "AUS",
  "PSE", "LBN", "ARE", "QAT", "KWT", "OMN", "BHR", "YEM", "JOR", "LBY",
  "SDN", "SOM", "NGA", "ZAF", "BRA", "MEX", "CAN", "ITA", "ESP", "POL",
  "NLD", "BEL", "GRC", "BGD", "LKA", "MMR", "THA", "VNM", "IDN", "MYS",
  "PHL", "PRK", "TWN", "ARG", "COL", "VEN", "CHL", "PER", "ETH", "KEN",
  "GHA", "MAR", "TUN", "DZA",
]);

const NAME_TO_CODE: Record<string, string> = {
  pakistan: "PAK", india: "IND", "united kingdom": "GBR", uk: "GBR",
  "united states": "USA", us: "USA", america: "USA",
  "saudi arabia": "SAU", china: "CHN", russia: "RUS",
  iran: "IRN", israel: "ISR", ukraine: "UKR",
  palestine: "PSE", gaza: "PSE", "west bank": "PSE",
  afghanistan: "AFG", iraq: "IRQ", syria: "SYR",
  turkey: "TUR", turkiye: "TUR", egypt: "EGY",
  france: "FRA", germany: "DEU", japan: "JPN",
  "south korea": "KOR", australia: "AUS", lebanon: "LBN",
  "united arab emirates": "ARE", uae: "ARE", qatar: "QAT",
  bangladesh: "BGD", "sri lanka": "LKA", myanmar: "MMR",
  brazil: "BRA", mexico: "MEX", canada: "CAN",
  italy: "ITA", spain: "ESP", nigeria: "NGA",
  "south africa": "ZAF",
};

function guessCountryCode(name: string): string | null {
  return NAME_TO_CODE[name.toLowerCase()] || null;
}

function validateCountries(data: NewsData): NewsData {
  return {
    ...data,
    countries: data.countries
      .filter(c => c.name && c.stories.length > 0)
      .map(c => ({
        ...c,
        code: VALID_CODES.has(c.code) ? c.code : (guessCountryCode(c.name) || c.code)
      }))
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const headlines: RawHeadline[] = body.headlines;

    if (!headlines || headlines.length === 0) {
      return NextResponse.json({ error: "No headlines provided", countries: [], updated_at: new Date().toISOString() }, { status: 400 });
    }

    // Return fresh server-side cache if available (avoids redundant Gemini calls from multiple visitors)
    const freshCache = await getCachedData();
    if (freshCache) {
      console.log("[Summarize] Returning fresh server-side cached data");
      return NextResponse.json(freshCache);
    }

    // Also return stale cache if it exists -- the client should not be calling this within 6 hours
    const staleCache = await getCachedDataStale();
    if (staleCache && staleCache.updated_at) {
      const cacheAge = Date.now() - new Date(staleCache.updated_at).getTime();
      if (cacheAge < 6 * 60 * 60 * 1000) {
        console.log("[Summarize] Returning stale cache (still within 6h window)");
        return NextResponse.json(staleCache);
      }
    }

    // Build link map for post-processing
    const linkMap = new Map<string, string>();
    for (const h of headlines) {
      if (h.link) linkMap.set(h.title.toLowerCase().trim(), h.link);
    }

    // Format headlines for Gemini (cap at 15 to fit within Vercel Hobby 10s limit)
    const capped = headlines.slice(0, 15);
    const formatHeadlines = (items: RawHeadline[]) =>
      items.map((h, i) => `${i + 1}. [${h.source}] ${h.title}\n   ${h.description}`).join("\n\n");

    let rawResponse: string;
    try {
      console.log(`[Summarize] Sending ${capped.length} headlines to Gemini...`);
      rawResponse = await summarizeNews(formatHeadlines(capped));
    } catch {
      // If full batch fails, try with fewer headlines
      console.log("[Summarize] Full batch failed, trying with 8 headlines...");
      const smaller = headlines.slice(0, 8);
      rawResponse = await summarizeNews(formatHeadlines(smaller));
    }

    // Parse JSON
    let data = parseLenientJSON(rawResponse);
    if (!data) {
      console.error("[Summarize] Failed to parse Gemini response");
      // Return stale cache if available
      const stale = await getCachedDataStale();
      if (stale) {
        return NextResponse.json({ ...stale, error: "AI returned malformed data. Showing cached results.", fallback: true });
      }
      return NextResponse.json(
        { error: "AI returned malformed data.", countries: [], updated_at: new Date().toISOString(), fallback: false },
        { status: 500 }
      );
    }

    // Validate country codes
    data = validateCountries(data);

    // Deduplicate stories
    data.countries = deduplicateStories(data.countries);

    // Inject original article links
    for (const country of data.countries) {
      for (const story of country.stories) {
        const key = story.headline.toLowerCase().trim();
        if (linkMap.has(key)) {
          story.link = linkMap.get(key);
        } else {
          for (const [title, link] of Array.from(linkMap.entries())) {
            if (key.includes(title.substring(0, 30)) || title.includes(key.substring(0, 30))) {
              story.link = link;
              break;
            }
          }
        }
      }
    }

    if (!data.updated_at) data.updated_at = new Date().toISOString();
    await setCachedData(data);

    return NextResponse.json(data);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Summarize] Error:", msg);

    const isQuota = msg.includes("429") || msg.includes("quota");
    const stale = await getCachedDataStale();

    if (stale) {
      return NextResponse.json({
        ...stale,
        error: isQuota ? "API quota exhausted. Showing cached data." : msg,
        fallback: true,
      });
    }

    return NextResponse.json(
      {
        error: isQuota
          ? "API quota exhausted. Free tier limit reached."
          : msg,
        countries: [],
        updated_at: new Date().toISOString(),
        fallback: false,
      },
      { status: isQuota ? 429 : 500 }
    );
  }
}
