import { NextResponse } from "next/server";
import { fetchAllFeeds, RawHeadline } from "@/lib/rss";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

const RSS_CACHE_FILE = path.join("/tmp", "newsglobe", "rss-cache.json");
const RSS_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface RSSCache {
  items: RawHeadline[];
  timestamp: number;
}

function getCachedRSS(): RSSCache | null {
  try {
    if (!existsSync(RSS_CACHE_FILE)) return null;
    const raw = readFileSync(RSS_CACHE_FILE, "utf-8");
    const cache: RSSCache = JSON.parse(raw);
    if (Date.now() - cache.timestamp < RSS_CACHE_TTL) return cache;
    return null;
  } catch {
    return null;
  }
}

function setCachedRSS(items: RawHeadline[]): void {
  try {
    const dir = path.dirname(RSS_CACHE_FILE);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(RSS_CACHE_FILE, JSON.stringify({ items, timestamp: Date.now() }), "utf-8");
  } catch {}
}

export async function GET() {
  try {
    // Check cache
    const cached = getCachedRSS();
    if (cached) {
      return NextResponse.json({ items: cached.items, cached: true, count: cached.items.length });
    }

    // Fetch fresh
    const { items, feedResults } = await fetchAllFeeds();
    if (items.length > 0) {
      setCachedRSS(items);
    }

    return NextResponse.json({ items, cached: false, count: items.length, feedResults });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[RSS] Error:", msg);
    return NextResponse.json({ error: msg, items: [] }, { status: 500 });
  }
}
