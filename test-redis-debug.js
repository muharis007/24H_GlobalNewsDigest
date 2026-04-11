// Test Redis directly + verify what /api/news/cached would see
const { Redis } = require("@upstash/redis");

const redis = new Redis({
  url: "https://honest-horse-69523.upstash.io",
  token: "gQAAAAAAAQ-TAAIncDEwZmQ2NDBiZjA1YzM0YmRiOTcwNzJkZGFkMTQyNDQ3MXAxNjk1MjM",
});

async function main() {
  // 1. Check what's in Redis
  const entry = await redis.get("newsglobe:cache");
  if (!entry) {
    console.log("Redis cache is EMPTY");
    return;
  }
  
  console.log("Type of entry:", typeof entry);
  console.log("Has .data:", !!entry.data);
  console.log("Has .timestamp:", !!entry.timestamp);
  
  if (entry.data) {
    console.log("Countries:", entry.data.countries?.length);
    console.log("Age:", Math.round((Date.now() - entry.timestamp) / 1000), "seconds");
    
    // Simulate what getCachedDataStale does
    console.log("\ngetCachedDataStale would return:", entry.data.countries?.length, "countries");
    
    // Simulate what getCachedData does (6h freshness check)
    const CACHE_TTL = 6 * 60 * 60 * 1000;
    const fresh = Date.now() - entry.timestamp < CACHE_TTL;
    console.log("getCachedData fresh check:", fresh);
  }
}

main().catch(e => console.error("Error:", e));
