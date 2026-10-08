import { NextResponse } from "next/server";
import { getMemberCompetitiveRating } from "@/services/competitive-dreamrank.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const stats = await getMemberCompetitiveRating(id);
    return NextResponse.json({ success: true, data: stats });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat statistik competitive rating";
    const status = msg.includes("tidak ditemukan") ? 404 : 500;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
