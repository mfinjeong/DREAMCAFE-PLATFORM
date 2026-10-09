import { NextResponse } from "next/server";
import { closeRegistration } from "@/services/tournament.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const actorMemberId = body.actorMemberId || "";
    if (!actorMemberId) {
      return NextResponse.json(
        { success: false, message: "actorMemberId wajib diisi" },
        { status: 400 }
      );
    }
    const updated = await closeRegistration(id, actorMemberId);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menutup pendaftaran turnamen";
    const status = msg.includes("tidak ditemukan") ? 404 : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
