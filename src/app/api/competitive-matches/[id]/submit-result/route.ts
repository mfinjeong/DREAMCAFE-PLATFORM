import { NextResponse } from "next/server";
import { submitMatchResult } from "@/services/competitive-match.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const match = await submitMatchResult(id, body);
    return NextResponse.json({ success: true, data: match });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mensubmit hasil pertandingan";
    const status = msg.includes("tidak ditemukan")
      ? 404
      : msg.includes("Hanya owner")
      ? 403
      : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
