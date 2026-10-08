import { NextResponse } from "next/server";
import { startCompetitiveMatch } from "@/services/competitive-match.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (!body.actorMemberId) {
      return NextResponse.json(
        { success: false, message: "Actor member ID wajib diisi" },
        { status: 400 }
      );
    }
    const match = await startCompetitiveMatch(id, body.actorMemberId);
    return NextResponse.json({ success: true, data: match });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memulai pertandingan";
    const status = msg.includes("tidak ditemukan")
      ? 404
      : msg.includes("Hanya owner")
      ? 403
      : msg.includes("LIVE")
      ? 409
      : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
