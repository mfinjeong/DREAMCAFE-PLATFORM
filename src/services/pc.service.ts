import { prisma } from "@/lib/prisma";
import { PCStatus, StationZone } from "@prisma/client";

export interface PCFilterOptions {
  status?: string | null;
  zone?: string | null;
  search?: string | null;
}

export interface PCCreateInput {
  stationNumber: string;
  name: string;
  zone: StationZone;
  status?: PCStatus;
  hourlyRate: number;
  specsCpu: string;
  specsGpu: string;
  specsRam: string;
  specsMonitor: string;
  specsStorage?: string;
  specsPeripherals?: string;
  ipAddress?: string | null;
  macAddress?: string | null;
}

export interface PCUpdateInput extends Partial<PCCreateInput> {
  currentGame?: string | null;
}

export async function listPCs(filters: PCFilterOptions = {}) {
  const where: any = {};

  if (filters.status && filters.status !== "ALL") {
    where.status = filters.status as PCStatus;
  }
  if (filters.zone && filters.zone !== "ALL") {
    where.zone = filters.zone as StationZone;
  }
  if (filters.search) {
    const q = filters.search.trim();
    where.OR = [
      { stationNumber: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { specsGpu: { contains: q, mode: "insensitive" } },
    ];
  }

  const pcs = await prisma.pC.findMany({
    where,
    orderBy: { stationNumber: "asc" },
    include: {
      sessions: {
        where: { status: "ACTIVE" },
        include: {
          member: {
            select: {
              id: true,
              username: true,
              fullName: true,
              tier: true,
              dreamRank: true,
            },
          },
        },
        take: 1,
      },
    },
  });

  return pcs.map((pc) => {
    const active = pc.sessions[0];
    return {
      id: pc.id,
      stationNumber: pc.stationNumber,
      name: pc.name,
      zone: pc.zone,
      status: pc.status,
      hourlyRate: pc.hourlyRate,
      specsCpu: pc.specsCpu,
      specsGpu: pc.specsGpu,
      specsRam: pc.specsRam,
      specsMonitor: pc.specsMonitor,
      specsStorage: pc.specsStorage,
      specsPeripherals: pc.specsPeripherals,
      ipAddress: pc.ipAddress,
      macAddress: pc.macAddress,
      currentGame: pc.currentGame,
      createdAt: pc.createdAt.toISOString(),
      updatedAt: pc.updatedAt.toISOString(),
      activeSession: active
        ? {
            id: active.id,
            sessionNumber: active.sessionNumber,
            stationId: pc.id,
            stationNumber: pc.stationNumber,
            type: "PC" as const,
            memberId: active.memberId,
            memberName: active.member?.fullName || null,
            username: active.member?.username || null,
            guestName: active.guestName,
            startTime: active.startTime.toISOString(),
            durationMinutes: active.durationMinutes,
            remainingMinutes: active.remainingMinutes,
            hourlyRate: active.hourlyRate,
            totalPrice: active.totalPrice,
            status: active.status,
            currentGame: pc.currentGame || null,
          }
        : null,
    };
  });
}

export async function getPCById(id: string) {
  const pc = await prisma.pC.findUnique({
    where: { id },
    include: {
      sessions: {
        where: { status: "ACTIVE" },
        include: {
          member: true,
        },
        take: 1,
      },
      maintenances: {
        orderBy: { reportedAt: "desc" },
        take: 5,
      },
    },
  });

  if (!pc) return null;

  const active = pc.sessions[0];
  return {
    ...pc,
    createdAt: pc.createdAt.toISOString(),
    updatedAt: pc.updatedAt.toISOString(),
    activeSession: active
      ? {
          id: active.id,
          sessionNumber: active.sessionNumber,
          stationId: pc.id,
          stationNumber: pc.stationNumber,
          type: "PC" as const,
          memberId: active.memberId,
          memberName: active.member?.fullName || null,
          username: active.member?.username || null,
          guestName: active.guestName,
          startTime: active.startTime.toISOString(),
          durationMinutes: active.durationMinutes,
          remainingMinutes: active.remainingMinutes,
          hourlyRate: active.hourlyRate,
          totalPrice: active.totalPrice,
          status: active.status,
          currentGame: pc.currentGame || null,
        }
      : null,
  };
}

export async function createPC(data: PCCreateInput) {
  const existing = await prisma.pC.findUnique({
    where: { stationNumber: data.stationNumber },
  });

  if (existing) {
    throw new Error(`Nomor station ${data.stationNumber} sudah terdaftar`);
  }

  return await prisma.pC.create({
    data: {
      stationNumber: data.stationNumber,
      name: data.name,
      zone: data.zone,
      status: data.status || PCStatus.AVAILABLE,
      hourlyRate: data.hourlyRate,
      specsCpu: data.specsCpu,
      specsGpu: data.specsGpu,
      specsRam: data.specsRam,
      specsMonitor: data.specsMonitor,
      specsStorage: data.specsStorage || "1TB NVMe SSD",
      specsPeripherals: data.specsPeripherals || "Mechanical Keyboard + Mouse",
      ipAddress: data.ipAddress,
      macAddress: data.macAddress,
    },
  });
}

export async function updatePC(id: string, data: PCUpdateInput) {
  const existing = await prisma.pC.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("PC Station tidak ditemukan");
  }

  if (data.stationNumber && data.stationNumber !== existing.stationNumber) {
    const duplicate = await prisma.pC.findUnique({
      where: { stationNumber: data.stationNumber },
    });
    if (duplicate) {
      throw new Error(`Nomor station ${data.stationNumber} sudah digunakan oleh station lain`);
    }
  }

  return await prisma.pC.update({
    where: { id },
    data,
  });
}

export async function updatePCStatus(id: string, status: PCStatus) {
  const pc = await prisma.pC.findUnique({ where: { id } });
  if (!pc) {
    throw new Error("PC Station tidak ditemukan");
  }

  const updateData: any = { status };
  if (status === PCStatus.AVAILABLE || status === PCStatus.OFFLINE) {
    updateData.currentGame = null;
  }

  return await prisma.pC.update({
    where: { id },
    data: updateData,
  });
}

export async function deletePC(id: string) {
  const pc = await prisma.pC.findUnique({
    where: { id },
    include: {
      sessions: { where: { status: "ACTIVE" } },
    },
  });

  if (!pc) {
    throw new Error("PC Station tidak ditemukan");
  }

  if (pc.sessions.length > 0) {
    throw new Error("Tidak dapat menghapus PC yang sedang memiliki sesi aktif");
  }

  return await prisma.pC.delete({ where: { id } });
}
