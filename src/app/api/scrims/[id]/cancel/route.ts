import { NextResponse } from "next/server";
import { cancelScrim } from "@/services/scrim.service";
import { scrimActionSchema } from "@/lib/validators";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = scrimActionSchema.parse(body);

    const updated = await cancelScrim(id, validated.actorMemberId);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal membatalkan scrim";
    const status = msg.includes("tidak ditemukan")
      ? 404
      : msg.includes("Hanya owner")
      ? 403
      : msg.includes("sudah selesai") || msg.includes("sudah dibatalkan")
      ? 409
      : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
