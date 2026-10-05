import { NextResponse } from "next/server";
import { store, getAllPCs, createPC, updatePC } from "@/lib/data-store";
import { pcSchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const zone = searchParams.get("zone");
    const query = searchParams.get("q")?.toLowerCase();

    let pcs = getAllPCs();

    if (status && status !== "ALL") {
      pcs = pcs.filter((p) => p.status === status);
    }
    if (zone && zone !== "ALL") {
      pcs = pcs.filter((p) => p.zone === zone);
    }
    if (query) {
      pcs = pcs.filter(
        (p) =>
          p.stationNumber.toLowerCase().includes(query) ||
          p.name.toLowerCase().includes(query) ||
          p.zone.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({ success: true, data: pcs });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, message: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = pcSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, message: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const result = createPC(validated.data);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.pc, message: result.message });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, message: "Gagal membuat PC baru" }, { status: 500 });
  }
}
