import { NextResponse } from "next/server";
import {
  createCompetitiveMatch,
  listCompetitiveMatches,
} from "@/services/competitive-match.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const gameId = searchParams.get("gameId") || undefined;
    const teamId = searchParams.get("teamId") || undefined;
    const q = searchParams.get("q") || undefined;

    const matches = await listCompetitiveMatches({ status, gameId, teamId, q });
    return NextResponse.json({ success: true, data: matches });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat daftar pertandingan kompetitif";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const match = await createCompetitiveMatch(body);
    return NextResponse.json({ success: true, data: match }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal membuat pertandingan kompetitif";
    const status = msg.includes("tidak ditemukan")
      ? 404
      : msg.includes("Hanya owner")
      ? 403
      : msg.includes("Sudah ada pertandingan")
      ? 409
      : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
