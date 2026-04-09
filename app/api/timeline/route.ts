import { NextResponse } from "next/server";
import { getSnapshots } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshots = getSnapshots();
  return NextResponse.json({
    snapshots: snapshots.map((s) => ({
      timestamp: s.timestamp,
      countries: s.data.countries.length,
      stories: s.data.countries.reduce((sum, c) => sum + c.stories.length, 0),
    })),
  });
}
