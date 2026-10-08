import { NextResponse } from "next/server";
import { acceptMatchOffer } from "@/services/matchmaking.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = await acceptMatchOffer(id, body.actorMemberId);
    return NextResponse.json({ success: true, data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menerima tawaran pertandingan";
    const status = msg.includes("tidak ditemukan") ? 404 : msg.includes("Hanya anggota") ? 403 : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
