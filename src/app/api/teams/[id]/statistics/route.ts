import { NextResponse } from "next/server";
import { getTeamStatistics } from "@/services/team.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, message: "ID tim tidak valid" },
        { status: 400 }
      );
    }
    const statistics = await getTeamStatistics(id);
    return NextResponse.json({ success: true, data: statistics });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat statistik tim";
    const status = msg.includes("tidak ditemukan") ? 404 : 500;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
