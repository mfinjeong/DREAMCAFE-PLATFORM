import { NextResponse } from "next/server";
import { acceptScrim } from "@/services/scrim.service";
import { scrimActionSchema } from "@/lib/validators";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = scrimActionSchema.parse(body);

    const updated = await acceptScrim(id, validated.actorMemberId);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menerima tantangan scrim";
    const status = msg.includes("tidak ditemukan")
      ? 404
      : msg.includes("Hanya owner")
      ? 403
      : msg.includes("Hanya scrim berstatus PENDING")
      ? 409
      : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
