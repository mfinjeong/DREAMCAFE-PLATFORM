import { NextResponse } from "next/server";
import { getScrimById } from "@/services/scrim.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scrim = await getScrimById(id);
    if (!scrim) {
      return NextResponse.json(
        { success: false, message: "Scrim tidak ditemukan" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: scrim });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat detail scrim";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
