import { NextResponse } from "next/server";
import { completeScrim } from "@/services/scrim.service";
import { completeScrimSchema } from "@/lib/validators";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = completeScrimSchema.parse(body);

    const updated = await completeScrim(id, validated);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menyelesaikan scrim";
    const status = msg.includes("tidak ditemukan")
      ? 404
      : msg.includes("Hanya owner")
      ? 403
      : msg.includes("Hanya scrim berstatus LIVE")
      ? 409
      : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
