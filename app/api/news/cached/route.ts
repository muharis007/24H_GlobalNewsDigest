import { NextResponse } from "next/server";
import { getCachedDataStale } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = getCachedDataStale();
  if (data) {
    return NextResponse.json({ ...data, cached: true });
  }
  return NextResponse.json({ error: "No cached data available" }, { status: 404 });
}
