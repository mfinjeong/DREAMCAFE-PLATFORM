import { NextResponse } from "next/server";
import { runMatchmaking } from "@/services/matchmaking.service";

export async function POST(request: Request) {
  try {
    let gameId: string | undefined;
    try {
      const body = await request.json();
      gameId = body.gameId || undefined;
    } catch {
      // Body opsional
    }

    const matches = await runMatchmaking(gameId);
    return NextResponse.json({ success: true, data: matches });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menjalankan matchmaking";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
