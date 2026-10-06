import { NextResponse } from "next/server";
import { listIncomingInvitations } from "@/services/team.service";
import { TeamInvitationStatus } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memberId } = await params;
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const status = statusParam ? (statusParam.toUpperCase() as TeamInvitationStatus) : undefined;

    const invitations = await listIncomingInvitations(memberId, status);
    return NextResponse.json({ success: true, data: invitations });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat daftar undangan member";
    const status = msg.includes("tidak ditemukan") ? 404 : 500;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
