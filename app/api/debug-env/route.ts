import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.UPSTASH_REDIS_REST_URL || "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || "";

  const info = {
    urlLen: url.length,
    tokenLen: token.length,
    urlFirst: url.charAt(0),
    urlLast: url.charAt(url.length - 1),
    tokenFirst: token.charAt(0),
    tokenLast: token.charAt(token.length - 1),
    urlStart: url.substring(0, 15),
  };

  if (!url || !token) {
    return NextResponse.json({ ...info, error: "Missing env vars" });
  }

  try {
    const redis = new Redis({ url: url.trim(), token: token.trim() });
    const ping = await redis.ping();
    return NextResponse.json({ ...info, ping, status: "connected" });
  } catch (err) {
    return NextResponse.json({ ...info, error: String(err) });
  }
}
