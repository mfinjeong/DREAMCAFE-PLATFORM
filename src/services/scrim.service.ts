import { prisma } from "@/lib/prisma";
import { ScrimStatus, ScrimResult, Prisma } from "@prisma/client";
import { ScrimItem, ScrimTeamSummary } from "@/lib/types";
import { createScrimSchema, completeScrimSchema } from "@/lib/validators";

export interface CreateScrimInput {
  challengerTeamId: string;
  opponentTeamId: string;
  gameId: string;
  scheduledAt: string | Date;
  bestOf?: number;
  note?: string | null;
  createdById?: string;
  actorMemberId?: string;
}

export interface ListScrimsFilter {
  status?: string;
  gameId?: string;
  teamId?: string;
  q?: string;
}

const scrimInclude = {
  challengerTeam: {
    include: {
      owner: { select: { id: true, fullName: true, username: true } },
      _count: { select: { members: true } },
    },
  },
  opponentTeam: {
    include: {
      owner: { select: { id: true, fullName: true, username: true } },
      _count: { select: { members: true } },
    },
  },
  winnerTeam: {
    include: {
      owner: { select: { id: true, fullName: true, username: true } },
      _count: { select: { members: true } },
    },
  },
  game: {
    select: {
      id: true,
      title: true,
      genre: true,
      iconUrl: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      fullName: true,
      username: true,
    },
  },
} as const;

type ScrimWithRelations = Prisma.ScrimGetPayload<{
  include: typeof scrimInclude;
}>;

function formatTeamSummary(team: ScrimWithRelations["challengerTeam"]): ScrimTeamSummary {
  return {
    id: team.id,
    name: team.name,
    tag: team.tag,
    logoUrl: team.logoUrl,
    ownerId: team.ownerId,
    ownerName: team.owner.fullName,
    ownerUsername: team.owner.username,
    memberCount: team._count.members,
  };
}

function mapScrimItem(scrim: ScrimWithRelations): ScrimItem {
  return {
    id: scrim.id,
    challengerTeamId: scrim.challengerTeamId,
    challengerTeam: formatTeamSummary(scrim.challengerTeam),
    opponentTeamId: scrim.opponentTeamId,
    opponentTeam: formatTeamSummary(scrim.opponentTeam),
    gameId: scrim.gameId,
    game: {
      id: scrim.game.id,
      title: scrim.game.title,
      genre: scrim.game.genre,
      iconUrl: scrim.game.iconUrl,
    },
    scheduledAt: scrim.scheduledAt.toISOString(),
    bestOf: scrim.bestOf,
    status: scrim.status,
    result: scrim.result,
    winnerTeamId: scrim.winnerTeamId,
    winnerTeam: scrim.winnerTeam ? formatTeamSummary(scrim.winnerTeam) : null,
    note: scrim.note,
    createdById: scrim.createdById,
    createdBy: {
      id: scrim.createdBy.id,
      fullName: scrim.createdBy.fullName,
      username: scrim.createdBy.username,
    },
    createdAt: scrim.createdAt.toISOString(),
    updatedAt: scrim.updatedAt.toISOString(),
    startedAt: scrim.startedAt?.toISOString() || null,
    completedAt: scrim.completedAt?.toISOString() || null,
  };
}

/**
 * Creates a new Scrim challenge initiated by challenger team owner.
 */
export async function createScrim(input: CreateScrimInput): Promise<ScrimItem> {
  const validated = createScrimSchema.parse({
    challengerTeamId: input.challengerTeamId,
    opponentTeamId: input.opponentTeamId,
    gameId: input.gameId,
    scheduledAt: typeof input.scheduledAt === "string" ? input.scheduledAt : input.scheduledAt.toISOString(),
    bestOf: input.bestOf || 1,
    note: input.note,
    createdById: input.createdById || input.actorMemberId,
  });

  // 1. Prevent self scrim
  if (validated.challengerTeamId === validated.opponentTeamId) {
    throw new Error("Tim tidak dapat bertanding melawan diri sendiri");
  }

  // 2. Validate challenger team and ownership
  const challengerTeam = await prisma.team.findUnique({
    where: { id: validated.challengerTeamId },
    select: { id: true, ownerId: true },
  });
  if (!challengerTeam) {
    throw new Error("Tim penantang tidak ditemukan");
  }

  const actorId = input.actorMemberId || validated.createdById;
  if (!actorId) {
    throw new Error("Actor member ID wajib diisi");
  }

  if (challengerTeam.ownerId !== actorId) {
    throw new Error("Hanya owner tim penantang yang dapat membuat tantangan scrim");
  }

  // 3. Validate opponent team
  const opponentTeam = await prisma.team.findUnique({
    where: { id: validated.opponentTeamId },
    select: { id: true },
  });
  if (!opponentTeam) {
    throw new Error("Tim lawan tidak ditemukan");
  }

  // 4. Validate game
  const game = await prisma.game.findUnique({
    where: { id: validated.gameId },
    select: { id: true, isActive: true },
  });
  if (!game || !game.isActive) {
    throw new Error("Game tidak ditemukan atau tidak aktif");
  }

  // 5. Parse and validate schedule date
  const scheduledDate = new Date(validated.scheduledAt);
  if (isNaN(scheduledDate.getTime())) {
    throw new Error("Jadwal waktu tidak valid");
  }

  // 6. Check duplicate pending challenge
  const duplicatePending = await prisma.scrim.findFirst({
    where: {
      status: ScrimStatus.PENDING,
      OR: [
        { challengerTeamId: validated.challengerTeamId, opponentTeamId: validated.opponentTeamId },
        { challengerTeamId: validated.opponentTeamId, opponentTeamId: validated.challengerTeamId },
      ],
    },
  });
  if (duplicatePending) {
    throw new Error("Sudah ada tantangan scrim yang sedang pending antara kedua tim ini");
  }

  // 7. Create Scrim
  const created = await prisma.scrim.create({
    data: {
      challengerTeamId: validated.challengerTeamId,
      opponentTeamId: validated.opponentTeamId,
      gameId: validated.gameId,
      scheduledAt: scheduledDate,
      bestOf: validated.bestOf,
      status: ScrimStatus.PENDING,
      note: validated.note || null,
      createdById: actorId,
    },
    include: scrimInclude,
  });

  return mapScrimItem(created);
}

/**
 * Retrieves a single Scrim by ID.
 */
export async function getScrimById(id: string): Promise<ScrimItem | null> {
  const scrim = await prisma.scrim.findUnique({
    where: { id },
    include: scrimInclude,
  });

  return scrim ? mapScrimItem(scrim) : null;
}

/**
 * Lists scrims with optional filtering.
 */
export async function listScrims(filters?: ListScrimsFilter): Promise<ScrimItem[]> {
  const where: Prisma.ScrimWhereInput = {};

  if (filters?.status && filters.status !== "ALL") {
    where.status = filters.status as ScrimStatus;
  }

  if (filters?.gameId) {
    where.gameId = filters.gameId;
  }

  if (filters?.teamId) {
    where.OR = [
      { challengerTeamId: filters.teamId },
      { opponentTeamId: filters.teamId },
    ];
  }

  if (filters?.q) {
    const q = filters.q.trim();
    where.OR = [
      { challengerTeam: { name: { contains: q, mode: "insensitive" } } },
      { challengerTeam: { tag: { contains: q, mode: "insensitive" } } },
      { opponentTeam: { name: { contains: q, mode: "insensitive" } } },
      { opponentTeam: { tag: { contains: q, mode: "insensitive" } } },
      { game: { title: { contains: q, mode: "insensitive" } } },
    ];
  }

  const scrims = await prisma.scrim.findMany({
    where,
    orderBy: { scheduledAt: "desc" },
    include: scrimInclude,
  });

  return scrims.map(mapScrimItem);
}

/**
 * Returns scrim history and upcoming matches for a specific team.
 */
export async function getTeamScrims(teamId: string, limit = 10): Promise<ScrimItem[]> {
  const scrims = await prisma.scrim.findMany({
    where: {
      OR: [
        { challengerTeamId: teamId },
        { opponentTeamId: teamId },
      ],
    },
    orderBy: { scheduledAt: "desc" },
    take: limit,
    include: scrimInclude,
  });

  return scrims.map(mapScrimItem);
}

/**
 * Opponent team owner accepts a pending challenge. Status transitions to SCHEDULED.
 */
export async function acceptScrim(scrimId: string, actorMemberId: string): Promise<ScrimItem> {
  if (!actorMemberId) {
    throw new Error("Actor member ID wajib diisi");
  }

  const scrim = await prisma.scrim.findUnique({
    where: { id: scrimId },
    include: {
      opponentTeam: { select: { ownerId: true } },
    },
  });

  if (!scrim) {
    throw new Error("Scrim tidak ditemukan");
  }

  if (scrim.status !== ScrimStatus.PENDING) {
    throw new Error("Hanya scrim berstatus PENDING yang dapat diterima");
  }

  if (scrim.opponentTeam.ownerId !== actorMemberId) {
    throw new Error("Hanya owner tim lawan yang dapat menerima tantangan scrim");
  }

  const updated = await prisma.scrim.update({
    where: { id: scrimId },
    data: {
      status: ScrimStatus.SCHEDULED,
    },
    include: scrimInclude,
  });

  return mapScrimItem(updated);
}

/**
 * Opponent team owner rejects a pending challenge.
 */
export async function rejectScrim(scrimId: string, actorMemberId: string): Promise<ScrimItem> {
  if (!actorMemberId) {
    throw new Error("Actor member ID wajib diisi");
  }

  const scrim = await prisma.scrim.findUnique({
    where: { id: scrimId },
    include: {
      opponentTeam: { select: { ownerId: true } },
    },
  });

  if (!scrim) {
    throw new Error("Scrim tidak ditemukan");
  }

  if (scrim.status !== ScrimStatus.PENDING) {
    throw new Error("Hanya scrim berstatus PENDING yang dapat ditolak");
  }

  if (scrim.opponentTeam.ownerId !== actorMemberId) {
    throw new Error("Hanya owner tim lawan yang dapat menolak tantangan scrim");
  }

  const updated = await prisma.scrim.update({
    where: { id: scrimId },
    data: {
      status: ScrimStatus.REJECTED,
    },
    include: scrimInclude,
  });

  return mapScrimItem(updated);
}

/**
 * Either involved team owner cancels an active or pending challenge.
 */
export async function cancelScrim(scrimId: string, actorMemberId: string): Promise<ScrimItem> {
  if (!actorMemberId) {
    throw new Error("Actor member ID wajib diisi");
  }

  const scrim = await prisma.scrim.findUnique({
    where: { id: scrimId },
    include: {
      challengerTeam: { select: { ownerId: true } },
      opponentTeam: { select: { ownerId: true } },
    },
  });

  if (!scrim) {
    throw new Error("Scrim tidak ditemukan");
  }

  if (scrim.status === ScrimStatus.COMPLETED) {
    throw new Error("Scrim yang sudah selesai tidak dapat dibatalkan");
  }

  if (scrim.status === ScrimStatus.CANCELLED || scrim.status === ScrimStatus.REJECTED) {
    throw new Error("Scrim sudah dibatalkan atau ditolak");
  }

  const isChallengerOwner = scrim.challengerTeam.ownerId === actorMemberId;
  const isOpponentOwner = scrim.opponentTeam.ownerId === actorMemberId;

  if (!isChallengerOwner && !isOpponentOwner) {
    throw new Error("Hanya owner tim yang terlibat yang dapat membatalkan scrim");
  }

  const updated = await prisma.scrim.update({
    where: { id: scrimId },
    data: {
      status: ScrimStatus.CANCELLED,
    },
    include: scrimInclude,
  });

  return mapScrimItem(updated);
}

/**
 * Starts a scheduled or accepted scrim, setting its status to LIVE.
 */
export async function startScrim(scrimId: string, actorMemberId: string): Promise<ScrimItem> {
  if (!actorMemberId) {
    throw new Error("Actor member ID wajib diisi");
  }

  const scrim = await prisma.scrim.findUnique({
    where: { id: scrimId },
    include: {
      challengerTeam: { select: { ownerId: true } },
      opponentTeam: { select: { ownerId: true } },
    },
  });

  if (!scrim) {
    throw new Error("Scrim tidak ditemukan");
  }

  if (scrim.status !== ScrimStatus.SCHEDULED && scrim.status !== ScrimStatus.ACCEPTED) {
    throw new Error("Hanya scrim berstatus SCHEDULED atau ACCEPTED yang dapat dimulai");
  }

  const isChallengerOwner = scrim.challengerTeam.ownerId === actorMemberId;
  const isOpponentOwner = scrim.opponentTeam.ownerId === actorMemberId;

  if (!isChallengerOwner && !isOpponentOwner) {
    throw new Error("Hanya owner tim yang bertanding yang dapat memulai scrim");
  }

  // Prevent starting if either team currently has another LIVE scrim
  const liveConflict = await prisma.scrim.findFirst({
    where: {
      id: { not: scrimId },
      status: ScrimStatus.LIVE,
      OR: [
        { challengerTeamId: { in: [scrim.challengerTeamId, scrim.opponentTeamId] } },
        { opponentTeamId: { in: [scrim.challengerTeamId, scrim.opponentTeamId] } },
      ],
    },
  });

  if (liveConflict) {
    throw new Error("Salah satu tim saat ini sedang dalam pertandingan scrim LIVE lain");
  }

  const updated = await prisma.scrim.update({
    where: { id: scrimId },
    data: {
      status: ScrimStatus.LIVE,
      startedAt: new Date(),
    },
    include: scrimInclude,
  });

  return mapScrimItem(updated);
}

/**
 * Completes a LIVE scrim with authoritative match result.
 * CRITICAL: Does NOT modify dreamRating or create DreamRankHistory.
 */
export async function completeScrim(
  scrimId: string,
  input: { actorMemberId: string; result: "TEAM_A_WIN" | "TEAM_B_WIN" | "DRAW" | "NO_CONTEST" }
): Promise<ScrimItem> {
  const validated = completeScrimSchema.parse(input);

  const scrim = await prisma.scrim.findUnique({
    where: { id: scrimId },
    include: {
      challengerTeam: { select: { ownerId: true } },
      opponentTeam: { select: { ownerId: true } },
    },
  });

  if (!scrim) {
    throw new Error("Scrim tidak ditemukan");
  }

  if (scrim.status !== ScrimStatus.LIVE) {
    throw new Error("Hanya scrim berstatus LIVE yang dapat diselesaikan");
  }

  const isChallengerOwner = scrim.challengerTeam.ownerId === validated.actorMemberId;
  const isOpponentOwner = scrim.opponentTeam.ownerId === validated.actorMemberId;

  if (!isChallengerOwner && !isOpponentOwner) {
    throw new Error("Hanya owner tim yang bertanding yang dapat menyelesaikan scrim");
  }

  // Map winner team ID based on result
  let winnerTeamId: string | null = null;
  if (validated.result === "TEAM_A_WIN") {
    winnerTeamId = scrim.challengerTeamId;
  } else if (validated.result === "TEAM_B_WIN") {
    winnerTeamId = scrim.opponentTeamId;
  }

  const updated = await prisma.scrim.update({
    where: { id: scrimId },
    data: {
      status: ScrimStatus.COMPLETED,
      result: validated.result as ScrimResult,
      winnerTeamId,
      completedAt: new Date(),
    },
    include: scrimInclude,
  });

  return mapScrimItem(updated);
}
