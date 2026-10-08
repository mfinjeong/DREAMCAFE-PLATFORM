import { NextResponse } from "next/server";
import { getCompetitiveMatchById } from "@/services/competitive-match.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const match = await getCompetitiveMatchById(id);
    if (!match) {
      return NextResponse.json(
        { success: false, message: "Pertandingan kompetitif tidak ditemukan" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: match });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat detail pertandingan";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
