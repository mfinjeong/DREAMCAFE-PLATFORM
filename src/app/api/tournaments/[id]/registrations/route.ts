import { NextResponse } from "next/server";
import {
  listRegistrations,
  registerTeam,
} from "@/services/tournament.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const registrations = await listRegistrations(id);
    return NextResponse.json({ success: true, data: registrations });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat registrasi turnamen";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const registration = await registerTeam(id, body);
    return NextResponse.json({ success: true, data: registration }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mendaftarkan tim ke turnamen";
    const status = msg.includes("tidak ditemukan")
      ? 404
      : msg.includes("Hanya owner")
      ? 403
      : msg.includes("sudah terdaftar") || msg.includes("penuh")
      ? 409
      : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
