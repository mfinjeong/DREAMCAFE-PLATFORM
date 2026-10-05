import { NextResponse } from "next/server";
import { store } from "@/lib/data-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    let items = store.products;
    if (categoryId && categoryId !== "ALL") {
      items = items.filter((p) => p.categoryId === categoryId);
    }

    return NextResponse.json({
      success: true,
      data: items,
      categories: store.categories,
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, message: "Terjadi kesalahan server" }, { status: 500 });
  }
}
