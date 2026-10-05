import { NextResponse } from "next/server";
import { addSessionTime } from "@/lib/data-store";
import { addSessionTimeSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = addSessionTimeSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, message: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const result = addSessionTime(validated.data.sessionId, validated.data.additionalMinutes);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.session, message: result.message });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, message: "Gagal menambah waktu sesi" }, { status: 500 });
  }
}
