import { NextResponse } from "next/server";
import { endSessionAndCheckout } from "@/lib/data-store";
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

    const result = endSessionAndCheckout(validated.data);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.transaction,
      message: result.message,
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, message: "Gagal menyelesaikan sesi" }, { status: 500 });
  }
}
