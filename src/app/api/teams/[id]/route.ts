import { NextResponse } from "next/server";
import { getTeamById, updateTeam, deleteTeam } from "@/services/team.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const team = await getTeamById(id);
    if (!team) {
      return NextResponse.json(
        { success: false, message: "Tim tidak ditemukan" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: team });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat detail tim";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await updateTeam(id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memperbarui tim";
    const status = msg.includes("tidak ditemukan")
      ? 404
      : msg.includes("sudah digunakan")
      ? 409
      : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteTeam(id);
    return NextResponse.json({ success: true, message: "Tim berhasil dihapus" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menghapus tim";
    const status = msg.includes("tidak ditemukan") ? 404 : 500;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
