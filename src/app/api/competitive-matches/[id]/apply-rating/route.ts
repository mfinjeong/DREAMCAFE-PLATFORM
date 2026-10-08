import { NextResponse } from "next/server";
import { applyCompetitiveMatchRating } from "@/services/competitive-dreamrank.service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await applyCompetitiveMatchRating(id);
    return NextResponse.json({ success: true, data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memproses rating pertandingan";
    const status = msg.includes("tidak ditemukan")
      ? 404
      : msg.includes("VERIFIED") || msg.includes("peserta terdaftar")
      ? 400
      : 500;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
