import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { NewsData } from "@/types/news";

const CACHE_FILE = path.join("/tmp", "newsglobe-cache.json");
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

interface CacheEntry {
  data: NewsData;
  timestamp: number;
}

export function getCachedData(): NewsData | null {
  try {
    if (!existsSync(CACHE_FILE)) return null;
    const raw = readFileSync(CACHE_FILE, "utf-8");
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp < CACHE_TTL) {
      return entry.data;
    }
    return null;
  } catch {
    return null;
  }
}

export function getCachedDataStale(): NewsData | null {
  try {
    if (!existsSync(CACHE_FILE)) return null;
    const raw = readFileSync(CACHE_FILE, "utf-8");
    const entry: CacheEntry = JSON.parse(raw);
    return entry.data;
  } catch {
    return null;
  }
}

export function setCachedData(data: NewsData): void {
  const entry: CacheEntry = {
    data,
    timestamp: Date.now(),
  };
  writeFileSync(CACHE_FILE, JSON.stringify(entry), "utf-8");
}
