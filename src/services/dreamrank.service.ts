import { prisma } from "@/lib/prisma";
import { DreamRank } from "@prisma/client";
import { DreamRankProgressDTO, DreamRankHistoryItem, DreamRankProfileDTO } from "@/lib/types";

export interface RankTierDefinition {
  rank: DreamRank;
  name: string;
  minRating: number;
  maxRating: number | null;
  displayOrder: number;
}

/**
 * DREAMRANK Tier Progression Matrix
 * BRONZE:      0 – 999
 * SILVER:   1000 – 1499
 * GOLD:     1500 – 1999
 * PLATINUM: 2000 – 2499
 * DIAMOND:  2500 – 2999
 * MASTER:   3000 – 3499
 * GRANDMASTER: 3500+
 */
export const DREAM_RANK_TIERS: readonly RankTierDefinition[] = [
  { rank: DreamRank.BRONZE, name: "BRONZE", minRating: 0, maxRating: 999, displayOrder: 1 },
  { rank: DreamRank.SILVER, name: "SILVER", minRating: 1000, maxRating: 1499, displayOrder: 2 },
  { rank: DreamRank.GOLD, name: "GOLD", minRating: 1500, maxRating: 1999, displayOrder: 3 },
  { rank: DreamRank.PLATINUM, name: "PLATINUM", minRating: 2000, maxRating: 2499, displayOrder: 4 },
  { rank: DreamRank.DIAMOND, name: "DIAMOND", minRating: 2500, maxRating: 2999, displayOrder: 5 },
  { rank: DreamRank.MASTER, name: "MASTER", minRating: 3000, maxRating: 3499, displayOrder: 6 },
  { rank: DreamRank.GRANDMASTER, name: "GRANDMASTER", minRating: 3500, maxRating: null, displayOrder: 7 },
] as const;

/**
 * Server-authoritative calculation of DREAMRANK tier based on rating.
 * Rating cannot be negative; any rating < 1000 maps to BRONZE.
 */
export function calculateDreamRank(rating: number): DreamRank {
  const safeRating = Math.max(0, Math.floor(rating || 0));
  if (safeRating >= 3500) return DreamRank.GRANDMASTER;
  if (safeRating >= 3000) return DreamRank.MASTER;
  if (safeRating >= 2500) return DreamRank.DIAMOND;
  if (safeRating >= 2000) return DreamRank.PLATINUM;
  if (safeRating >= 1500) return DreamRank.GOLD;
  if (safeRating >= 1000) return DreamRank.SILVER;
  return DreamRank.BRONZE;
}

/**
 * Calculates rank progression details:
 * Current tier range, distance to next tier, and percentage completed within tier.
 */
export function getRankProgress(rating: number): DreamRankProgressDTO {
  const safeRating = Math.max(0, Math.floor(rating || 0));
  const currentRank = calculateDreamRank(safeRating);
  const tierIndex = DREAM_RANK_TIERS.findIndex((t) => t.rank === currentRank);
  const currentTier = DREAM_RANK_TIERS[tierIndex] || DREAM_RANK_TIERS[0];
  const nextTier = tierIndex < DREAM_RANK_TIERS.length - 1 ? DREAM_RANK_TIERS[tierIndex + 1] : null;

  if (!nextTier) {
    // Grandmaster (top tier, pinnacle rank)
    return {
      currentRank: DreamRank.GRANDMASTER,
      currentRating: safeRating,
      minRating: currentTier.minRating,
      maxRating: null,
      nextRank: null,
      nextRankMinRating: null,
      ratingInTier: safeRating - currentTier.minRating,
      tierSpan: null,
      progressPercent: 100,
      ratingNeeded: 0,
    };
  }

  const tierSpan = nextTier.minRating - currentTier.minRating;
  const ratingInTier = safeRating - currentTier.minRating;
  const progressPercent = Math.min(100, Math.max(0, Math.floor((ratingInTier / tierSpan) * 100)));
  const ratingNeeded = Math.max(0, nextTier.minRating - safeRating);

  return {
    currentRank,
    currentRating: safeRating,
    minRating: currentTier.minRating,
    maxRating: currentTier.maxRating,
    nextRank: nextTier.rank,
    nextRankMinRating: nextTier.minRating,
    ratingInTier,
    tierSpan,
    progressPercent,
    ratingNeeded,
  };
}

/**
 * Fetches audit ledger of rating changes for a specific member.
 */
export async function getDreamRankHistory(
  memberId: string,
  limit = 50
): Promise<DreamRankHistoryItem[]> {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { id: true },
  });

  if (!member) {
    throw new Error("Member tidak ditemukan");
  }

  const history = await prisma.dreamRankHistory.findMany({
    where: { memberId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return history.map((h) => ({
    id: h.id,
    memberId: h.memberId,
    previousRating: h.previousRating,
    newRating: h.newRating,
    previousRank: h.previousRank,
    newRank: h.newRank,
    change: h.change,
    reason: h.reason,
    createdAt: h.createdAt.toISOString(),
  }));
}

/**
 * Returns comprehensive DREAMRANK profile including current rank, rating,
 * progress metrics to next rank, and recent audit history.
 */
export async function getDreamRankProfile(memberId: string): Promise<DreamRankProfileDTO> {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
  });

  if (!member) {
    throw new Error("Member tidak ditemukan");
  }

  const progress = getRankProgress(member.dreamRating);
  const history = await getDreamRankHistory(memberId, 20);

  return {
    memberId: member.id,
    rank: member.dreamRank,
    rating: member.dreamRating,
    progress,
    history,
  };
}

/**
 * Server-authoritative atomic rating mutation.
 * Guarantees:
 * 1. Member existence validation.
 * 2. Non-negative rating floor (clamped at 0).
 * 3. Server-side rank tier recalculation.
 * 4. Atomic transaction updating Member and writing immutable DreamRankHistory ledger row.
 */
export async function applyDreamRatingChange(
  memberId: string,
  change: number,
  reason: string
): Promise<{
  member: {
    id: string;
    memberCode: string;
    fullName: string;
    username: string;
    dreamRating: number;
    dreamRank: DreamRank;
  };
  history: DreamRankHistoryItem;
}> {
  if (!reason || !reason.trim()) {
    throw new Error("Alasan perubahan rating wajib diisi");
  }

  return await prisma.$transaction(async (tx) => {
    const member = await tx.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new Error("Member tidak ditemukan");
    }

    const previousRating = member.dreamRating;
    const previousRank = member.dreamRank;

    // Prevent negative rating
    const newRating = Math.max(0, previousRating + change);
    const newRank = calculateDreamRank(newRating);

    const updatedMember = await tx.member.update({
      where: { id: memberId },
      data: {
        dreamRating: newRating,
        dreamRank: newRank,
      },
    });

    const historyRecord = await tx.dreamRankHistory.create({
      data: {
        memberId,
        previousRating,
        newRating,
        previousRank,
        newRank,
        change,
        reason: reason.trim(),
      },
    });

    return {
      member: {
        id: updatedMember.id,
        memberCode: updatedMember.memberCode,
        fullName: updatedMember.fullName,
        username: updatedMember.username,
        dreamRating: updatedMember.dreamRating,
        dreamRank: updatedMember.dreamRank,
      },
      history: {
        id: historyRecord.id,
        memberId: historyRecord.memberId,
        previousRating: historyRecord.previousRating,
        newRating: historyRecord.newRating,
        previousRank: historyRecord.previousRank,
        newRank: historyRecord.newRank,
        change: historyRecord.change,
        reason: historyRecord.reason,
        createdAt: historyRecord.createdAt.toISOString(),
      },
    };
  });
}
