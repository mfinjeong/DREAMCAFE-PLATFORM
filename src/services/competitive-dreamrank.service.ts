import { prisma } from "@/lib/prisma";
import {
  CompetitiveMatchStatus,
  CompetitiveMatchResult,
  CompetitiveRatingChangeType,
  DreamRank,
  Prisma,
} from "@prisma/client";
import {
  CompetitiveRatingApplicationItem,
  MatchRatingResultDTO,
  MemberCompetitiveStatsDTO,
} from "@/lib/types";
import { calculateDreamRank } from "@/services/dreamrank.service";

/**
 * Formula perubahan rating kompetitif deterministik:
 * WIN: +25
 * LOSS: -20
 * DRAW: +5
 * NO_CONTEST: 0
 */
export function calculateCompetitiveRatingChange(
  changeType: CompetitiveRatingChangeType
): number {
  switch (changeType) {
    case CompetitiveRatingChangeType.WIN:
      return 25;
    case CompetitiveRatingChangeType.LOSS:
      return -20;
    case CompetitiveRatingChangeType.DRAW:
      return 5;
    case CompetitiveRatingChangeType.NO_CONTEST:
      return 0;
  }
}

/**
 * Terapkan Perubahan DREAMRANK dari Pertandingan Resmi (VERIFIED).
 * Atomic & Idempotent: Menggunakan Prisma transaction dan unique constraint (matchId, memberId).
 */
export async function applyCompetitiveMatchRating(
  matchId: string
): Promise<MatchRatingResultDTO> {
  const match = await prisma.competitiveMatch.findUnique({
    where: { id: matchId },
    include: {
      teamA: true,
      teamB: true,
      participants: {
        include: {
          member: true,
          team: true,
        },
      },
    },
  });

  if (!match) {
    throw new Error("Pertandingan kompetitif tidak ditemukan");
  }

  if (match.status !== CompetitiveMatchStatus.VERIFIED) {
    throw new Error(
      `Rating hanya dapat diproses untuk pertandingan berstatus VERIFIED (Status saat ini: ${match.status})`
    );
  }

  if (!match.result) {
    throw new Error("Pertandingan tidak memiliki hasil resmi (result null)");
  }

  // Idempotency check di luar transaksi terlebih dahulu
  const existingOutside = await prisma.competitiveRatingApplication.findMany({
    where: { matchId },
    include: {
      member: true,
    },
  });

  if (existingOutside.length > 0) {
    return {
      matchId,
      alreadyApplied: true,
      applications: mapApplicationItems(existingOutside, match.participants),
    };
  }

  // Validasi peserta
  if (!match.participants || match.participants.length === 0) {
    throw new Error("Pertandingan tidak memiliki peserta terdaftar untuk dihitung ratingnya");
  }

  // Validasi kepemilikan tim peserta (harus di Team A atau Team B)
  const participantMemberIds = new Set<string>();
  for (const p of match.participants) {
    if (p.teamId !== match.teamAId && p.teamId !== match.teamBId) {
      throw new Error(`Peserta ${p.member.fullName} tidak terdaftar di Tim A maupun Tim B`);
    }
    if (participantMemberIds.has(p.memberId)) {
      throw new Error(`Peserta ${p.member.fullName} terdaftar ganda dalam pertandingan`);
    }
    participantMemberIds.add(p.memberId);
  }

  // Validasi hasil vs pemenang
  if (match.result === CompetitiveMatchResult.TEAM_A_WIN && match.winnerTeamId !== match.teamAId) {
    throw new Error("Hasil TEAM_A_WIN tidak selaras dengan winnerTeamId");
  }
  if (match.result === CompetitiveMatchResult.TEAM_B_WIN && match.winnerTeamId !== match.teamBId) {
    throw new Error("Hasil TEAM_B_WIN tidak selaras dengan winnerTeamId");
  }
  if (
    (match.result === CompetitiveMatchResult.DRAW || match.result === CompetitiveMatchResult.NO_CONTEST) &&
    match.winnerTeamId !== null
  ) {
    throw new Error("Hasil DRAW atau NO_CONTEST tidak boleh memiliki winnerTeamId");
  }

  // Eksekusi atomik dalam 1 Prisma Interactive Transaction
  return await prisma.$transaction(
    async (tx) => {
      // Concurrency lock check di dalam transaksi
      const existingInTx = await tx.competitiveRatingApplication.findMany({
        where: { matchId },
        include: { member: true },
      });

      if (existingInTx.length > 0) {
        return {
          matchId,
          alreadyApplied: true,
          applications: mapApplicationItems(existingInTx, match.participants),
        };
      }

      const createdApps: Array<
        Prisma.CompetitiveRatingApplicationGetPayload<{
          include: { member: true };
        }>
      > = [];

      for (const participant of match.participants) {
        let changeType: CompetitiveRatingChangeType;
        if (match.result === CompetitiveMatchResult.TEAM_A_WIN) {
          changeType =
            participant.teamId === match.teamAId
              ? CompetitiveRatingChangeType.WIN
              : CompetitiveRatingChangeType.LOSS;
        } else if (match.result === CompetitiveMatchResult.TEAM_B_WIN) {
          changeType =
            participant.teamId === match.teamBId
              ? CompetitiveRatingChangeType.WIN
              : CompetitiveRatingChangeType.LOSS;
        } else if (match.result === CompetitiveMatchResult.DRAW) {
          changeType = CompetitiveRatingChangeType.DRAW;
        } else {
          changeType = CompetitiveRatingChangeType.NO_CONTEST;
        }

        const delta = calculateCompetitiveRatingChange(changeType);

        // Fetch fresh member state
        const currentMember = await tx.member.findUnique({
          where: { id: participant.memberId },
        });

        if (!currentMember) {
          throw new Error(`Data member peserta dengan ID ${participant.memberId} tidak ditemukan`);
        }

        const previousRating = currentMember.dreamRating;
        const previousRank = currentMember.dreamRank;

        // Rating tidak boleh minus
        const newRating = Math.max(0, previousRating + delta);
        const newRank = calculateDreamRank(newRating);

        // Update Member
        await tx.member.update({
          where: { id: currentMember.id },
          data: {
            dreamRating: newRating,
            dreamRank: newRank,
          },
        });

        // Audit di DreamRankHistory jika ada perubahan
        if (delta !== 0) {
          await tx.dreamRankHistory.create({
            data: {
              memberId: currentMember.id,
              previousRating,
              newRating,
              previousRank,
              newRank,
              change: delta,
              reason: `COMPETITIVE_MATCH:${match.id}`,
            },
          });
        }

        // Catat di CompetitiveRatingApplication (idempotent record)
        const appRecord = await tx.competitiveRatingApplication.create({
          data: {
            matchId: match.id,
            memberId: currentMember.id,
            previousRating,
            newRating,
            ratingChange: delta,
            changeType,
            previousRank,
            newRank,
          },
          include: {
            member: true,
          },
        });

        createdApps.push(appRecord);
      }

      return {
        matchId,
        alreadyApplied: false,
        applications: mapApplicationItems(createdApps, match.participants),
      };
    },
    { maxWait: 15000, timeout: 30000 }
  );
}

/**
 * Ambil Riwayat Perubahan Rating dari Suatu Match Tertentu
 */
export async function getMatchRatingChanges(
  matchId: string
): Promise<CompetitiveRatingApplicationItem[]> {
  const match = await prisma.competitiveMatch.findUnique({
    where: { id: matchId },
    include: {
      participants: {
        include: { member: true, team: true },
      },
      ratingApplications: {
        include: { member: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!match) return [];
  return mapApplicationItems(match.ratingApplications, match.participants);
}

/**
 * Ambil Statistik & Rekap Rating Kompetitif Seorang Member
 */
export async function getMemberCompetitiveRating(
  memberId: string
): Promise<MemberCompetitiveStatsDTO> {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
  });

  if (!member) {
    throw new Error("Member tidak ditemukan");
  }

  const applications = await prisma.competitiveRatingApplication.findMany({
    where: { memberId },
    include: {
      member: true,
      match: {
        include: {
          participants: {
            include: { team: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  let wins = 0;
  let losses = 0;
  let draws = 0;

  for (const app of applications) {
    if (app.changeType === CompetitiveRatingChangeType.WIN) wins++;
    else if (app.changeType === CompetitiveRatingChangeType.LOSS) losses++;
    else if (app.changeType === CompetitiveRatingChangeType.DRAW) draws++;
  }

  const recentRatingChanges: CompetitiveRatingApplicationItem[] = applications.map((app) => {
    const p = app.match.participants.find((pt) => pt.memberId === memberId);
    return {
      id: app.id,
      matchId: app.matchId,
      memberId: app.memberId,
      memberName: app.member.fullName,
      memberUsername: app.member.username,
      memberCode: app.member.memberCode,
      teamId: p?.teamId,
      teamTag: p?.team?.tag,
      teamName: p?.team?.name,
      previousRating: app.previousRating,
      newRating: app.newRating,
      ratingChange: app.ratingChange,
      changeType: app.changeType,
      previousRank: app.previousRank,
      newRank: app.newRank,
      createdAt: app.createdAt.toISOString(),
    };
  });

  return {
    memberId: member.id,
    fullName: member.fullName,
    username: member.username,
    memberCode: member.memberCode,
    currentRating: member.dreamRating,
    currentRank: member.dreamRank,
    totalMatches: applications.length,
    wins,
    losses,
    draws,
    recentRatingChanges,
  };
}

/**
 * Helper untuk memetakan aplikasi rating ke DTO
 */
function mapApplicationItems(
  apps: Array<
    Prisma.CompetitiveRatingApplicationGetPayload<{
      include: { member: true };
    }>
  >,
  participants: Array<
    Prisma.CompetitiveMatchParticipantGetPayload<{
      include: { team: true };
    }>
  >
): CompetitiveRatingApplicationItem[] {
  const participantMap = new Map(participants.map((p) => [p.memberId, p]));

  return apps.map((app) => {
    const p = participantMap.get(app.memberId);
    return {
      id: app.id,
      matchId: app.matchId,
      memberId: app.memberId,
      memberName: app.member.fullName,
      memberUsername: app.member.username,
      memberCode: app.member.memberCode,
      teamId: p?.teamId,
      teamTag: p?.team?.tag,
      teamName: p?.team?.name,
      previousRating: app.previousRating,
      newRating: app.newRating,
      ratingChange: app.ratingChange,
      changeType: app.changeType,
      previousRank: app.previousRank,
      newRank: app.newRank,
      createdAt: app.createdAt.toISOString(),
    };
  });
}
