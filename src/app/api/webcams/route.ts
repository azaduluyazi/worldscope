import { NextRequest, NextResponse } from "next/server";
import { fetchNearbyWebcams } from "@/lib/api/windy-webcams";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Number(searchParams.get("radius")) || 50;
  const limit = Number(searchParams.get("limit")) || 3;

  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ webcams: [] });
  }

  try {
    const webcams = await fetchNearbyWebcams(lat, lng, radius, limit);
    return NextResponse.json({ webcams });
  } catch (err) {
    console.error("[webcams]", err);
    return NextResponse.json({ webcams: [] });
  }
}
