import { NextResponse } from "next/server";
import {
  joinMatchmakingQueue,
  listMatchmakingQueue,
} from "@/services/matchmaking.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await joinMatchmakingQueue(body);
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal bergabung ke antrean matchmaking";
    const status =
      msg.includes("tidak ditemukan")
        ? 404
        : msg.includes("aktif") ||
          msg.includes("wajib") ||
          msg.includes("LIVE") ||
          msg.includes("Hanya anggota") ||
          msg.includes("minimal") ||
          msg.includes("Rating range") ||
          msg.includes("minRating")
        ? 400
        : 500;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const gameId = searchParams.get("gameId") || undefined;
    const teamId = searchParams.get("teamId") || undefined;

    const result = await listMatchmakingQueue({ status, gameId, teamId });
    return NextResponse.json({ success: true, data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat antrean matchmaking";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
