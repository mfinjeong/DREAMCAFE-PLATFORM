import { NextResponse } from "next/server";
import {
  deleteTournament,
  getTournamentById,
  updateTournament,
} from "@/services/tournament.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tournament = await getTournamentById(id);
    if (!tournament) {
      return NextResponse.json(
        { success: false, message: "Turnamen tidak ditemukan" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: tournament });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat detail turnamen";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await updateTournament(id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memperbarui turnamen";
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
    const { searchParams } = new URL(request.url);
    const actorMemberId = searchParams.get("actorMemberId") || "";
    if (!actorMemberId) {
      return NextResponse.json(
        { success: false, message: "actorMemberId wajib disertakan" },
        { status: 400 }
      );
    }

    const res = await deleteTournament(id, actorMemberId);
    return NextResponse.json({ success: true, data: res });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menghapus turnamen";
    const status = msg.includes("tidak ditemukan")
      ? 404
      : msg.includes("Hanya pembuat")
      ? 403
      : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
