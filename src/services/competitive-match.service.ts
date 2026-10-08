import { prisma } from "@/lib/prisma";
import {
  CompetitiveMatchStatus,
  CompetitiveMatchResult,
  Prisma,
} from "@prisma/client";
import {
  CompetitiveMatchItem,
  CompetitiveMatchDetailDTO,
  CompetitiveMatchParticipantDTO,
  CompetitiveMatchSubmissionDTO,
  ScrimTeamSummary,
} from "@/lib/types";
import {
  createCompetitiveMatchSchema,
  submitMatchResultSchema,
  verifyMatchSchema,
  disputeMatchSchema,
  registerParticipantsSchema,
} from "@/lib/validators";

export interface CreateCompetitiveMatchInput {
  teamAId: string;
  teamBId: string;
  gameId: string;
  scheduledAt: string | Date;
  bestOf?: number;
  sourceScrimId?: string | null;
  note?: string | null;
  actorMemberId: string;
  teamAParticipantMemberIds?: string[];
  teamBParticipantMemberIds?: string[];
}

export interface ListCompetitiveMatchesFilter {
  status?: string;
  gameId?: string;
  teamId?: string;
  q?: string;
}

const matchInclude = {
  teamA: {
    include: {
      owner: { select: { id: true, fullName: true, username: true } },
      _count: { select: { members: true } },
    },
  },
  teamB: {
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
  participants: {
    include: {
      team: { select: { id: true, name: true, tag: true } },
      member: {
        select: {
          id: true,
          memberCode: true,
          fullName: true,
          username: true,
          dreamRating: true,
          dreamRank: true,
        },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
  submissions: {
    include: {
      submittedByTeam: { select: { id: true, name: true, tag: true } },
      submittedBy: { select: { id: true, fullName: true, username: true } },
    },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

type MatchWithRelations = Prisma.CompetitiveMatchGetPayload<{
  include: typeof matchInclude;
}>;

function formatTeamSummary(team: MatchWithRelations["teamA"]): ScrimTeamSummary {
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

function mapParticipantDTO(p: MatchWithRelations["participants"][number]): CompetitiveMatchParticipantDTO {
  return {
    id: p.id,
    matchId: p.matchId,
    teamId: p.teamId,
    teamTag: p.team.tag,
    teamName: p.team.name,
    memberId: p.memberId,
    memberName: p.member.fullName,
    memberUsername: p.member.username,
    memberCode: p.member.memberCode,
    dreamRating: p.member.dreamRating,
    dreamRank: p.member.dreamRank,
    createdAt: p.createdAt.toISOString(),
  };
}

function mapSubmissionDTO(s: MatchWithRelations["submissions"][number]): CompetitiveMatchSubmissionDTO {
  return {
    id: s.id,
    matchId: s.matchId,
    submittedByTeamId: s.submittedByTeamId,
    submittedByTeamTag: s.submittedByTeam.tag,
    submittedByTeamName: s.submittedByTeam.name,
    submittedById: s.submittedById,
    submittedByName: s.submittedBy.fullName,
    result: s.result,
    note: s.note,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

function mapMatchItem(match: MatchWithRelations): CompetitiveMatchItem {
  return {
    id: match.id,
    teamAId: match.teamAId,
    teamA: formatTeamSummary(match.teamA),
    teamBId: match.teamBId,
    teamB: formatTeamSummary(match.teamB),
    gameId: match.gameId,
    game: {
      id: match.game.id,
      title: match.game.title,
      genre: match.game.genre,
      iconUrl: match.game.iconUrl,
    },
    scheduledAt: match.scheduledAt.toISOString(),
    bestOf: match.bestOf,
    status: match.status,
    result: match.result,
    winnerTeamId: match.winnerTeamId,
    winnerTeam: match.winnerTeam ? formatTeamSummary(match.winnerTeam) : null,
    sourceScrimId: match.sourceScrimId,
    note: match.note,
    createdById: match.createdById,
    createdBy: {
      id: match.createdBy.id,
      fullName: match.createdBy.fullName,
      username: match.createdBy.username,
    },
    participantsCount: match.participants.length,
    submissionsCount: match.submissions.length,
    isDisputed: match.status === CompetitiveMatchStatus.DISPUTED,
    createdAt: match.createdAt.toISOString(),
    updatedAt: match.updatedAt.toISOString(),
    startedAt: match.startedAt ? match.startedAt.toISOString() : null,
    completedAt: match.completedAt ? match.completedAt.toISOString() : null,
  };
}

function mapMatchDetail(match: MatchWithRelations): CompetitiveMatchDetailDTO {
  const item = mapMatchItem(match);
  return {
    ...item,
    participants: match.participants.map(mapParticipantDTO),
    submissions: match.submissions.map(mapSubmissionDTO),
  };
}

/**
 * Buat Jadwal / Rekor Competitive Match Resmi
 */
export async function createCompetitiveMatch(
  input: CreateCompetitiveMatchInput
): Promise<CompetitiveMatchDetailDTO> {
  const validated = createCompetitiveMatchSchema.parse(input);

  if (validated.teamAId === validated.teamBId) {
    throw new Error("Tim A dan Tim B tidak boleh sama dalam pertandingan kompetitif");
  }

  const [teamA, teamB, game, actor] = await Promise.all([
    prisma.team.findUnique({
      where: { id: validated.teamAId },
      include: { members: true },
    }),
    prisma.team.findUnique({
      where: { id: validated.teamBId },
      include: { members: true },
    }),
    prisma.game.findUnique({ where: { id: validated.gameId } }),
    prisma.member.findUnique({ where: { id: validated.actorMemberId } }),
  ]);

  if (!teamA) throw new Error("Tim A tidak ditemukan");
  if (!teamB) throw new Error("Tim B tidak ditemukan");
  if (!game) throw new Error("Game kompetitif tidak ditemukan");
  if (!game.isActive) throw new Error("Game yang dipilih sedang tidak aktif");
  if (!actor) throw new Error("Member pembuat tidak ditemukan");

  // Hanya owner Tim A yang dapat membuat match resmi
  if (teamA.ownerId !== validated.actorMemberId) {
    throw new Error("Hanya owner Tim A yang memiliki izin membuat pertandingan kompetitif");
  }

  const scheduledDate = new Date(validated.scheduledAt);
  if (isNaN(scheduledDate.getTime())) {
    throw new Error("Jadwal pertandingan tidak valid");
  }

  // Cek jika sourceScrimId disediakan
  if (validated.sourceScrimId) {
    const scrim = await prisma.scrim.findUnique({
      where: { id: validated.sourceScrimId },
    });
    if (!scrim) {
      throw new Error("Source Scrim yang direferensikan tidak ditemukan");
    }
  }

  // Cek duplikasi match aktif/pending antar kedua tim
  const existingActiveMatch = await prisma.competitiveMatch.findFirst({
    where: {
      OR: [
        { teamAId: teamA.id, teamBId: teamB.id },
        { teamAId: teamB.id, teamBId: teamA.id },
      ],
      status: {
        in: [
          CompetitiveMatchStatus.PENDING,
          CompetitiveMatchStatus.SCHEDULED,
          CompetitiveMatchStatus.LIVE,
          CompetitiveMatchStatus.RESULT_PENDING,
          CompetitiveMatchStatus.DISPUTED,
        ],
      },
    },
  });

  if (existingActiveMatch) {
    throw new Error(
      `Sudah ada pertandingan kompetitif aktif atau belum selesai antara Tim ${teamA.name} dan Tim ${teamB.name}`
    );
  }

  // Validasi anggota peserta jika disertakan
  if (validated.teamAParticipantMemberIds && validated.teamAParticipantMemberIds.length > 0) {
    const teamAMemberSet = new Set(teamA.members.map((m) => m.memberId));
    for (const mId of validated.teamAParticipantMemberIds) {
      if (!teamAMemberSet.has(mId)) {
        throw new Error(`Member dengan ID ${mId} bukan anggota dari Tim ${teamA.name}`);
      }
    }
  }

  if (validated.teamBParticipantMemberIds && validated.teamBParticipantMemberIds.length > 0) {
    const teamBMemberSet = new Set(teamB.members.map((m) => m.memberId));
    for (const mId of validated.teamBParticipantMemberIds) {
      if (!teamBMemberSet.has(mId)) {
        throw new Error(`Member dengan ID ${mId} bukan anggota dari Tim ${teamB.name}`);
      }
    }
  }

  const created = await prisma.$transaction(
    async (tx) => {
      const match = await tx.competitiveMatch.create({
        data: {
          teamAId: validated.teamAId,
          teamBId: validated.teamBId,
          gameId: validated.gameId,
          scheduledAt: scheduledDate,
          bestOf: validated.bestOf,
          status: CompetitiveMatchStatus.PENDING,
          sourceScrimId: validated.sourceScrimId || null,
          note: validated.note || null,
          createdById: validated.actorMemberId,
        },
      });

      // Insert peserta Team A
      if (validated.teamAParticipantMemberIds && validated.teamAParticipantMemberIds.length > 0) {
        await tx.competitiveMatchParticipant.createMany({
          data: validated.teamAParticipantMemberIds.map((mId) => ({
            matchId: match.id,
            teamId: teamA.id,
            memberId: mId,
          })),
        });
      }

      // Insert peserta Team B
      if (validated.teamBParticipantMemberIds && validated.teamBParticipantMemberIds.length > 0) {
        await tx.competitiveMatchParticipant.createMany({
          data: validated.teamBParticipantMemberIds.map((mId) => ({
            matchId: match.id,
            teamId: teamB.id,
            memberId: mId,
          })),
        });
      }

      return match;
    },
    { maxWait: 15000, timeout: 30000 }
  );

  return (await getCompetitiveMatchById(created.id))!;
}

/**
 * Jadwalkan / Konfirmasi Match (Oleh Tim Lawan B)
 */
export async function scheduleCompetitiveMatch(
  matchId: string,
  actorMemberId: string
): Promise<CompetitiveMatchDetailDTO> {
  const match = await prisma.competitiveMatch.findUnique({
    where: { id: matchId },
    include: { teamA: true, teamB: true },
  });

  if (!match) throw new Error("Pertandingan kompetitif tidak ditemukan");

  if (match.status !== CompetitiveMatchStatus.PENDING) {
    throw new Error(
      `Pertandingan tidak dapat dijadwalkan ulang dari status '${match.status}'`
    );
  }

  if (match.teamB.ownerId !== actorMemberId && match.teamA.ownerId !== actorMemberId) {
    throw new Error("Hanya owner Tim A atau Tim B yang dapat mengonfirmasi jadwal pertandingan");
  }

  await prisma.competitiveMatch.update({
    where: { id: matchId },
    data: { status: CompetitiveMatchStatus.SCHEDULED },
  });

  return (await getCompetitiveMatchById(matchId))!;
}

/**
 * Daftarkan Anggota Roster Peserta Pertandingan
 */
export async function registerMatchParticipants(
  matchId: string,
  input: {
    actorMemberId: string;
    teamId: string;
    memberIds: string[];
  }
): Promise<CompetitiveMatchDetailDTO> {
  const validated = registerParticipantsSchema.parse(input);

  const match = await prisma.competitiveMatch.findUnique({
    where: { id: matchId },
    include: { teamA: true, teamB: true },
  });

  if (!match) throw new Error("Pertandingan kompetitif tidak ditemukan");

  if (
    match.status !== CompetitiveMatchStatus.PENDING &&
    match.status !== CompetitiveMatchStatus.SCHEDULED
  ) {
    throw new Error(
      `Roster peserta hanya dapat diubah pada status PENDING atau SCHEDULED (Status saat ini: ${match.status})`
    );
  }

  if (validated.teamId !== match.teamAId && validated.teamId !== match.teamBId) {
    throw new Error("Tim yang dipilih tidak terdaftar dalam pertandingan ini");
  }

  const team = validated.teamId === match.teamAId ? match.teamA : match.teamB;
  if (team.ownerId !== validated.actorMemberId) {
    throw new Error(`Hanya owner Tim ${team.name} yang dapat mendaftarkan roster tim`);
  }

  const teamMembers = await prisma.teamMember.findMany({
    where: { teamId: validated.teamId },
  });
  const validMemberSet = new Set(teamMembers.map((m) => m.memberId));

  for (const mId of validated.memberIds) {
    if (!validMemberSet.has(mId)) {
      throw new Error(`Member dengan ID ${mId} bukan anggota dari Tim ${team.name}`);
    }
  }

  await prisma.$transaction(
    async (tx) => {
      // Hapus partisipasi tim ini sebelumnya
      await tx.competitiveMatchParticipant.deleteMany({
        where: {
          matchId,
          teamId: validated.teamId,
        },
      });

      // Buat partisipasi baru
      await tx.competitiveMatchParticipant.createMany({
        data: validated.memberIds.map((mId) => ({
          matchId,
          teamId: validated.teamId,
          memberId: mId,
        })),
      });
    },
    { maxWait: 15000, timeout: 30000 }
  );

  return (await getCompetitiveMatchById(matchId))!;
}

/**
 * Mulai Pertandingan (LIVE)
 */
export async function startCompetitiveMatch(
  matchId: string,
  actorMemberId: string
): Promise<CompetitiveMatchDetailDTO> {
  const match = await prisma.competitiveMatch.findUnique({
    where: { id: matchId },
    include: { teamA: true, teamB: true },
  });

  if (!match) throw new Error("Pertandingan kompetitif tidak ditemukan");

  if (
    match.status !== CompetitiveMatchStatus.PENDING &&
    match.status !== CompetitiveMatchStatus.SCHEDULED
  ) {
    throw new Error(
      `Pertandingan tidak dapat dimulai dari status '${match.status}'. Hanya status PENDING atau SCHEDULED yang dapat dimulai.`
    );
  }

  if (match.teamA.ownerId !== actorMemberId && match.teamB.ownerId !== actorMemberId) {
    throw new Error("Hanya owner Tim A atau Tim B yang memiliki wewenang untuk memulai pertandingan");
  }

  // Cek apakah ada pertandingan LIVE lain yang melibatkan tim ini
  const liveConflict = await prisma.competitiveMatch.findFirst({
    where: {
      id: { not: matchId },
      OR: [
        { teamAId: { in: [match.teamAId, match.teamBId] } },
        { teamBId: { in: [match.teamAId, match.teamBId] } },
      ],
      status: CompetitiveMatchStatus.LIVE,
    },
  });

  if (liveConflict) {
    throw new Error("Salah satu tim sedang berada dalam pertandingan LIVE lainnya");
  }

  await prisma.competitiveMatch.update({
    where: { id: matchId },
    data: {
      status: CompetitiveMatchStatus.LIVE,
      startedAt: new Date(),
    },
  });

  return (await getCompetitiveMatchById(matchId))!;
}

/**
 * Submit Hasil Pertandingan oleh Salah Satu Tim
 */
export async function submitMatchResult(
  matchId: string,
  input: {
    actorMemberId: string;
    result: string;
    note?: string | null;
  }
): Promise<CompetitiveMatchDetailDTO> {
  const validated = submitMatchResultSchema.parse(input);

  const match = await prisma.competitiveMatch.findUnique({
    where: { id: matchId },
    include: { teamA: true, teamB: true, submissions: true },
  });

  if (!match) throw new Error("Pertandingan kompetitif tidak ditemukan");

  if (
    match.status !== CompetitiveMatchStatus.LIVE &&
    match.status !== CompetitiveMatchStatus.RESULT_PENDING &&
    match.status !== CompetitiveMatchStatus.DISPUTED
  ) {
    throw new Error(
      `Hasil pertandingan hanya dapat disubmit pada status LIVE, RESULT_PENDING, atau DISPUTED (Status saat ini: ${match.status})`
    );
  }

  let submittingTeamId: string | null = null;
  if (match.teamA.ownerId === validated.actorMemberId) {
    submittingTeamId = match.teamAId;
  } else if (match.teamB.ownerId === validated.actorMemberId) {
    submittingTeamId = match.teamBId;
  } else {
    throw new Error("Hanya owner Tim A atau Tim B yang dapat mensubmit hasil pertandingan");
  }

  const resultEnum = validated.result as CompetitiveMatchResult;

  await prisma.$transaction(
    async (tx) => {
      // Upsert submission tim
      await tx.competitiveMatchResultSubmission.upsert({
        where: {
          matchId_submittedByTeamId: {
            matchId,
            submittedByTeamId: submittingTeamId!,
          },
        },
        create: {
          matchId,
          submittedByTeamId: submittingTeamId!,
          submittedById: validated.actorMemberId,
          result: resultEnum,
          note: validated.note || null,
        },
        update: {
          submittedById: validated.actorMemberId,
          result: resultEnum,
          note: validated.note || null,
          updatedAt: new Date(),
        },
      });

      // Ambil seluruh submission terbaru
      const allSubmissions = await tx.competitiveMatchResultSubmission.findMany({
        where: { matchId },
      });

      if (allSubmissions.length === 1) {
        // Baru 1 tim yang submit -> RESULT_PENDING
        await tx.competitiveMatch.update({
          where: { id: matchId },
          data: { status: CompetitiveMatchStatus.RESULT_PENDING },
        });
      } else if (allSubmissions.length >= 2) {
        const subA = allSubmissions.find((s) => s.submittedByTeamId === match.teamAId);
        const subB = allSubmissions.find((s) => s.submittedByTeamId === match.teamBId);

        if (subA && subB && subA.result === subB.result) {
          // KEDUA TIM SEPAKAT HASIL SAMA -> AUTO VERIFIED!
          let winnerId: string | null = null;
          if (subA.result === CompetitiveMatchResult.TEAM_A_WIN) {
            winnerId = match.teamAId;
          } else if (subA.result === CompetitiveMatchResult.TEAM_B_WIN) {
            winnerId = match.teamBId;
          }

          await tx.competitiveMatch.update({
            where: { id: matchId },
            data: {
              status: CompetitiveMatchStatus.VERIFIED,
              result: subA.result,
              winnerTeamId: winnerId,
              completedAt: new Date(),
            },
          });
        } else {
          // HASIL BERBEDA -> STATUS DISPUTED!
          await tx.competitiveMatch.update({
            where: { id: matchId },
            data: {
              status: CompetitiveMatchStatus.DISPUTED,
              result: null,
              winnerTeamId: null,
            },
          });
        }
      }
    },
    { maxWait: 15000, timeout: 30000 }
  );

  return (await getCompetitiveMatchById(matchId))!;
}

/**
 * Verifikasi Langsung Hasil Pertandingan
 */
export async function verifyMatchDirectly(
  matchId: string,
  input: {
    actorMemberId: string;
    result?: string;
    note?: string | null;
  }
): Promise<CompetitiveMatchDetailDTO> {
  const validated = verifyMatchSchema.parse(input);

  const match = await prisma.competitiveMatch.findUnique({
    where: { id: matchId },
    include: { teamA: true, teamB: true, submissions: true },
  });

  if (!match) throw new Error("Pertandingan kompetitif tidak ditemukan");

  if (
    match.status !== CompetitiveMatchStatus.LIVE &&
    match.status !== CompetitiveMatchStatus.RESULT_PENDING &&
    match.status !== CompetitiveMatchStatus.DISPUTED
  ) {
    throw new Error(
      `Pertandingan tidak dapat diverifikasi pada status '${match.status}'`
    );
  }

  if (match.teamA.ownerId !== validated.actorMemberId && match.teamB.ownerId !== validated.actorMemberId) {
    throw new Error("Hanya owner tim yang berpartisipasi yang dapat memverifikasi pertandingan");
  }

  let finalResult: CompetitiveMatchResult;
  if (validated.result) {
    finalResult = validated.result as CompetitiveMatchResult;
  } else if (match.submissions.length > 0) {
    finalResult = match.submissions[0].result;
  } else {
    throw new Error("Hasil pertandingan harus disertakan untuk verifikasi");
  }

  let winnerId: string | null = null;
  if (finalResult === CompetitiveMatchResult.TEAM_A_WIN) {
    winnerId = match.teamAId;
  } else if (finalResult === CompetitiveMatchResult.TEAM_B_WIN) {
    winnerId = match.teamBId;
  }

  await prisma.competitiveMatch.update({
    where: { id: matchId },
    data: {
      status: CompetitiveMatchStatus.VERIFIED,
      result: finalResult,
      winnerTeamId: winnerId,
      completedAt: new Date(),
      note: validated.note !== undefined ? validated.note : match.note,
    },
  });

  return (await getCompetitiveMatchById(matchId))!;
}

/**
 * Tandai Match Sebagai Dispute
 */
export async function disputeMatch(
  matchId: string,
  input: {
    actorMemberId: string;
    reason: string;
  }
): Promise<CompetitiveMatchDetailDTO> {
  const validated = disputeMatchSchema.parse(input);

  const match = await prisma.competitiveMatch.findUnique({
    where: { id: matchId },
    include: { teamA: true, teamB: true },
  });

  if (!match) throw new Error("Pertandingan kompetitif tidak ditemukan");

  if (
    match.status !== CompetitiveMatchStatus.LIVE &&
    match.status !== CompetitiveMatchStatus.RESULT_PENDING
  ) {
    throw new Error(
      `Dispute hanya dapat diajukan saat LIVE atau RESULT_PENDING (Status saat ini: ${match.status})`
    );
  }

  if (match.teamA.ownerId !== validated.actorMemberId && match.teamB.ownerId !== validated.actorMemberId) {
    throw new Error("Hanya owner tim yang bertanding yang dapat mengajukan dispute");
  }

  await prisma.competitiveMatch.update({
    where: { id: matchId },
    data: {
      status: CompetitiveMatchStatus.DISPUTED,
      note: validated.reason,
    },
  });

  return (await getCompetitiveMatchById(matchId))!;
}

/**
 * Batalkan Pertandingan (CANCELLED)
 */
export async function cancelCompetitiveMatch(
  matchId: string,
  actorMemberId: string
): Promise<CompetitiveMatchDetailDTO> {
  const match = await prisma.competitiveMatch.findUnique({
    where: { id: matchId },
    include: { teamA: true, teamB: true },
  });

  if (!match) throw new Error("Pertandingan kompetitif tidak ditemukan");

  if (match.status === CompetitiveMatchStatus.VERIFIED) {
    throw new Error("Pertandingan yang sudah diverifikasi tidak dapat dibatalkan");
  }

  if (match.status === CompetitiveMatchStatus.CANCELLED) {
    throw new Error("Pertandingan sudah berstatus batal");
  }

  if (match.teamA.ownerId !== actorMemberId && match.teamB.ownerId !== actorMemberId) {
    throw new Error("Hanya owner Tim A atau Tim B yang dapat membatalkan pertandingan");
  }

  await prisma.competitiveMatch.update({
    where: { id: matchId },
    data: { status: CompetitiveMatchStatus.CANCELLED },
  });

  return (await getCompetitiveMatchById(matchId))!;
}

/**
 * Ambil Detail Pertandingan Berdasarkan ID
 */
export async function getCompetitiveMatchById(
  id: string
): Promise<CompetitiveMatchDetailDTO | null> {
  const match = await prisma.competitiveMatch.findUnique({
    where: { id },
    include: matchInclude,
  });

  if (!match) return null;
  return mapMatchDetail(match);
}

/**
 * Daftar Seluruh Pertandingan Kompetitif dengan Filter
 */
export async function listCompetitiveMatches(
  filter: ListCompetitiveMatchesFilter = {}
): Promise<CompetitiveMatchItem[]> {
  const where: Prisma.CompetitiveMatchWhereInput = {};

  if (filter.status && filter.status !== "ALL") {
    where.status = filter.status as CompetitiveMatchStatus;
  }

  if (filter.gameId) {
    where.gameId = filter.gameId;
  }

  if (filter.teamId) {
    where.OR = [
      { teamAId: filter.teamId },
      { teamBId: filter.teamId },
    ];
  }

  if (filter.q) {
    const term = filter.q.trim();
    where.OR = [
      { teamA: { name: { contains: term, mode: "insensitive" } } },
      { teamA: { tag: { contains: term, mode: "insensitive" } } },
      { teamB: { name: { contains: term, mode: "insensitive" } } },
      { teamB: { tag: { contains: term, mode: "insensitive" } } },
      { game: { title: { contains: term, mode: "insensitive" } } },
    ];
  }

  const matches = await prisma.competitiveMatch.findMany({
    where,
    include: matchInclude,
    orderBy: { scheduledAt: "desc" },
  });

  return matches.map(mapMatchItem);
}

/**
 * Ambil Riwayat Pertandingan Spesifik Suatu Tim
 */
export async function getTeamCompetitiveMatches(
  teamId: string,
  limit = 20
): Promise<CompetitiveMatchItem[]> {
  const matches = await prisma.competitiveMatch.findMany({
    where: {
      OR: [
        { teamAId: teamId },
        { teamBId: teamId },
      ],
    },
    include: matchInclude,
    orderBy: { scheduledAt: "desc" },
    take: limit,
  });

  return matches.map(mapMatchItem);
}
