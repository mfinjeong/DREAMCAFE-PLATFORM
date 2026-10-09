import { NextResponse } from "next/server";
import { withdrawTeam } from "@/services/tournament.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await withdrawTeam(id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal membatalkan registrasi tim";
    const status = msg.includes("tidak ditemukan")
      ? 404
      : msg.includes("Hanya owner")
      ? 403
      : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
