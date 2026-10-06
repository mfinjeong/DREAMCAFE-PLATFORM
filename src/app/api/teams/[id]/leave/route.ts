import { NextResponse } from "next/server";
import { leaveTeam } from "@/services/team.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { memberId } = body;

    if (!memberId) {
      return NextResponse.json(
        { success: false, message: "Member ID wajib diisi" },
        { status: 400 }
      );
    }

    await leaveTeam(id, memberId);
    return NextResponse.json({ success: true, message: "Berhasil keluar dari tim" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal keluar dari tim";
    const status = msg.includes("tanpa mentransfer")
      ? 403
      : msg.includes("tidak ditemukan") || msg.includes("tidak terdaftar")
      ? 404
      : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
