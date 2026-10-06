import { NextResponse } from "next/server";
import { listTeamInvitations, createTeamInvitation } from "@/services/team.service";
import { TeamInvitationStatus } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const status = statusParam ? (statusParam.toUpperCase() as TeamInvitationStatus) : undefined;

    const invitations = await listTeamInvitations(id, status);
    return NextResponse.json({ success: true, data: invitations });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat undangan tim";
    const status = msg.includes("tidak ditemukan") ? 404 : 500;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const created = await createTeamInvitation(id, body);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mengirim undangan tim";
    const status = msg.includes("sudah terdaftar") || msg.includes("sudah memiliki undangan")
      ? 409
      : msg.includes("tidak ditemukan")
      ? 404
      : msg.includes("Hanya owner")
      ? 403
      : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
