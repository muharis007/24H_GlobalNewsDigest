import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return NextResponse.json({ error: "Missing env vars" });
  }

  try {
    const redis = new Redis({ url, token });
    const ping = await redis.ping();
    const entry = await redis.get("newsglobe:cache");
    
    return NextResponse.json({
      ping,
      hasEntry: !!entry,
      entryType: typeof entry,
      hasData: !!(entry as any)?.data,
      hasTimestamp: !!(entry as any)?.timestamp,
      countries: (entry as any)?.data?.countries?.length ?? 0,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) });
  }
}
