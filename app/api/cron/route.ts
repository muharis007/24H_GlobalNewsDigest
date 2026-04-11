import { NextResponse } from "next/server";
import { fetchAllFeeds } from "@/lib/rss";
import { summarizeNews } from "@/lib/gemini";
import { getCachedData, setCachedData } from "@/lib/cache";
import { NewsData } from "@/types/news";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  // Verify this is a legitimate cron call (Vercel sets this header)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow if no CRON_SECRET is set (development) or if called from Vercel cron
    const isVercelCron = request.headers.get("x-vercel-cron") === "true" ||
                         request.headers.get("user-agent")?.includes("vercel-cron");
    if (process.env.CRON_SECRET && !isVercelCron) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Skip if cache is still fresh (< 5 hours, leaving 1h buffer)
  const cached = await getCachedData();
  if (cached) {
    console.log("[Cron] Cache still fresh, skipping fetch");
    return NextResponse.json({ status: "skipped", reason: "cache_fresh" });
  }

  console.log("[Cron] Cache expired, starting RSS + AI pipeline...");

  try {
    const { items: headlines } = await fetchAllFeeds();
    console.log(`[Cron] Got ${headlines.length} headlines`);

    if (headlines.length === 0) {
      return NextResponse.json({ status: "error", reason: "no_headlines" });
    }

    const capped = headlines.slice(0, 30);
    const formatted = capped
      .map((h, i) => `${i + 1}. [${h.source}] ${h.title}\n   ${h.description}`)
      .join("\n\n");

    const linkMap = new Map<string, string>();
    for (const h of headlines) {
      if (h.link) linkMap.set(h.title.toLowerCase().trim(), h.link);
    }

    let rawResponse: string;
    try {
      rawResponse = await summarizeNews(formatted);
    } catch {
      const smaller = headlines.slice(0, 15);
      const smallFormatted = smaller
        .map((h, i) => `${i + 1}. [${h.source}] ${h.title}\n   ${h.description}`)
        .join("\n\n");
      rawResponse = await summarizeNews(smallFormatted);
    }

    let jsonStr = rawResponse.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch) jsonStr = fenceMatch[1];

    const data: NewsData = JSON.parse(jsonStr);

    for (const country of data.countries) {
      for (const story of country.stories) {
        const key = story.headline.toLowerCase().trim();
        if (linkMap.has(key)) {
          story.link = linkMap.get(key);
        } else {
          const entries = Array.from(linkMap.entries());
          for (const [title, link] of entries) {
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

    const storyCount = data.countries.reduce((sum, c) => sum + c.stories.length, 0);
    console.log(`[Cron] Cached ${data.countries.length} countries, ${storyCount} stories`);

    return NextResponse.json({
      status: "ok",
      countries: data.countries.length,
      stories: storyCount,
      updated_at: data.updated_at,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Cron] Error:", msg);
    return NextResponse.json({ status: "error", reason: msg }, { status: 500 });
  }
}
