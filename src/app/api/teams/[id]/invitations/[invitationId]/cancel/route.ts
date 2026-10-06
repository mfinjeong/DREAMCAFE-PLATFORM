import { NextResponse } from "next/server";
import { cancelTeamInvitation } from "@/services/team.service";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; invitationId: string }> }
) {
  try {
    const { id: teamId, invitationId } = await params;
    let actorMemberId = "";

    try {
      const body = await request.json();
      if (body && typeof body.actorMemberId === "string") {
        actorMemberId = body.actorMemberId;
      }
    } catch {
      // Body may be empty
    }

    if (!actorMemberId) {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { ownerId: true },
      });
      if (team) {
        actorMemberId = team.ownerId;
      }
    }

    const cancelled = await cancelTeamInvitation(invitationId, actorMemberId);
    return NextResponse.json({ success: true, data: cancelled });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal membatalkan undangan";
    const status = msg.includes("tidak ditemukan")
      ? 404
      : msg.includes("Hanya owner")
      ? 403
      : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
