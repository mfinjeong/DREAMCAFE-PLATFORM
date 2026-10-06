import { NextResponse } from "next/server";
import { transferTeamOwnership } from "@/services/team.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { newOwnerId } = body;

    const result = await transferTeamOwnership(id, newOwnerId);
    return NextResponse.json({ success: true, data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mentransfer kepemilikan tim";
    const status = msg.includes("tidak ditemukan") || msg.includes("harus merupakan anggota")
      ? 404
      : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
