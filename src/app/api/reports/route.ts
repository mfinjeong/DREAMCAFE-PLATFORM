import { NextResponse } from "next/server";
import { getFinancialReports } from "@/services/transaction.service";

export async function GET() {
  try {
    const reports = await getFinancialReports();
    return NextResponse.json({ success: true, data: reports });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan server saat memuat laporan finansial";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
