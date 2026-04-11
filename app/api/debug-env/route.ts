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

    // Debug: check for accidental quotes/whitespace in env vars
    const urlLen = url.length;
    const tokenLen = token.length;
    const urlFirstChar = url.charAt(0);
    const urlLastChar = url.charAt(url.length - 1);
    const tokenFirstChar = token.charAt(0);
    const tokenLastChar = token.charAt(token.length - 1);

    const ping = await redis.ping();
    const entry = await redis.get("newsglobe:cache");
    
    return NextResponse.json({
      urlLen, tokenLen,
      urlFirstChar, urlLastChar,
      tokenFirstChar, tokenLastChar,
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
