import { prisma } from "@/lib/prisma";
import {
  Prisma,
  TournamentRegistrationStatus,
  TournamentStatus,
} from "@prisma/client";
import {
  TournamentDetailDTO,
  TournamentItemDTO,
  TournamentMatchSummaryDTO,
  TournamentRegistrationDTO,
} from "@/lib/types";
import {
  createTournamentSchema,
  registerTournamentTeamSchema,
  tournamentActionSchema,
  tournamentQuerySchema,
  updateTournamentSchema,
  withdrawTournamentTeamSchema,
} from "@/lib/validators";

export interface CreateTournamentInput {
  name: string;
  slug?: string;
  description?: string | null;
  gameId: string;
  createdById: string;
  minTeams?: number;
  maxTeams?: number;
  bestOf?: number;
  registrationStart: Date | string;
  registrationEnd: Date | string;
  startAt: Date | string;
  endAt?: Date | string | null;
  rules?: string | null;
  prizePool?: number | null;
  entryFee?: number | null;
  format?: string;
}

export interface UpdateTournamentInput {
  name?: string;
  slug?: string;
  description?: string | null;
  gameId?: string;
  minTeams?: number;
  maxTeams?: number;
  bestOf?: number;
  registrationStart?: Date | string;
  registrationEnd?: Date | string;
  startAt?: Date | string;
  endAt?: Date | string | null;
  rules?: string | null;
  prizePool?: number | null;
  entryFee?: number | null;
  actorMemberId: string;
}

export interface ListTournamentsFilter {
  status?: string;
  gameId?: string;
  q?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateUniqueSlug(baseName: string, excludeId?: string): Promise<string> {
  const baseSlug = slugify(baseName) || "tournament";
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.tournament.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || (excludeId && existing.id === excludeId)) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

const tournamentListInclude = {
  game: {
    select: {
      id: true,
      title: true,
      genre: true,
      iconUrl: true,
      isActive: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      fullName: true,
      username: true,
    },
  },
  registrations: {
    where: {
      status: "CONFIRMED" as const,
    },
    select: {
      id: true,
    },
  },
} as const;

type TournamentListPayload = Prisma.TournamentGetPayload<{
  include: typeof tournamentListInclude;
}>;

function mapTournamentItemDTO(t: TournamentListPayload): TournamentItemDTO {
  const now = new Date();
  const regStart = new Date(t.registrationStart);
  const regEnd = new Date(t.registrationEnd);
  const confirmedCount = t.registrations.length;

  const isRegistrationOpen =
    t.status === TournamentStatus.REGISTRATION_OPEN &&
    now >= regStart &&
    now <= regEnd &&
    confirmedCount < t.maxTeams;

  const isCapacityFull = confirmedCount >= t.maxTeams;

  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    description: t.description,
    gameId: t.gameId,
    gameTitle: t.game.title,
    gameGenre: t.game.genre,
    gameIconUrl: t.game.iconUrl,
    status: t.status,
    createdById: t.createdById,
    createdByName: t.createdBy.fullName,
    maxTeams: t.maxTeams,
    minTeams: t.minTeams,
    bestOf: t.bestOf,
    registrationStart: t.registrationStart.toISOString(),
    registrationEnd: t.registrationEnd.toISOString(),
    startAt: t.startAt.toISOString(),
    endAt: t.endAt ? t.endAt.toISOString() : null,
    rules: t.rules,
    prizePool: t.prizePool,
    entryFee: t.entryFee,
    format: t.format,
    confirmedTeamCount: confirmedCount,
    isRegistrationOpen,
    isCapacityFull,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export async function listTournaments(filter?: ListTournamentsFilter): Promise<TournamentItemDTO[]> {
  const parsed = tournamentQuerySchema.safeParse(filter || {});
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message || "Parameter query tidak valid");
  }

  const { status, gameId, q } = parsed.data;

  const where: Prisma.TournamentWhereInput = {};

  if (status && status !== "ALL") {
    where.status = status as TournamentStatus;
  }

  if (gameId && gameId.trim().length > 0) {
    where.gameId = gameId.trim();
  }

  if (q && q.trim().length > 0) {
    where.OR = [
      { name: { contains: q.trim(), mode: "insensitive" } },
      { slug: { contains: q.trim(), mode: "insensitive" } },
      { description: { contains: q.trim(), mode: "insensitive" } },
    ];
  }

  const list = await prisma.tournament.findMany({
    where,
    include: tournamentListInclude,
    orderBy: {
      createdAt: "desc",
    },
  });

  return list.map(mapTournamentItemDTO);
}

export async function getTournamentById(id: string): Promise<TournamentDetailDTO | null> {
  const t = await prisma.tournament.findUnique({
    where: { id },
    include: {
      game: {
        select: {
          id: true,
          title: true,
          genre: true,
          iconUrl: true,
          isActive: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          fullName: true,
          username: true,
        },
      },
      registrations: {
        include: {
          team: {
            select: {
              id: true,
              name: true,
              tag: true,
              logoUrl: true,
              ownerId: true,
              owner: {
                select: {
                  id: true,
                  fullName: true,
                  username: true,
                },
              },
              members: {
                select: {
                  id: true,
                },
              },
            },
          },
          registeredBy: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      matches: {
        select: {
          id: true,
          tournamentRound: true,
          tournamentMatchNumber: true,
          status: true,
          scheduledAt: true,
          teamA: {
            select: {
              id: true,
              name: true,
              tag: true,
            },
          },
          teamB: {
            select: {
              id: true,
              name: true,
              tag: true,
            },
          },
          winnerTeamId: true,
        },
        orderBy: {
          scheduledAt: "asc",
        },
      },
    },
  });

  if (!t) return null;

  const now = new Date();
  const regStart = new Date(t.registrationStart);
  const regEnd = new Date(t.registrationEnd);
  const confirmedRegistrations = t.registrations.filter(
    (r) => r.status === TournamentRegistrationStatus.CONFIRMED
  );
  const confirmedCount = confirmedRegistrations.length;

  const isRegistrationOpen =
    t.status === TournamentStatus.REGISTRATION_OPEN &&
    now >= regStart &&
    now <= regEnd &&
    confirmedCount < t.maxTeams;

  const isCapacityFull = confirmedCount >= t.maxTeams;

  const registrationsDTO: TournamentRegistrationDTO[] = t.registrations.map((r) => ({
    id: r.id,
    tournamentId: r.tournamentId,
    teamId: r.teamId,
    teamName: r.team.name,
    teamTag: r.team.tag,
    teamLogoUrl: r.team.logoUrl,
    ownerId: r.team.ownerId,
    ownerName: r.team.owner.fullName,
    registeredById: r.registeredById,
    registeredByName: r.registeredBy.fullName,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    memberCount: r.team.members.length,
  }));

  const matchesDTO: TournamentMatchSummaryDTO[] = t.matches.map((m) => ({
    id: m.id,
    tournamentRound: m.tournamentRound,
    tournamentMatchNumber: m.tournamentMatchNumber,
    status: m.status,
    scheduledAt: m.scheduledAt.toISOString(),
    teamA: m.teamA,
    teamB: m.teamB,
    winnerTeamId: m.winnerTeamId,
  }));

  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    description: t.description,
    gameId: t.gameId,
    gameTitle: t.game.title,
    gameGenre: t.game.genre,
    gameIconUrl: t.game.iconUrl,
    status: t.status,
    createdById: t.createdById,
    createdByName: t.createdBy.fullName,
    maxTeams: t.maxTeams,
    minTeams: t.minTeams,
    bestOf: t.bestOf,
    registrationStart: t.registrationStart.toISOString(),
    registrationEnd: t.registrationEnd.toISOString(),
    startAt: t.startAt.toISOString(),
    endAt: t.endAt ? t.endAt.toISOString() : null,
    rules: t.rules,
    prizePool: t.prizePool,
    entryFee: t.entryFee,
    format: t.format,
    confirmedTeamCount: confirmedCount,
    isRegistrationOpen,
    isCapacityFull,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    registrations: registrationsDTO,
    matches: matchesDTO,
  };
}

export async function getTournamentBySlug(slug: string): Promise<TournamentDetailDTO | null> {
  const t = await prisma.tournament.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!t) return null;
  return getTournamentById(t.id);
}

export async function createTournament(input: CreateTournamentInput): Promise<TournamentItemDTO> {
  const parsed = createTournamentSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message || "Data turnamen tidak valid");
  }

  const data = parsed.data;

  // Validate creator member exists
  const creator = await prisma.member.findUnique({
    where: { id: data.createdById },
    select: { id: true },
  });
  if (!creator) {
    throw new Error("Member pembuat turnamen tidak ditemukan");
  }

  // Validate game exists and is active
  const game = await prisma.game.findUnique({
    where: { id: data.gameId },
    select: { id: true, isActive: true },
  });
  if (!game) {
    throw new Error("Game tidak ditemukan");
  }
  if (!game.isActive) {
    throw new Error("Game yang dipilih sedang nonaktif");
  }

  // Handle slug
  let slug: string;
  if (data.slug) {
    const existing = await prisma.tournament.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });
    if (existing) {
      throw new Error("Slug turnamen sudah digunakan");
    }
    slug = data.slug;
  } else {
    slug = await generateUniqueSlug(data.name);
  }

  const created = await prisma.tournament.create({
    data: {
      name: data.name,
      slug,
      description: data.description || null,
      gameId: data.gameId,
      createdById: data.createdById,
      status: TournamentStatus.DRAFT,
      minTeams: data.minTeams,
      maxTeams: data.maxTeams,
      bestOf: data.bestOf,
      registrationStart: data.registrationStart,
      registrationEnd: data.registrationEnd,
      startAt: data.startAt,
      endAt: data.endAt || null,
      rules: data.rules || null,
      prizePool: data.prizePool || null,
      entryFee: data.entryFee || null,
      format: data.format || "SINGLE_ELIMINATION",
    },
    include: tournamentListInclude,
  });

  return mapTournamentItemDTO(created);
}

export async function updateTournament(id: string, input: UpdateTournamentInput): Promise<TournamentItemDTO> {
  const parsed = updateTournamentSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message || "Data update turnamen tidak valid");
  }

  const data = parsed.data;

  const current = await prisma.tournament.findUnique({
    where: { id },
    include: {
      registrations: {
        where: { status: "CONFIRMED" },
        select: { id: true },
      },
    },
  });

  if (!current) {
    throw new Error("Turnamen tidak ditemukan");
  }

  if (current.status === TournamentStatus.COMPLETED) {
    throw new Error("Turnamen sudah selesai dan tidak dapat diubah");
  }

  if (current.status === TournamentStatus.CANCELLED) {
    throw new Error("Turnamen sudah dibatalkan dan tidak dapat diubah");
  }

  // If REGISTRATION_OPEN, only limited fields can be edited
  if (current.status === TournamentStatus.REGISTRATION_OPEN) {
    if (data.minTeams !== undefined || data.maxTeams !== undefined) {
      if (data.maxTeams !== undefined && data.maxTeams < current.registrations.length) {
        throw new Error("maxTeams tidak boleh lebih kecil dari jumlah tim yang sudah terdaftar");
      }
    }
  }

  // If gameId changed, validate game
  if (data.gameId && data.gameId !== current.gameId) {
    const game = await prisma.game.findUnique({
      where: { id: data.gameId },
      select: { id: true, isActive: true },
    });
    if (!game) {
      throw new Error("Game tidak ditemukan");
    }
    if (!game.isActive) {
      throw new Error("Game yang dipilih sedang nonaktif");
    }
  }

  // If slug changed, validate uniqueness
  let slug = current.slug;
  if (data.slug && data.slug !== current.slug) {
    const existing = await prisma.tournament.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });
    if (existing && existing.id !== id) {
      throw new Error("Slug turnamen sudah digunakan");
    }
    slug = data.slug;
  }

  const updateData: Prisma.TournamentUpdateInput = {
    ...(data.name && { name: data.name }),
    ...(data.slug && { slug }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.gameId && { game: { connect: { id: data.gameId } } }),
    ...(data.minTeams !== undefined && { minTeams: data.minTeams }),
    ...(data.maxTeams !== undefined && { maxTeams: data.maxTeams }),
    ...(data.bestOf !== undefined && { bestOf: data.bestOf }),
    ...(data.registrationStart && { registrationStart: data.registrationStart }),
    ...(data.registrationEnd && { registrationEnd: data.registrationEnd }),
    ...(data.startAt && { startAt: data.startAt }),
    ...(data.endAt !== undefined && { endAt: data.endAt }),
    ...(data.rules !== undefined && { rules: data.rules }),
    ...(data.prizePool !== undefined && { prizePool: data.prizePool }),
    ...(data.entryFee !== undefined && { entryFee: data.entryFee }),
  };

  const updated = await prisma.tournament.update({
    where: { id },
    data: updateData,
    include: tournamentListInclude,
  });

  return mapTournamentItemDTO(updated);
}

export async function deleteTournament(id: string, actorMemberId: string): Promise<{ deleted: boolean }> {
  const current = await prisma.tournament.findUnique({
    where: { id },
    include: {
      registrations: { select: { id: true } },
      matches: { select: { id: true } },
    },
  });

  if (!current) {
    throw new Error("Turnamen tidak ditemukan");
  }

  // Deletion rules: If tournament has registrations or matches/history, do NOT hard-delete it
  if (current.registrations.length > 0 || current.matches.length > 0) {
    throw new Error("Turnamen memiliki data registrasi/pertandingan dan tidak dapat dihapus, gunakan pembatalan");
  }

  if (current.createdById !== actorMemberId) {
    throw new Error("Hanya pembuat turnamen yang dapat menghapus turnamen");
  }

  await prisma.tournament.delete({
    where: { id },
  });

  return { deleted: true };
}

export async function openRegistration(id: string, actorMemberId: string): Promise<TournamentItemDTO> {
  const parsed = tournamentActionSchema.safeParse({ actorMemberId });
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message || "Data aksi tidak valid");
  }

  const current = await prisma.tournament.findUnique({
    where: { id },
    include: {
      game: { select: { isActive: true } },
    },
  });

  if (!current) {
    throw new Error("Turnamen tidak ditemukan");
  }

  if (current.status !== TournamentStatus.DRAFT) {
    throw new Error(`Pendaftaran tidak dapat dibuka dari status ${current.status}`);
  }

  if (!current.game.isActive) {
    throw new Error("Game turnamen sedang nonaktif, tidak dapat membuka pendaftaran");
  }

  const updated = await prisma.tournament.update({
    where: { id },
    data: {
      status: TournamentStatus.REGISTRATION_OPEN,
    },
    include: tournamentListInclude,
  });

  return mapTournamentItemDTO(updated);
}

export async function closeRegistration(id: string, actorMemberId: string): Promise<TournamentItemDTO> {
  const parsed = tournamentActionSchema.safeParse({ actorMemberId });
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message || "Data aksi tidak valid");
  }

  const current = await prisma.tournament.findUnique({
    where: { id },
  });

  if (!current) {
    throw new Error("Turnamen tidak ditemukan");
  }

  if (current.status !== TournamentStatus.REGISTRATION_OPEN) {
    throw new Error(`Pendaftaran tidak dapat ditutup dari status ${current.status}`);
  }

  const updated = await prisma.tournament.update({
    where: { id },
    data: {
      status: TournamentStatus.REGISTRATION_CLOSED,
    },
    include: tournamentListInclude,
  });

  return mapTournamentItemDTO(updated);
}

export async function startTournament(id: string, actorMemberId: string): Promise<TournamentItemDTO> {
  const parsed = tournamentActionSchema.safeParse({ actorMemberId });
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message || "Data aksi tidak valid");
  }

  const current = await prisma.tournament.findUnique({
    where: { id },
    include: {
      registrations: {
        where: { status: TournamentRegistrationStatus.CONFIRMED },
        select: { id: true },
      },
    },
  });

  if (!current) {
    throw new Error("Turnamen tidak ditemukan");
  }

  if (current.status !== TournamentStatus.REGISTRATION_CLOSED) {
    throw new Error(`Turnamen hanya dapat dimulai dari status REGISTRATION_CLOSED, status saat ini: ${current.status}`);
  }

  if (current.registrations.length < current.minTeams) {
    throw new Error(
      `Jumlah tim terkonfirmasi (${current.registrations.length}) belum memenuhi batas minimal (${current.minTeams})`
    );
  }

  const updated = await prisma.tournament.update({
    where: { id },
    data: {
      status: TournamentStatus.IN_PROGRESS,
    },
    include: tournamentListInclude,
  });

  return mapTournamentItemDTO(updated);
}

export async function completeTournament(id: string, actorMemberId: string): Promise<TournamentItemDTO> {
  const parsed = tournamentActionSchema.safeParse({ actorMemberId });
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message || "Data aksi tidak valid");
  }

  const current = await prisma.tournament.findUnique({
    where: { id },
  });

  if (!current) {
    throw new Error("Turnamen tidak ditemukan");
  }

  if (current.status !== TournamentStatus.IN_PROGRESS) {
    throw new Error(`Turnamen hanya dapat diselesaikan dari status IN_PROGRESS, status saat ini: ${current.status}`);
  }

  const updated = await prisma.tournament.update({
    where: { id },
    data: {
      status: TournamentStatus.COMPLETED,
    },
    include: tournamentListInclude,
  });

  return mapTournamentItemDTO(updated);
}

export async function cancelTournament(
  id: string,
  actorMemberId: string,
  reason?: string
): Promise<TournamentItemDTO> {
  const parsed = tournamentActionSchema.safeParse({ actorMemberId, reason });
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message || "Data aksi tidak valid");
  }

  const current = await prisma.tournament.findUnique({
    where: { id },
  });

  if (!current) {
    throw new Error("Turnamen tidak ditemukan");
  }

  if (current.status === TournamentStatus.COMPLETED) {
    throw new Error("Turnamen sudah selesai dan tidak dapat dibatalkan");
  }

  if (current.status === TournamentStatus.CANCELLED) {
    throw new Error("Turnamen sudah berstatus dibatalkan");
  }

  const updated = await prisma.tournament.update({
    where: { id },
    data: {
      status: TournamentStatus.CANCELLED,
    },
    include: tournamentListInclude,
  });

  return mapTournamentItemDTO(updated);
}

export async function registerTeam(
  tournamentId: string,
  input: { teamId: string; actorMemberId: string }
): Promise<TournamentRegistrationDTO> {
  const parsed = registerTournamentTeamSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message || "Data pendaftaran tim tidak valid");
  }

  const { teamId, actorMemberId } = parsed.data;

  // Execute inside transaction to protect against concurrent capacity race condition
  return await prisma.$transaction(async (tx) => {
    // 0. Lock tournament row in PostgreSQL to serialize concurrent registration requests
    await tx.$executeRaw`SELECT id FROM "Tournament" WHERE id = ${tournamentId} FOR UPDATE`;

    // 1. Validate Tournament
    const tournament = await tx.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        game: { select: { id: true, isActive: true } },
      },
    });

    if (!tournament) {
      throw new Error("Turnamen tidak ditemukan");
    }

    if (tournament.status !== TournamentStatus.REGISTRATION_OPEN) {
      throw new Error("Pendaftaran turnamen belum dibuka atau sudah ditutup");
    }

    const now = new Date();
    if (now < new Date(tournament.registrationStart)) {
      throw new Error("Periode pendaftaran belum dimulai");
    }

    if (now > new Date(tournament.registrationEnd)) {
      throw new Error("Periode pendaftaran sudah berakhir");
    }

    if (!tournament.game.isActive) {
      throw new Error("Game turnamen sedang nonaktif");
    }

    // 2. Validate Team & Roster
    const team = await tx.team.findUnique({
      where: { id: teamId },
      include: {
        owner: { select: { id: true, fullName: true, username: true } },
        members: {
          select: {
            id: true,
            memberId: true,
            role: true,
          },
        },
      },
    });

    if (!team) {
      throw new Error("Tim tidak ditemukan");
    }

    if (team.members.length === 0) {
      throw new Error("Roster tim tidak valid (tim tidak memiliki anggota)");
    }

    // Owner authorization
    if (team.ownerId !== actorMemberId) {
      throw new Error("Hanya owner tim yang dapat mendaftarkan tim");
    }

    // 3. Check existing registration
    const existingRegistration = await tx.tournamentRegistration.findUnique({
      where: {
        tournamentId_teamId: {
          tournamentId,
          teamId,
        },
      },
    });

    if (existingRegistration && existingRegistration.status === TournamentRegistrationStatus.CONFIRMED) {
      throw new Error("Tim sudah terdaftar pada turnamen ini");
    }

    // 4. Check Capacity
    const confirmedCount = await tx.tournamentRegistration.count({
      where: {
        tournamentId,
        status: TournamentRegistrationStatus.CONFIRMED,
      },
    });

    if (confirmedCount >= tournament.maxTeams) {
      throw new Error("Kapasitas turnamen sudah penuh");
    }

    // 5. Create or Update Registration
    let registration;
    if (existingRegistration) {
      registration = await tx.tournamentRegistration.update({
        where: { id: existingRegistration.id },
        data: {
          status: TournamentRegistrationStatus.CONFIRMED,
          registeredById: actorMemberId,
        },
        include: {
          team: {
            include: {
              owner: { select: { id: true, fullName: true, username: true } },
              members: { select: { id: true } },
            },
          },
          registeredBy: {
            select: { id: true, fullName: true, username: true },
          },
        },
      });
    } else {
      registration = await tx.tournamentRegistration.create({
        data: {
          tournamentId,
          teamId,
          registeredById: actorMemberId,
          status: TournamentRegistrationStatus.CONFIRMED,
        },
        include: {
          team: {
            include: {
              owner: { select: { id: true, fullName: true, username: true } },
              members: { select: { id: true } },
            },
          },
          registeredBy: {
            select: { id: true, fullName: true, username: true },
          },
        },
      });
    }

    return {
      id: registration.id,
      tournamentId: registration.tournamentId,
      teamId: registration.teamId,
      teamName: registration.team.name,
      teamTag: registration.team.tag,
      teamLogoUrl: registration.team.logoUrl,
      ownerId: registration.team.ownerId,
      ownerName: registration.team.owner.fullName,
      registeredById: registration.registeredById,
      registeredByName: registration.registeredBy.fullName,
      status: registration.status,
      createdAt: registration.createdAt.toISOString(),
      updatedAt: registration.updatedAt.toISOString(),
      memberCount: registration.team.members.length,
    };
  });
}

export async function withdrawTeam(
  tournamentId: string,
  input: { teamId: string; actorMemberId: string }
): Promise<TournamentRegistrationDTO> {
  const parsed = withdrawTournamentTeamSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message || "Data penarikan tim tidak valid");
  }

  const { teamId, actorMemberId } = parsed.data;

  return await prisma.$transaction(async (tx) => {
    const tournament = await tx.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, status: true },
    });

    if (!tournament) {
      throw new Error("Turnamen tidak ditemukan");
    }

    if (tournament.status !== TournamentStatus.REGISTRATION_OPEN) {
      throw new Error("Penarikan registrasi hanya dapat dilakukan saat REGISTRATION_OPEN");
    }

    const team = await tx.team.findUnique({
      where: { id: teamId },
      select: { id: true, ownerId: true },
    });

    if (!team) {
      throw new Error("Tim tidak ditemukan");
    }

    if (team.ownerId !== actorMemberId) {
      throw new Error("Hanya owner tim yang dapat membatalkan registrasi tim");
    }

    const registration = await tx.tournamentRegistration.findUnique({
      where: {
        tournamentId_teamId: {
          tournamentId,
          teamId,
        },
      },
      include: {
        team: {
          include: {
            owner: { select: { id: true, fullName: true, username: true } },
            members: { select: { id: true } },
          },
        },
        registeredBy: {
          select: { id: true, fullName: true, username: true },
        },
      },
    });

    if (!registration) {
      throw new Error("Registrasi tim tidak ditemukan pada turnamen ini");
    }

    if (registration.status !== TournamentRegistrationStatus.CONFIRMED) {
      throw new Error(`Registrasi tim berstatus ${registration.status}, tidak dapat ditarik`);
    }

    // Preserve history: update status to WITHDRAWN, do NOT delete
    const updated = await tx.tournamentRegistration.update({
      where: { id: registration.id },
      data: {
        status: TournamentRegistrationStatus.WITHDRAWN,
      },
      include: {
        team: {
          include: {
            owner: { select: { id: true, fullName: true, username: true } },
            members: { select: { id: true } },
          },
        },
        registeredBy: {
          select: { id: true, fullName: true, username: true },
        },
      },
    });

    return {
      id: updated.id,
      tournamentId: updated.tournamentId,
      teamId: updated.teamId,
      teamName: updated.team.name,
      teamTag: updated.team.tag,
      teamLogoUrl: updated.team.logoUrl,
      ownerId: updated.team.ownerId,
      ownerName: updated.team.owner.fullName,
      registeredById: updated.registeredById,
      registeredByName: updated.registeredBy.fullName,
      status: updated.status,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      memberCount: updated.team.members.length,
    };
  });
}

export async function listRegistrations(tournamentId: string): Promise<TournamentRegistrationDTO[]> {
  const registrations = await prisma.tournamentRegistration.findMany({
    where: { tournamentId },
    include: {
      team: {
        include: {
          owner: { select: { id: true, fullName: true, username: true } },
          members: { select: { id: true } },
        },
      },
      registeredBy: {
        select: { id: true, fullName: true, username: true },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return registrations.map((r) => ({
    id: r.id,
    tournamentId: r.tournamentId,
    teamId: r.teamId,
    teamName: r.team.name,
    teamTag: r.team.tag,
    teamLogoUrl: r.team.logoUrl,
    ownerId: r.team.ownerId,
    ownerName: r.team.owner.fullName,
    registeredById: r.registeredById,
    registeredByName: r.registeredBy.fullName,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    memberCount: r.team.members.length,
  }));
}
