import { NextResponse } from "next/server";
import { getMatchmakingEntry } from "@/services/matchmaking.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entry = await getMatchmakingEntry(id);

    if (!entry) {
      return NextResponse.json(
        { success: false, message: "Antrean matchmaking tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: entry });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat antrean matchmaking";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
