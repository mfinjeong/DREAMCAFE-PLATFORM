import { NextResponse } from "next/server";
import { store, startSession } from "@/lib/data-store";
import { startSessionSchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let sessions = store.sessions;
    if (status && status !== "ALL") {
      sessions = sessions.filter((s) => s.status === status);
    }

    return NextResponse.json({ success: true, data: sessions });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, message: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = startSessionSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, message: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const result = startSession(validated.data);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.session, message: result.message });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, message: "Gagal memulai sesi baru" }, { status: 500 });
  }
}
