import { NextResponse } from "next/server";
import { getTeamCompetitiveMatches } from "@/services/competitive-match.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const matches = await getTeamCompetitiveMatches(id, limit);
    return NextResponse.json({ success: true, data: matches });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat rekam pertandingan tim";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
