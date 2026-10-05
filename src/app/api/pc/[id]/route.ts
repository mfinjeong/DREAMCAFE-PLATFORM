import { NextResponse } from "next/server";
import { getPCById, updatePC, deletePC, updatePCStatus } from "@/lib/data-store";
import { pcSchema } from "@/lib/validators";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pc = getPCById(id);
  if (!pc) {
    return NextResponse.json({ success: false, message: "PC tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: pc });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = pcSchema.partial().safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, message: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const result = updatePC(id, validated.data);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.pc, message: result.message });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, message: "Gagal memperbarui PC" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = deletePC(id);
  if (!result.success) {
    return NextResponse.json({ success: false, message: result.message }, { status: 400 });
  }
  return NextResponse.json({ success: true, message: result.message });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (!body.status) {
      return NextResponse.json({ success: false, message: "Status wajib diisi" }, { status: 400 });
    }

    const result = updatePCStatus(id, body.status);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.pc, message: result.message });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, message: "Gagal mengubah status PC" }, { status: 500 });
  }
}
