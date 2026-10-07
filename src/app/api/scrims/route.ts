import { NextResponse } from "next/server";
import { createScrim, listScrims } from "@/services/scrim.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const gameId = searchParams.get("gameId") || undefined;
    const teamId = searchParams.get("teamId") || undefined;
    const q = searchParams.get("q") || undefined;

    const scrims = await listScrims({ status, gameId, teamId, q });
    return NextResponse.json({ success: true, data: scrims });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat daftar scrim";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const scrim = await createScrim(body);
    return NextResponse.json({ success: true, data: scrim }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal membuat tantangan scrim";
    const status = msg.includes("tidak ditemukan")
      ? 404
      : msg.includes("Hanya owner")
      ? 403
      : msg.includes("Sudah ada tantangan")
      ? 409
      : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
