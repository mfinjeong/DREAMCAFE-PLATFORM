import { NextResponse } from "next/server";
import { acceptTeamInvitation } from "@/services/team.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invitationId } = await params;
    let actorMemberId = "";

    try {
      const body = await request.json();
      if (body && typeof body.actorMemberId === "string") {
        actorMemberId = body.actorMemberId.trim();
      }
    } catch {
      // Body may be empty
    }

    if (!actorMemberId) {
      return NextResponse.json(
        { success: false, message: "ID member (actorMemberId) wajib dikirimkan untuk menerima undangan" },
        { status: 400 }
      );
    }

    const result = await acceptTeamInvitation(invitationId, actorMemberId);
    return NextResponse.json({ success: true, data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menerima undangan tim";
    const status = msg.includes("tidak ditemukan")
      ? 404
      : msg.includes("Hanya member yang diundang")
      ? 403
      : msg.includes("sudah terdaftar")
      ? 409
      : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
