import { NextResponse } from "next/server";
import { store, createBooking } from "@/lib/data-store";
import { bookingSchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    return NextResponse.json({ success: true, data: store.bookings });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, message: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = bookingSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, message: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const result = createBooking(validated.data);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.booking,
      message: result.message,
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, message: "Gagal membuat booking" }, { status: 500 });
  }
}
