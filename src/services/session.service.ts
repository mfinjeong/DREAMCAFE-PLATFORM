import { prisma } from "@/lib/prisma";
import { SessionStatus, PaymentStatus, PaymentMethod, PCStatus, ConsoleStatus } from "@prisma/client";
import { addMemberXP } from "./member.service";

export interface StartSessionInput {
  stationId: string;
  type?: "PC" | "CONSOLE";
  memberId?: string | null;
  guestName?: string | null;
  durationMinutes: number;
  currentGame?: string | null;
  notes?: string | null;
}

export interface CheckoutSessionInput {
  sessionId: string;
  cashReceived: number;
  cashierName?: string;
  notes?: string | null;
}

export async function listSessions(filters: {
  status?: string | null;
  type?: string | null;
  memberId?: string | null;
  limit?: number;
} = {}) {
  const where: any = {};
  if (filters.status && filters.status !== "ALL") {
    where.status = filters.status as SessionStatus;
  }
  if (filters.type && filters.type !== "ALL") {
    where.type = filters.type;
  }
  if (filters.memberId) {
    where.memberId = filters.memberId;
  }

  const sessions = await prisma.session.findMany({
    where,
    orderBy: { startTime: "desc" },
    take: filters.limit || 50,
    include: {
      pc: true,
      console: true,
      member: true,
      transaction: true,
    },
  });

  const now = Date.now();

  return sessions.map((s) => {
    const elapsedMinutes = Math.floor((now - new Date(s.startTime).getTime()) / 60000);
    const remainingMinutes = Math.max(0, s.durationMinutes - elapsedMinutes);
    const stationName = s.pc ? s.pc.name : s.console ? s.console.name : "Station";
    const stationNumber = s.pc ? s.pc.stationNumber : s.console ? s.console.stationNumber : "-";

    return {
      id: s.id,
      sessionNumber: s.sessionNumber,
      type: s.type,
      stationId: s.pcId || s.consoleId || "",
      stationNumber,
      stationName,
      memberId: s.memberId,
      memberName: s.member?.fullName || s.guestName || "Guest",
      username: s.member?.username || null,
      guestName: s.guestName,
      startTime: s.startTime.toISOString(),
      endTime: s.endTime?.toISOString() || null,
      durationMinutes: s.durationMinutes,
      remainingMinutes: s.status === SessionStatus.ACTIVE ? remainingMinutes : s.remainingMinutes,
      hourlyRate: s.hourlyRate,
      totalPrice: s.totalPrice,
      status: s.status,
      paymentStatus: s.paymentStatus,
      currentGame: s.pc?.currentGame || s.console?.currentGame || null,
      notes: s.notes,
      transactionId: s.transactionId,
      invoiceNumber: s.transaction?.invoiceNumber || null,
      createdAt: s.createdAt.toISOString(),
    };
  });
}

export async function getActiveSessions() {
  return await listSessions({ status: SessionStatus.ACTIVE });
}

export async function getSessionById(id: string) {
  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      pc: true,
      console: true,
      member: true,
      transaction: {
        include: { items: true },
      },
    },
  });

  if (!session) return null;

  const now = Date.now();
  const elapsedMinutes = Math.floor((now - new Date(session.startTime).getTime()) / 60000);
  const remainingMinutes = Math.max(0, session.durationMinutes - elapsedMinutes);

  return {
    ...session,
    startTime: session.startTime.toISOString(),
    endTime: session.endTime?.toISOString() || null,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    calculatedRemainingMinutes: session.status === SessionStatus.ACTIVE ? remainingMinutes : session.remainingMinutes,
  };
}

export async function startSession(data: StartSessionInput) {
  const type = data.type || "PC";

  // Validate station and prevent duplicate session
  let hourlyRate = 10000;
  let stationNumber = "";

  if (type === "PC") {
    const pc = await prisma.pC.findUnique({
      where: { id: data.stationId },
      include: {
        sessions: { where: { status: SessionStatus.ACTIVE } },
      },
    });

    if (!pc) {
      throw new Error("PC Station tidak ditemukan");
    }

    if (pc.status !== PCStatus.AVAILABLE || pc.sessions.length > 0) {
      throw new Error(`Station ${pc.stationNumber} sedang tidak tersedia (Status: ${pc.status})`);
    }

    hourlyRate = pc.hourlyRate;
    stationNumber = pc.stationNumber;
  } else {
    const con = await prisma.console.findUnique({
      where: { id: data.stationId },
      include: {
        sessions: { where: { status: SessionStatus.ACTIVE } },
      },
    });

    if (!con) {
      throw new Error("Console Station tidak ditemukan");
    }

    if (con.status !== ConsoleStatus.AVAILABLE || con.sessions.length > 0) {
      throw new Error(`Station ${con.stationNumber} sedang tidak tersedia (Status: ${con.status})`);
    }

    hourlyRate = con.hourlyRate;
    stationNumber = con.stationNumber;
  }

  // Calculate server-authoritative price
  const durationMinutes = Math.max(15, data.durationMinutes);
  const totalPrice = Math.ceil((durationMinutes / 60) * hourlyRate);

  // Generate unique session number
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const count = await prisma.session.count();
  const sessionNumber = `SES-${dateStr}-${String(count + 1).padStart(3, "0")}`;

  return await prisma.$transaction(async (tx) => {
    // 1. Create Session
    const session = await tx.session.create({
      data: {
        sessionNumber,
        type,
        pcId: type === "PC" ? data.stationId : null,
        consoleId: type === "CONSOLE" ? data.stationId : null,
        memberId: data.memberId || null,
        guestName: data.memberId ? null : (data.guestName || "Guest"),
        startTime: new Date(),
        durationMinutes,
        remainingMinutes: durationMinutes,
        hourlyRate,
        totalPrice,
        status: SessionStatus.ACTIVE,
        paymentStatus: PaymentStatus.PENDING,
        notes: data.notes || null,
      },
      include: {
        member: true,
      },
    });

    // 2. Update Station status to IN_USE
    if (type === "PC") {
      await tx.pC.update({
        where: { id: data.stationId },
        data: {
          status: PCStatus.IN_USE,
          currentGame: data.currentGame || "Online Session",
        },
      });
    } else {
      await tx.console.update({
        where: { id: data.stationId },
        data: {
          status: ConsoleStatus.IN_USE,
          currentGame: data.currentGame || "Gaming Session",
        },
      });
    }

    return session;
  });
}

export async function addSessionTime(sessionId: string, additionalMinutes: number) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error("Sesi tidak ditemukan");
  }

  if (session.status !== SessionStatus.ACTIVE) {
    throw new Error("Hanya sesi aktif yang dapat ditambah durasinya");
  }

  const newDuration = session.durationMinutes + additionalMinutes;
  const newRemaining = session.remainingMinutes + additionalMinutes;
  const additionalPrice = Math.ceil((additionalMinutes / 60) * session.hourlyRate);
  const newTotalPrice = session.totalPrice + additionalPrice;

  return await prisma.session.update({
    where: { id: sessionId },
    data: {
      durationMinutes: newDuration,
      remainingMinutes: newRemaining,
      totalPrice: newTotalPrice,
    },
  });
}

export async function stopSession(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error("Sesi tidak ditemukan");
  }

  if (session.status !== SessionStatus.ACTIVE) {
    throw new Error("Sesi sudah tidak aktif");
  }

  return await prisma.session.update({
    where: { id: sessionId },
    data: {
      remainingMinutes: 0,
      endTime: new Date(),
    },
  });
}

export async function checkoutSession(data: CheckoutSessionInput) {
  const session = await prisma.session.findUnique({
    where: { id: data.sessionId },
    include: {
      pc: true,
      console: true,
      member: true,
    },
  });

  if (!session) {
    throw new Error("Sesi tidak ditemukan");
  }

  // Prevent double checkout
  if (session.status === SessionStatus.COMPLETED) {
    throw new Error("Sesi ini sudah diselesaikan dan dibayar sebelumnya");
  }

  // Server-side authoritative total amount
  const totalAmount = session.totalPrice;

  // CASH-ONLY validation
  if (data.cashReceived < totalAmount) {
    const shortage = totalAmount - data.cashReceived;
    throw new Error(
      `Uang tunai kurang Rp${shortage.toLocaleString("id-ID")} (Total: Rp${totalAmount.toLocaleString("id-ID")}, Diterima: Rp${data.cashReceived.toLocaleString("id-ID")})`
    );
  }

  const cashChange = data.cashReceived - totalAmount;

  // Generate unique invoice number: INV-YYYYMMDD-XXXX
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const txCount = await prisma.transaction.count();
  const invoiceNumber = `INV-${dateStr}-${String(txCount + 1).padStart(4, "0")}`;

  const stationName = session.pc
    ? session.pc.stationNumber
    : session.console
    ? session.console.stationNumber
    : "Station";

  return await prisma.$transaction(async (tx) => {
    // 1. Create Transaction (Cash Only, PAID)
    const transaction = await tx.transaction.create({
      data: {
        invoiceNumber,
        memberId: session.memberId,
        cashierName: data.cashierName || "Admin",
        type: "SESSION",
        subtotal: totalAmount,
        tax: 0,
        discount: 0,
        totalAmount,
        cashReceived: data.cashReceived,
        cashChange,
        paymentMethod: PaymentMethod.CASH,
        status: PaymentStatus.PAID,
        notes: data.notes || `Pembayaran biling ${stationName} (${session.durationMinutes} menit)`,
        items: {
          create: [
            {
              description: `Sewa Station ${stationName} - ${session.durationMinutes} Menit`,
              unitPrice: totalAmount,
              quantity: 1,
              subtotal: totalAmount,
            },
          ],
        },
      },
    });

    // 2. Mark Session COMPLETED & PAID
    const updatedSession = await tx.session.update({
      where: { id: session.id },
      data: {
        status: SessionStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        remainingMinutes: 0,
        endTime: new Date(),
        transactionId: transaction.id,
      },
    });

    // 3. Return Station to AVAILABLE
    if (session.pcId) {
      await tx.pC.update({
        where: { id: session.pcId },
        data: {
          status: PCStatus.AVAILABLE,
          currentGame: null,
        },
      });
    } else if (session.consoleId) {
      await tx.console.update({
        where: { id: session.consoleId },
        data: {
          status: ConsoleStatus.AVAILABLE,
          currentGame: null,
        },
      });
    }

    return {
      session: updatedSession,
      transaction,
      totalAmount,
      cashReceived: data.cashReceived,
      cashChange,
    };
  }).then(async (result) => {
    // Add Member XP and DreamCoins if member session
    if (session.memberId) {
      const xpEarned = Math.floor(session.durationMinutes * 5); // 5 XP per minute played
      await addMemberXP(session.memberId, xpEarned);
    }
    return result;
  });
}
