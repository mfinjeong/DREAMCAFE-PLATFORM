import { prisma } from "@/lib/prisma";
import { BookingStatus, SessionType, Prisma } from "@prisma/client";

export interface BookingCreateInput {
  memberId: string;
  type: "PC" | "CONSOLE";
  stationId: string;
  bookingDate: string; // YYYY-MM-DD
  startTime: string;   // HH:mm (e.g. "14:00")
  durationHours: number;
  notes?: string | null;
}

// Convert "HH:mm" to minutes from midnight
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

// Convert minutes from midnight back to "HH:mm"
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export async function listBookings(filters: {
  status?: string | null;
  date?: string | null;
  memberId?: string | null;
  type?: string | null;
} = {}) {
  const where: Prisma.BookingWhereInput = {};
  if (filters.status && filters.status !== "ALL") {
    where.status = filters.status as BookingStatus;
  }
  if (filters.type && filters.type !== "ALL") {
    where.type = filters.type as SessionType;
  }
  if (filters.memberId) {
    where.memberId = filters.memberId;
  }
  if (filters.date) {
    const targetDate = new Date(filters.date);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);
    where.bookingDate = {
      gte: targetDate,
      lt: nextDate,
    };
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: [{ bookingDate: "asc" }, { startTime: "asc" }],
    include: {
      member: true,
      pc: true,
      console: true,
    },
  });

  return bookings.map((b) => {
    const stationNumber = b.pc ? b.pc.stationNumber : b.console ? b.console.stationNumber : "-";
    const stationName = b.pc ? b.pc.name : b.console ? b.console.name : "Station";

    return {
      id: b.id,
      bookingCode: b.bookingCode,
      type: b.type,
      stationId: b.pcId || b.consoleId || "",
      stationNumber,
      stationName,
      memberId: b.memberId,
      memberName: b.member.fullName,
      username: b.member.username,
      phoneNumber: b.member.phoneNumber,
      bookingDate: b.bookingDate.toISOString().slice(0, 10),
      startTime: b.startTime,
      endTime: b.endTime,
      durationHours: b.durationHours,
      totalPrice: b.totalPrice,
      status: b.status,
      notes: b.notes,
      createdAt: b.createdAt.toISOString(),
    };
  });
}

export async function createBooking(data: BookingCreateInput) {
  // 1. Verify Member
  const member = await prisma.member.findUnique({
    where: { id: data.memberId },
  });
  if (!member) {
    throw new Error("Member tidak ditemukan");
  }

  // 2. Verify Station & get hourly rate
  let hourlyRate = 10000;
  let stationIdentifier = "";

  if (data.type === "PC") {
    const pc = await prisma.pC.findUnique({ where: { id: data.stationId } });
    if (!pc) throw new Error("PC Station tidak ditemukan");
    hourlyRate = pc.hourlyRate;
    stationIdentifier = pc.stationNumber;
  } else {
    const con = await prisma.console.findUnique({ where: { id: data.stationId } });
    if (!con) throw new Error("Console Station tidak ditemukan");
    hourlyRate = con.hourlyRate;
    stationIdentifier = con.stationNumber;
  }

  // 3. Time calculations
  const startMin = timeToMinutes(data.startTime);
  const endMin = startMin + data.durationHours * 60;
  if (endMin > 24 * 60) {
    throw new Error("Durasi booking melewati tengah malam (maksimal jam 24:00)");
  }
  const endTimeStr = minutesToTime(endMin);

  // 4. CONFLICT VALIDATION ENGINE
  const bookingDate = new Date(`${data.bookingDate}T00:00:00.000Z`);
  const nextDate = new Date(`${data.bookingDate}T23:59:59.999Z`);

  const existingBookings = await prisma.booking.findMany({
    where: {
      bookingDate: {
        gte: bookingDate,
        lte: nextDate,
      },
      status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      OR: [
        { pcId: data.type === "PC" ? data.stationId : undefined },
        { consoleId: data.type === "CONSOLE" ? data.stationId : undefined },
      ],
    },
  });

  // Check overlap: slotA.start < slotB.end && slotA.end > slotB.start
  for (const b of existingBookings) {
    const existingStart = timeToMinutes(b.startTime);
    const existingEnd = timeToMinutes(b.endTime);

    if (startMin < existingEnd && endMin > existingStart) {
      throw new Error(
        `Jadwal bentrok! Station ${stationIdentifier} sudah di-booking oleh member lain pada pukul ${b.startTime} - ${b.endTime} (${b.bookingCode})`
      );
    }
  }

  // 5. Calculate authoritative price
  const totalPrice = Math.ceil(data.durationHours * hourlyRate);

  // 6. Generate unique booking code: BK-YYYYMMDD-XXXX
  const dateStr = data.bookingDate.replace(/-/g, "");
  const count = await prisma.booking.count();
  const bookingCode = `BK-${dateStr}-${String(count + 1).padStart(3, "0")}`;

  return await prisma.booking.create({
    data: {
      bookingCode,
      type: data.type,
      pcId: data.type === "PC" ? data.stationId : null,
      consoleId: data.type === "CONSOLE" ? data.stationId : null,
      memberId: data.memberId,
      bookingDate,
      startTime: data.startTime,
      endTime: endTimeStr,
      durationHours: data.durationHours,
      totalPrice,
      status: BookingStatus.CONFIRMED,
      notes: data.notes || null,
    },
    include: {
      member: true,
      pc: true,
      console: true,
    },
  });
}

export async function cancelBooking(id: string, reason?: string) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    throw new Error("Reservasi tidak ditemukan");
  }

  if (booking.status === BookingStatus.CANCELLED) {
    throw new Error("Reservasi sudah dibatalkan sebelumnya");
  }

  return await prisma.booking.update({
    where: { id },
    data: {
      status: BookingStatus.CANCELLED,
      notes: reason ? `${booking.notes || ""} [Dibatalkan: ${reason}]`.trim() : booking.notes,
    },
  });
}
