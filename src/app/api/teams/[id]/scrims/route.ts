import { NextResponse } from "next/server";
import { getTeamScrims } from "@/services/scrim.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 10;

    const scrims = await getTeamScrims(id, isNaN(limit) ? 10 : limit);
    return NextResponse.json({ success: true, data: scrims });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat scrim tim";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
