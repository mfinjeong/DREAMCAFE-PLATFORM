import { NextResponse } from "next/server";
import { removeTeamMember } from "@/services/team.service";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await params;
    await removeTeamMember(id, memberId);
    return NextResponse.json({ success: true, message: "Anggota berhasil dihapus dari tim" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menghapus anggota dari tim";
    const status = msg.includes("Owner tim tidak dapat")
      ? 403
      : msg.includes("tidak ditemukan") || msg.includes("tidak terdaftar")
      ? 404
      : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
