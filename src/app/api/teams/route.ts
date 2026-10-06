import { NextResponse } from "next/server";
import { listTeams, createTeam } from "@/services/team.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || searchParams.get("q") || undefined;
    const tag = searchParams.get("tag") || undefined;

    const teams = await listTeams({ search, tag });
    return NextResponse.json({ success: true, data: teams });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat daftar tim";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const team = await createTeam(body);
    return NextResponse.json({ success: true, data: team }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal membuat tim";
    const status = msg.includes("sudah digunakan")
      ? 409
      : msg.includes("tidak ditemukan")
      ? 404
      : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
