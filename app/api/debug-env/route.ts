import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  return NextResponse.json({
    hasUrl: !!url,
    urlPrefix: url ? url.substring(0, 30) + "..." : "NOT SET",
    hasToken: !!token,
    tokenPrefix: token ? token.substring(0, 10) + "..." : "NOT SET",
  });
}
