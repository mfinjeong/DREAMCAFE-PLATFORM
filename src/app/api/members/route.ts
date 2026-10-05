import { NextResponse } from "next/server";
import { store } from "@/lib/data-store";
import { memberSchema } from "@/lib/validators";
import { MemberItem } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.toLowerCase();

    let list = store.members;
    if (q) {
      list = list.filter(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          m.username.toLowerCase().includes(q) ||
          m.memberCode.toLowerCase().includes(q) ||
          m.phoneNumber.includes(q)
      );
    }
    return NextResponse.json({ success: true, data: list });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, message: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = memberSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, message: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    // Check duplicate username or phone
    const exists = store.members.some(
      (m) =>
        m.username.toLowerCase() === validated.data.username.toLowerCase() ||
        m.phoneNumber === validated.data.phoneNumber
    );
    if (exists) {
      return NextResponse.json(
        { success: false, message: "Username atau nomor telepon sudah terdaftar" },
        { status: 400 }
      );
    }

    const newMember: MemberItem = {
      id: `mem-${Date.now()}`,
      memberCode: `DC-${Math.floor(10000 + Math.random() * 90000)}`,
      fullName: validated.data.fullName,
      username: validated.data.username,
      phoneNumber: validated.data.phoneNumber,
      email: validated.data.email || null,
      tier: validated.data.tier,
      balance: validated.data.balance,
      dreamCoins: 100, // Welcome gift
      xp: 0,
      level: 1,
      dreamRank: "UNRANKED",
      createdAt: new Date().toISOString(),
    };

    store.members.push(newMember);

    return NextResponse.json({
      success: true,
      data: newMember,
      message: "Member berhasil didaftarkan",
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, message: "Gagal membuat member baru" }, { status: 500 });
  }
}
