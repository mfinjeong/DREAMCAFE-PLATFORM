import { NextResponse } from "next/server";
import { checkoutSession } from "@/services/session.service";
import { endSessionCheckoutSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = endSessionCheckoutSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, message: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const result = await checkoutSession({
      sessionId: validated.data.sessionId,
      cashReceived: validated.data.cashReceived,
      notes: validated.data.notes,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Checkout biling berhasil (Kembalian: Rp${result.cashChange.toLocaleString("id-ID")})`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menyelesaikan sesi";
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }
}
