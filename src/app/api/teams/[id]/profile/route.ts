import { NextResponse } from "next/server";
import { getTeamProfile } from "@/services/team.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, message: "ID tim tidak valid" },
        { status: 400 }
      );
    }
    const profile = await getTeamProfile(id);
    return NextResponse.json({ success: true, data: profile });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat profil tim";
    const status = msg.includes("tidak ditemukan") ? 404 : 500;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
