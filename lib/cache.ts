import { Redis } from "@upstash/redis";
import { NewsData } from "@/types/news";

const CACHE_TTL = 5 * 60 * 60; // 5 hours in seconds (1h buffer before 6h cron cycle)
const CACHE_KEY = "newsglobe:cache";
const SNAPSHOTS_KEY = "newsglobe:snapshots";
const MAX_SNAPSHOTS = 12;

interface CacheEntry {
  data: NewsData;
  timestamp: number;
}

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL.trim(),
    token: process.env.UPSTASH_REDIS_REST_TOKEN.trim(),
  });
}

// --- Async versions (used by API routes) ---

export async function getCachedData(): Promise<NewsData | null> {
  try {
    const redis = getRedis();
    if (!redis) return null;
    const entry = await redis.get<CacheEntry>(CACHE_KEY);
    if (!entry) return null;
    if (Date.now() - entry.timestamp < CACHE_TTL * 1000) {
      return entry.data;
    }
    return null;
  } catch (err) {
    console.error("[Cache] getCachedData error:", err);
    return null;
  }
}

export async function getCachedDataStale(): Promise<NewsData | null> {
  try {
    const redis = getRedis();
    if (!redis) return null;
    const entry = await redis.get<CacheEntry>(CACHE_KEY);
    if (!entry) return null;
    return entry.data;
  } catch (err) {
    console.error("[Cache] getCachedDataStale error:", err);
    return null;
  }
}

export async function setCachedData(data: NewsData): Promise<void> {
  try {
    const redis = getRedis();
    if (!redis) return;
    const entry: CacheEntry = { data, timestamp: Date.now() };
    // Store main cache with 7-day expiry (stale reads allowed up to 7 days, fresh within 24h)
    await redis.set(CACHE_KEY, entry, { ex: 7 * 24 * 60 * 60 });

    // Save snapshot
    const snapshot = { timestamp: Date.now(), data };
    await redis.lpush(SNAPSHOTS_KEY, snapshot);
    await redis.ltrim(SNAPSHOTS_KEY, 0, MAX_SNAPSHOTS - 1);
  } catch (err) {
    console.error("[Cache] setCachedData error:", err);
  }
}

export interface Snapshot {
  timestamp: number;
  data: NewsData;
}

export async function getSnapshots(): Promise<Snapshot[]> {
  try {
    const redis = getRedis();
    if (!redis) return [];
    const snapshots = await redis.lrange<Snapshot>(SNAPSHOTS_KEY, 0, MAX_SNAPSHOTS - 1);
    return snapshots || [];
  } catch (err) {
    console.error("[Cache] getSnapshots error:", err);
    return [];
  }
}
