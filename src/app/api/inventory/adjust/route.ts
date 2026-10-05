import { NextResponse } from "next/server";
import { adjustInventoryStock } from "@/lib/data-store";
import { inventoryAdjustmentSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = inventoryAdjustmentSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, message: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const result = adjustInventoryStock(validated.data);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.product,
      message: result.message,
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, message: "Gagal menyesuaikan stok inventaris" }, { status: 500 });
  }
}
