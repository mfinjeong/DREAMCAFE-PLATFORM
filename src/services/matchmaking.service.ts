import { prisma } from "@/lib/prisma";
import {
  CompetitiveMatchStatus,
  MatchmakingOfferStatus,
  MatchmakingQueueStatus,
  Prisma,
} from "@prisma/client";
import {
  MatchmakingOfferDTO,
  MatchmakingQueueDTO,
  MatchmakingTeamSummary,
  TeamMatchmakingStateDTO,
} from "@/lib/types";
import {
  joinMatchmakingQueueSchema,
  matchmakingActionSchema,
  matchmakingQuerySchema,
} from "@/lib/validators";

export interface JoinMatchmakingQueueInput {
  teamId: string;
  gameId: string;
  minRating: number;
  maxRating: number;
  actorMemberId: string;
}

export interface ListMatchmakingQueueFilter {
  status?: string;
  gameId?: string;
  teamId?: string;
}

const queueInclude = {
  team: {
    include: {
      owner: { select: { id: true, fullName: true, username: true } },
      members: {
        include: {
          member: { select: { id: true, dreamRating: true } },
        },
      },
    },
  },
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
} as const;

type QueueWithRelations = Prisma.MatchmakingQueueGetPayload<{
  include: typeof queueInclude;
}>;

const offerInclude = {
  teamA: {
    include: {
      owner: { select: { id: true, fullName: true, username: true } },
      members: {
        include: {
          member: { select: { id: true, dreamRating: true } },
        },
      },
    },
  },
  teamB: {
    include: {
      owner: { select: { id: true, fullName: true, username: true } },
      members: {
        include: {
          member: { select: { id: true, dreamRating: true } },
        },
      },
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
} as const;

type OfferWithRelations = Prisma.MatchmakingOfferGetPayload<{
  include: typeof offerInclude;
}>;

function buildTeamSummary(team: OfferWithRelations["teamA"]): MatchmakingTeamSummary {
  const members = team.members || [];
  const memberCount = members.length;
  const totalRating = members.reduce(
    (sum, m) => sum + (m.member?.dreamRating || 0),
    0
  );
  const teamRating = memberCount > 0 ? Math.round(totalRating / memberCount) : 0;

  return {
    id: team.id,
    name: team.name,
    tag: team.tag,
    logoUrl: team.logoUrl,
    ownerId: team.ownerId,
    ownerName: team.owner.fullName,
    teamRating,
    memberCount,
  };
}

function mapOfferDTO(offer: OfferWithRelations): MatchmakingOfferDTO {
  return {
    id: offer.id,
    queueEntryAId: offer.queueEntryAId,
    queueEntryBId: offer.queueEntryBId,
    teamAId: offer.teamAId,
    teamBId: offer.teamBId,
    teamA: buildTeamSummary(offer.teamA),
    teamB: buildTeamSummary(offer.teamB),
    gameId: offer.gameId,
    gameTitle: offer.game.title,
    gameGenre: offer.game.genre,
    status: offer.status,
    acceptedByA: offer.acceptedByA,
    acceptedByB: offer.acceptedByB,
    createdAt: offer.createdAt.toISOString(),
    expiresAt: offer.expiresAt.toISOString(),
    competitiveMatchId: offer.competitiveMatchId,
  };
}

function mapQueueDTO(
  queue: QueueWithRelations,
  offer?: OfferWithRelations | null
): MatchmakingQueueDTO {
  return {
    id: queue.id,
    teamId: queue.teamId,
    team: buildTeamSummary(queue.team),
    gameId: queue.gameId,
    gameTitle: queue.game.title,
    gameGenre: queue.game.genre,
    teamRating: queue.teamRating,
    minRating: queue.minRating,
    maxRating: queue.maxRating,
    status: queue.status,
    createdById: queue.createdById,
    createdByName: queue.createdBy.fullName,
    createdAt: queue.createdAt.toISOString(),
    updatedAt: queue.updatedAt.toISOString(),
    matchedAt: queue.matchedAt ? queue.matchedAt.toISOString() : null,
    expiresAt: queue.expiresAt ? queue.expiresAt.toISOString() : null,
    currentOffer: offer ? mapOfferDTO(offer) : null,
  };
}

/**
 * Hitung rating rata-rata tim saat ini berdasarkan Member.dreamRating nyata
 */
export async function calculateTeamRating(
  teamId: string
): Promise<{ teamRating: number; memberCount: number }> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        include: {
          member: {
            select: { dreamRating: true },
          },
        },
      },
    },
  });

  if (!team) {
    throw new Error("Tim tidak ditemukan");
  }

  const memberCount = team.members.length;
  if (memberCount === 0) {
    return { teamRating: 0, memberCount: 0 };
  }

  const totalRating = team.members.reduce(
    (sum, tm) => sum + (tm.member?.dreamRating || 0),
    0
  );
  const teamRating = Math.round(totalRating / memberCount);

  return { teamRating, memberCount };
}

/**
 * Bergabung ke antrean matchmaking
 */
export async function joinMatchmakingQueue(
  input: JoinMatchmakingQueueInput
): Promise<MatchmakingQueueDTO> {
  const validated = joinMatchmakingQueueSchema.parse(input);

  // 1. Validasi tim
  const team = await prisma.team.findUnique({
    where: { id: validated.teamId },
    include: {
      members: {
        include: {
          member: { select: { id: true, dreamRating: true } },
        },
      },
      owner: true,
    },
  });

  if (!team) {
    throw new Error("Tim tidak ditemukan");
  }

  if (team.members.length === 0) {
    throw new Error("Tim harus memiliki minimal 1 anggota untuk masuk antrean matchmaking");
  }

  // Otorisasi: Harus anggota atau owner tim
  const isMemberOrOwner =
    team.ownerId === validated.actorMemberId ||
    team.members.some((m) => m.memberId === validated.actorMemberId);

  if (!isMemberOrOwner) {
    throw new Error("Hanya anggota atau owner tim yang dapat mendaftarkan tim ke antrean matchmaking");
  }

  // 2. Validasi game
  const game = await prisma.game.findUnique({
    where: { id: validated.gameId },
  });

  if (!game) {
    throw new Error("Game kompetitif tidak ditemukan");
  }

  if (!game.isActive) {
    throw new Error("Game yang dipilih sedang tidak aktif");
  }

  // 3. Cek apakah tim sedang dalam LIVE competitive match
  const liveMatch = await prisma.competitiveMatch.findFirst({
    where: {
      status: CompetitiveMatchStatus.LIVE,
      OR: [{ teamAId: validated.teamId }, { teamBId: validated.teamId }],
    },
  });

  if (liveMatch) {
    throw new Error("Tim sedang dalam pertandingan kompetitif LIVE dan tidak dapat masuk antrean");
  }

  // 4. Hitung team rating server-side
  const totalRating = team.members.reduce(
    (sum, tm) => sum + (tm.member?.dreamRating || 0),
    0
  );
  const teamRating = Math.round(totalRating / team.members.length);

  // 5. Eksekusi pembuatan antrean dalam transaksi
  const queueEntry = await prisma.$transaction(
    async (tx) => {
      // Cek antrean aktif tim ini
      const existingActiveQueue = await tx.matchmakingQueue.findFirst({
        where: {
          teamId: validated.teamId,
          status: {
            in: [
              MatchmakingQueueStatus.QUEUED,
              MatchmakingQueueStatus.MATCH_FOUND,
              MatchmakingQueueStatus.ACCEPTING,
            ],
          },
        },
      });

      if (existingActiveQueue) {
        throw new Error("Tim sudah memiliki antrean matchmaking yang aktif");
      }

      return await tx.matchmakingQueue.create({
        data: {
          teamId: validated.teamId,
          gameId: validated.gameId,
          teamRating,
          minRating: validated.minRating,
          maxRating: validated.maxRating,
          status: MatchmakingQueueStatus.QUEUED,
          createdById: validated.actorMemberId,
        },
        include: queueInclude,
      });
    },
    { maxWait: 15000, timeout: 30000 }
  );

  // 6. Coba pasangkan secara otomatis (auto-match)
  try {
    const offer = await findCompatibleOpponent(queueEntry.id);
    if (offer) {
      const refreshedQueue = await prisma.matchmakingQueue.findUnique({
        where: { id: queueEntry.id },
        include: queueInclude,
      });
      const fullOffer = await prisma.matchmakingOffer.findUnique({
        where: { id: offer.id },
        include: offerInclude,
      });
      return mapQueueDTO(refreshedQueue!, fullOffer);
    }
  } catch {
    // Jika matching otomatis terkendala, tetap kembalikan queueEntry QUEUED
  }

  return mapQueueDTO(queueEntry, null);
}

/**
 * Cari dan pasangkan lawan yang kompatibel secara mutual
 */
export async function findCompatibleOpponent(
  queueId: string
): Promise<MatchmakingOfferDTO | null> {
  return await prisma.$transaction(
    async (tx) => {
      // 1. Ambil queue entry sumber
      const candidate = await tx.matchmakingQueue.findUnique({
        where: { id: queueId },
        include: queueInclude,
      });

      if (!candidate) {
        return null;
      }

      // Jika sudah memiliki penawaran aktif (ACCEPTING / MATCH_FOUND), kembalikan penawaran yang ada (idempotent / prevent duplicate offer)
      if (
        candidate.status === MatchmakingQueueStatus.ACCEPTING ||
        candidate.status === MatchmakingQueueStatus.MATCH_FOUND
      ) {
        const existingOffer = await tx.matchmakingOffer.findFirst({
          where: {
            OR: [{ queueEntryAId: candidate.id }, { queueEntryBId: candidate.id }],
            status: MatchmakingOfferStatus.PENDING,
          },
          include: offerInclude,
        });
        if (existingOffer) {
          return mapOfferDTO(existingOffer);
        }
        return null;
      }

      if (candidate.status !== MatchmakingQueueStatus.QUEUED) {
        return null;
      }

      // 2. Cari antrean lawan yang kompatibel dalam game yang sama:
      // - Bukan antrean ini sendiri
      // - Bukan dari tim yang sama (cegah self-match)
      // - Game sama
      // - Status masih QUEUED
      // - Kompatibel dua arah (mutual compatibility):
      //   opp.teamRating >= cand.minRating && opp.teamRating <= cand.maxRating
      //   cand.teamRating >= opp.minRating && cand.teamRating <= opp.maxRating
      const opponent = await tx.matchmakingQueue.findFirst({
        where: {
          id: { not: candidate.id },
          teamId: { not: candidate.teamId },
          gameId: candidate.gameId,
          status: MatchmakingQueueStatus.QUEUED,
          teamRating: {
            gte: candidate.minRating,
            lte: candidate.maxRating,
          },
          minRating: { lte: candidate.teamRating },
          maxRating: { gte: candidate.teamRating },
        },
        orderBy: { createdAt: "asc" }, // FIFO
        include: queueInclude,
      });

      if (!opponent) {
        return null;
      }

      // 3. Pastikan kedua tim tidak sedang dalam LIVE competitive match
      const liveCheck = await tx.competitiveMatch.findFirst({
        where: {
          status: CompetitiveMatchStatus.LIVE,
          OR: [
            { teamAId: { in: [candidate.teamId, opponent.teamId] } },
            { teamBId: { in: [candidate.teamId, opponent.teamId] } },
          ],
        },
      });

      if (liveCheck) {
        return null;
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 120000); // 2 menit batas penerimaan

      // 4. Update status kedua queue menjadi ACCEPTING
      await tx.matchmakingQueue.update({
        where: { id: candidate.id },
        data: {
          status: MatchmakingQueueStatus.ACCEPTING,
          matchedAt: now,
          expiresAt,
        },
      });

      await tx.matchmakingQueue.update({
        where: { id: opponent.id },
        data: {
          status: MatchmakingQueueStatus.ACCEPTING,
          matchedAt: now,
          expiresAt,
        },
      });

      // 5. Buat penawaran pertandingan (MatchmakingOffer)
      // Urutkan secara FIFO sehingga tim yang mengantre lebih awal menjadi Team A
      const isCandidateFirst = candidate.createdAt.getTime() <= opponent.createdAt.getTime();
      const firstEntry = isCandidateFirst ? candidate : opponent;
      const secondEntry = isCandidateFirst ? opponent : candidate;

      const offer = await tx.matchmakingOffer.create({
        data: {
          queueEntryAId: firstEntry.id,
          queueEntryBId: secondEntry.id,
          teamAId: firstEntry.teamId,
          teamBId: secondEntry.teamId,
          gameId: candidate.gameId,
          status: MatchmakingOfferStatus.PENDING,
          acceptedByA: false,
          acceptedByB: false,
          expiresAt,
        },
        include: offerInclude,
      });

      return mapOfferDTO(offer);
    },
    { maxWait: 15000, timeout: 30000 }
  );
}

/**
 * Jalankan pencarian matchmaking untuk semua antrean yang siap
 */
export async function runMatchmaking(
  gameId?: string
): Promise<MatchmakingOfferDTO[]> {
  // Bersihkan penawaran kedaluwarsa terlebih dahulu
  await expireMatchOffers();

  const where: Prisma.MatchmakingQueueWhereInput = {
    status: MatchmakingQueueStatus.QUEUED,
  };
  if (gameId) {
    where.gameId = gameId;
  }

  const queuedEntries = await prisma.matchmakingQueue.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });

  const createdOffers: MatchmakingOfferDTO[] = [];

  for (const entry of queuedEntries) {
    try {
      const offer = await findCompatibleOpponent(entry.id);
      if (offer) {
        createdOffers.push(offer);
      }
    } catch {
      // Lanjutkan iterasi jika ada konflik antrean
    }
  }

  return createdOffers;
}

/**
 * Terima penawaran matchmaking oleh salah satu tim
 */
export async function acceptMatchOffer(
  queueId: string,
  actorMemberId: string
): Promise<MatchmakingOfferDTO> {
  const validated = matchmakingActionSchema.parse({ actorMemberId });

  return await prisma.$transaction(
    async (tx) => {
      // 1. Cari antrean
      const queue = await tx.matchmakingQueue.findUnique({
        where: { id: queueId },
        include: { team: { include: { members: true } } },
      });

      if (!queue) {
        throw new Error("Antrean matchmaking tidak ditemukan");
      }

      // Validasi kepemilikan/keanggotaan tim
      const isMemberOrOwner =
        queue.team.ownerId === validated.actorMemberId ||
        queue.team.members.some((m) => m.memberId === validated.actorMemberId);

      if (!isMemberOrOwner) {
        throw new Error("Hanya anggota atau owner tim yang dapat menerima tawaran pertandingan");
      }

      // 2. Cari offer aktif
      const offer = await tx.matchmakingOffer.findFirst({
        where: {
          status: MatchmakingOfferStatus.PENDING,
          OR: [{ queueEntryAId: queueId }, { queueEntryBId: queueId }],
        },
        include: offerInclude,
      });

      if (!offer) {
        // Cek apakah offer sudah ACCEPTED sebelumnya
        const existingAccepted = await tx.matchmakingOffer.findFirst({
          where: {
            status: MatchmakingOfferStatus.ACCEPTED,
            OR: [{ queueEntryAId: queueId }, { queueEntryBId: queueId }],
          },
          include: offerInclude,
        });

        if (existingAccepted) {
          return mapOfferDTO(existingAccepted);
        }

        throw new Error("Tidak ada tawaran pertandingan aktif untuk antrean ini");
      }

      // 3. Cek apakah tawaran telah kedaluwarsa
      if (offer.expiresAt.getTime() < Date.now()) {
        await tx.matchmakingOffer.update({
          where: { id: offer.id },
          data: { status: MatchmakingOfferStatus.EXPIRED },
        });
        await tx.matchmakingQueue.updateMany({
          where: { id: { in: [offer.queueEntryAId, offer.queueEntryBId] } },
          data: { status: MatchmakingQueueStatus.EXPIRED },
        });
        throw new Error("Tawaran pertandingan matchmaking telah kedaluwarsa");
      }

      const isA = offer.queueEntryAId === queueId;
      const isB = offer.queueEntryBId === queueId;

      // Idempotensi jika tim ini sudah pernah accept
      if ((isA && offer.acceptedByA) || (isB && offer.acceptedByB)) {
        return mapOfferDTO(offer);
      }

      const newAcceptedByA = isA ? true : offer.acceptedByA;
      const newAcceptedByB = isB ? true : offer.acceptedByB;
      const bothAccepted = newAcceptedByA && newAcceptedByB;

      if (bothAccepted) {
        // KEDUA TIM TELAH MENERIMA:
        // 1. Buat CompetitiveMatch resmi (status PENDING)
        const compMatch = await tx.competitiveMatch.create({
          data: {
            teamAId: offer.teamAId,
            teamBId: offer.teamBId,
            gameId: offer.gameId,
            scheduledAt: new Date(),
            bestOf: 1,
            status: CompetitiveMatchStatus.PENDING,
            createdById: validated.actorMemberId,
            note: `Pertandingan resmi hasil Matchmaking (${offer.teamA.name} vs ${offer.teamB.name})`,
          },
        });

        // 2. Tandai penawaran sebagai ACCEPTED
        const updatedOffer = await tx.matchmakingOffer.update({
          where: { id: offer.id },
          data: {
            status: MatchmakingOfferStatus.ACCEPTED,
            acceptedByA: true,
            acceptedByB: true,
            competitiveMatchId: compMatch.id,
          },
          include: offerInclude,
        });

        // 3. Tutup status kedua antrean sebagai ACCEPTED
        await tx.matchmakingQueue.updateMany({
          where: { id: { in: [offer.queueEntryAId, offer.queueEntryBId] } },
          data: { status: MatchmakingQueueStatus.ACCEPTED },
        });

        return mapOfferDTO(updatedOffer);
      } else {
        // HANYA SALAH SATU TIM YANG BARU ACCEPT
        const updatedOffer = await tx.matchmakingOffer.update({
          where: { id: offer.id },
          data: {
            acceptedByA: newAcceptedByA,
            acceptedByB: newAcceptedByB,
          },
          include: offerInclude,
        });

        return mapOfferDTO(updatedOffer);
      }
    },
    { maxWait: 15000, timeout: 30000 }
  );
}

/**
 * Tolak penawaran matchmaking
 */
export async function declineMatchOffer(
  queueId: string,
  actorMemberId: string
): Promise<MatchmakingOfferDTO> {
  const validated = matchmakingActionSchema.parse({ actorMemberId });

  return await prisma.$transaction(
    async (tx) => {
      const queue = await tx.matchmakingQueue.findUnique({
        where: { id: queueId },
        include: { team: { include: { members: true } } },
      });

      if (!queue) {
        throw new Error("Antrean matchmaking tidak ditemukan");
      }

      const isMemberOrOwner =
        queue.team.ownerId === validated.actorMemberId ||
        queue.team.members.some((m) => m.memberId === validated.actorMemberId);

      if (!isMemberOrOwner) {
        throw new Error("Hanya anggota atau owner tim yang dapat menolak tawaran pertandingan");
      }

      const offer = await tx.matchmakingOffer.findFirst({
        where: {
          status: MatchmakingOfferStatus.PENDING,
          OR: [{ queueEntryAId: queueId }, { queueEntryBId: queueId }],
        },
        include: offerInclude,
      });

      if (!offer) {
        throw new Error("Tidak ada tawaran pertandingan aktif untuk ditolak");
      }

      // Tandai offer sebagai DECLINED
      const updatedOffer = await tx.matchmakingOffer.update({
        where: { id: offer.id },
        data: {
          status: MatchmakingOfferStatus.DECLINED,
        },
        include: offerInclude,
      });

      // Update status queue kedua tim menjadi DECLINED
      await tx.matchmakingQueue.updateMany({
        where: { id: { in: [offer.queueEntryAId, offer.queueEntryBId] } },
        data: {
          status: MatchmakingQueueStatus.DECLINED,
        },
      });

      return mapOfferDTO(updatedOffer);
    },
    { maxWait: 15000, timeout: 30000 }
  );
}

/**
 * Keluar dari antrean matchmaking
 */
export async function leaveMatchmakingQueue(
  queueId: string,
  actorMemberId: string
): Promise<MatchmakingQueueDTO> {
  const validated = matchmakingActionSchema.parse({ actorMemberId });

  return await prisma.$transaction(
    async (tx) => {
      const queue = await tx.matchmakingQueue.findUnique({
        where: { id: queueId },
        include: {
          ...queueInclude,
          team: {
            include: {
              ...queueInclude.team.include,
              members: {
                include: {
                  member: { select: { id: true, dreamRating: true } },
                },
              },
            },
          },
        },
      });

      if (!queue) {
        throw new Error("Antrean matchmaking tidak ditemukan");
      }

      const isMemberOrOwner =
        queue.team.ownerId === validated.actorMemberId ||
        queue.team.members.some((m) => m.memberId === validated.actorMemberId);

      if (!isMemberOrOwner) {
        throw new Error("Hanya anggota atau owner tim yang dapat membatalkan antrean matchmaking");
      }

      if (
        queue.status === MatchmakingQueueStatus.CANCELLED ||
        queue.status === MatchmakingQueueStatus.DECLINED ||
        queue.status === MatchmakingQueueStatus.EXPIRED ||
        queue.status === MatchmakingQueueStatus.ACCEPTED
      ) {
        return mapQueueDTO(queue, null);
      }

      // Jika ada offer pending saat leave, batalkan offer tersebut juga
      const pendingOffer = await tx.matchmakingOffer.findFirst({
        where: {
          status: MatchmakingOfferStatus.PENDING,
          OR: [{ queueEntryAId: queueId }, { queueEntryBId: queueId }],
        },
      });

      if (pendingOffer) {
        await tx.matchmakingOffer.update({
          where: { id: pendingOffer.id },
          data: { status: MatchmakingOfferStatus.DECLINED },
        });

        // Set queue lawan juga menjadi DECLINED
        const otherQueueId =
          pendingOffer.queueEntryAId === queueId
            ? pendingOffer.queueEntryBId
            : pendingOffer.queueEntryAId;

        await tx.matchmakingQueue.update({
          where: { id: otherQueueId },
          data: { status: MatchmakingQueueStatus.DECLINED },
        });
      }

      const cancelledQueue = await tx.matchmakingQueue.update({
        where: { id: queueId },
        data: { status: MatchmakingQueueStatus.CANCELLED },
        include: queueInclude,
      });

      return mapQueueDTO(cancelledQueue, null);
    },
    { maxWait: 15000, timeout: 30000 }
  );
}

/**
 * Kedaluwarsakan penawaran matchmaking yang melewati batas waktu
 */
export async function expireMatchOffers(): Promise<number> {
  const now = new Date();

  const expiredOffers = await prisma.matchmakingOffer.findMany({
    where: {
      status: MatchmakingOfferStatus.PENDING,
      expiresAt: { lt: now },
    },
  });

  if (expiredOffers.length === 0) {
    return 0;
  }

  const offerIds = expiredOffers.map((o) => o.id);
  const queueIds = [
    ...expiredOffers.map((o) => o.queueEntryAId),
    ...expiredOffers.map((o) => o.queueEntryBId),
  ];

  await prisma.$transaction(
    async (tx) => {
      await tx.matchmakingOffer.updateMany({
        where: { id: { in: offerIds } },
        data: { status: MatchmakingOfferStatus.EXPIRED },
      });

      await tx.matchmakingQueue.updateMany({
        where: {
          id: { in: queueIds },
          status: { in: [MatchmakingQueueStatus.ACCEPTING, MatchmakingQueueStatus.MATCH_FOUND] },
        },
        data: { status: MatchmakingQueueStatus.EXPIRED },
      });
    },
    { maxWait: 15000, timeout: 30000 }
  );

  return expiredOffers.length;
}

/**
 * Ambil antrean spesifik beserta offer terkait
 */
export async function getMatchmakingEntry(
  id: string
): Promise<MatchmakingQueueDTO | null> {
  await expireMatchOffers();

  const queue = await prisma.matchmakingQueue.findUnique({
    where: { id },
    include: queueInclude,
  });

  if (!queue) return null;

  const offer = await prisma.matchmakingOffer.findFirst({
    where: {
      OR: [{ queueEntryAId: id }, { queueEntryBId: id }],
    },
    orderBy: { createdAt: "desc" },
    include: offerInclude,
  });

  return mapQueueDTO(queue, offer);
}

/**
 * List antrean matchmaking dengan filter opsional
 */
export async function listMatchmakingQueue(
  filter: ListMatchmakingQueueFilter = {}
): Promise<MatchmakingQueueDTO[]> {
  const validated = matchmakingQuerySchema.parse(filter);
  await expireMatchOffers();

  const where: Prisma.MatchmakingQueueWhereInput = {};

  if (validated.status && validated.status !== "ALL") {
    where.status = validated.status as MatchmakingQueueStatus;
  }
  if (validated.gameId) {
    where.gameId = validated.gameId;
  }
  if (validated.teamId) {
    where.teamId = validated.teamId;
  }

  const queues = await prisma.matchmakingQueue.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: queueInclude,
  });

  const queueIds = queues.map((q) => q.id);

  const offers = await prisma.matchmakingOffer.findMany({
    where: {
      OR: [
        { queueEntryAId: { in: queueIds } },
        { queueEntryBId: { in: queueIds } },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: offerInclude,
  });

  return queues.map((q) => {
    const matchedOffer = offers.find(
      (o) => o.queueEntryAId === q.id || o.queueEntryBId === q.id
    );
    return mapQueueDTO(q, matchedOffer);
  });
}

/**
 * Ambil status matchmaking terkini untuk suatu tim
 */
export async function getTeamMatchmakingState(
  teamId: string
): Promise<TeamMatchmakingStateDTO> {
  await expireMatchOffers();

  const { teamRating, memberCount } = await calculateTeamRating(teamId);

  // Ambil queue aktif atau terakhir
  const activeQueue = await prisma.matchmakingQueue.findFirst({
    where: {
      teamId,
      status: {
        in: [
          MatchmakingQueueStatus.QUEUED,
          MatchmakingQueueStatus.MATCH_FOUND,
          MatchmakingQueueStatus.ACCEPTING,
        ],
      },
    },
    orderBy: { createdAt: "desc" },
    include: queueInclude,
  });

  if (!activeQueue) {
    return {
      teamId,
      teamRating,
      memberCount,
      activeQueue: null,
      activeOffer: null,
    };
  }

  const offer = await prisma.matchmakingOffer.findFirst({
    where: {
      OR: [{ queueEntryAId: activeQueue.id }, { queueEntryBId: activeQueue.id }],
    },
    orderBy: { createdAt: "desc" },
    include: offerInclude,
  });

  return {
    teamId,
    teamRating,
    memberCount,
    activeQueue: mapQueueDTO(activeQueue, offer),
    activeOffer: offer ? mapOfferDTO(offer) : null,
  };
}
