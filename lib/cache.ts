import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import path from "path";
import { NewsData } from "@/types/news";

const CACHE_FILE = path.join("/tmp", "newsglobe-cache.json");
const SNAPSHOT_DIR = path.join("/tmp", "newsglobe-snapshots");
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours
const MAX_SNAPSHOTS = 12; // Keep last 12 snapshots (~3 days at 6hr intervals)

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

  // Save a timestamped snapshot
  try {
    const { mkdirSync } = require("fs");
    if (!existsSync(SNAPSHOT_DIR)) mkdirSync(SNAPSHOT_DIR, { recursive: true });
    const snapFile = path.join(SNAPSHOT_DIR, `${Date.now()}.json`);
    writeFileSync(snapFile, JSON.stringify(data), "utf-8");

    // Prune old snapshots
    const files = readdirSync(SNAPSHOT_DIR).sort();
    while (files.length > MAX_SNAPSHOTS) {
      const old = files.shift()!;
      const { unlinkSync } = require("fs");
      unlinkSync(path.join(SNAPSHOT_DIR, old));
    }
  } catch {
    // Non-critical, ignore
  }
}

export interface Snapshot {
  timestamp: number;
  data: NewsData;
}

export function getSnapshots(): Snapshot[] {
  try {
    if (!existsSync(SNAPSHOT_DIR)) return [];
    const files = readdirSync(SNAPSHOT_DIR).sort();
    return files.map((f) => {
      const ts = parseInt(f.replace(".json", ""), 10);
      const raw = readFileSync(path.join(SNAPSHOT_DIR, f), "utf-8");
      return { timestamp: ts, data: JSON.parse(raw) };
    });
  } catch {
    return [];
  }
}
