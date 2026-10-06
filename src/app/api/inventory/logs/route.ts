import { NextResponse } from "next/server";
import { listInventoryLogs } from "@/services/inventory.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    const logs = await listInventoryLogs({ productId });
    return NextResponse.json({ success: true, data: logs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan server saat memuat log inventaris";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
