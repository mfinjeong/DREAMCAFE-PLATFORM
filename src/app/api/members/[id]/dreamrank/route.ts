import { NextResponse } from "next/server";
import { getDreamRankProfile } from "@/services/dreamrank.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profile = await getDreamRankProfile(id);
    return NextResponse.json({ success: true, data: profile });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat profil DREAMRANK member";
    const status = msg.includes("tidak ditemukan") ? 404 : 500;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
