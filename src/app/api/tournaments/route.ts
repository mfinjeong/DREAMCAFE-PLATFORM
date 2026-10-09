import { NextResponse } from "next/server";
import {
  createTournament,
  listTournaments,
} from "@/services/tournament.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const gameId = searchParams.get("gameId") || undefined;
    const q = searchParams.get("q") || undefined;

    const tournaments = await listTournaments({ status, gameId, q });
    return NextResponse.json({ success: true, data: tournaments });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat daftar turnamen";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tournament = await createTournament(body);
    return NextResponse.json({ success: true, data: tournament }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal membuat turnamen";
    const status = msg.includes("tidak ditemukan")
      ? 404
      : msg.includes("sudah digunakan")
      ? 409
      : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
