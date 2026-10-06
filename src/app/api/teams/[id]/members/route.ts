import { NextResponse } from "next/server";
import { listTeamMembers, addTeamMember } from "@/services/team.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const members = await listTeamMembers(id);
    return NextResponse.json({ success: true, data: members });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat anggota tim";
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
    const created = await addTeamMember(id, body);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menambahkan anggota ke tim";
    const status = msg.includes("sudah terdaftar")
      ? 409
      : msg.includes("tidak ditemukan")
      ? 404
      : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
