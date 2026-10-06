import { prisma } from "@/lib/prisma";
import { TeamMemberRole, DreamRank, MemberTier } from "@prisma/client";
import {
  TeamItem,
  TeamMemberDTO,
  TeamSummaryDTO,
  MemberTeamMembershipDTO,
} from "@/lib/types";
import {
  createTeamSchema,
  updateTeamSchema,
  addTeamMemberSchema,
  transferTeamOwnershipSchema,
} from "@/lib/validators";
import { calculateDreamRank } from "@/services/dreamrank.service";

export interface ListTeamsFilter {
  search?: string;
  tag?: string;
}

export interface CreateTeamInput {
  name: string;
  tag: string;
  description?: string | null;
  logoUrl?: string | null;
  ownerId: string;
}

export interface UpdateTeamInput {
  name?: string;
  tag?: string;
  description?: string | null;
  logoUrl?: string | null;
}

/**
 * Lists teams with optional search query and tag filter.
 */
export async function listTeams(filter?: ListTeamsFilter): Promise<TeamItem[]> {
  const where: Record<string, unknown> = {};

  if (filter?.tag) {
    where.tag = { equals: filter.tag.trim().toUpperCase() };
  }

  if (filter?.search) {
    const q = filter.search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { tag: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const teams = await prisma.team.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          username: true,
        },
      },
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  return teams.map((t) => ({
    id: t.id,
    name: t.name,
    tag: t.tag,
    description: t.description,
    logoUrl: t.logoUrl,
    ownerId: t.ownerId,
    ownerName: t.owner.fullName,
    ownerUsername: t.owner.username,
    memberCount: t._count.members,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));
}

/**
 * Retrieves a single team by ID.
 */
export async function getTeamById(id: string): Promise<TeamItem | null> {
  const t = await prisma.team.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          username: true,
        },
      },
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  if (!t) return null;

  return {
    id: t.id,
    name: t.name,
    tag: t.tag,
    description: t.description,
    logoUrl: t.logoUrl,
    ownerId: t.ownerId,
    ownerName: t.owner.fullName,
    ownerUsername: t.owner.username,
    memberCount: t._count.members,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

/**
 * Retrieves a single team by Tag.
 */
export async function getTeamByTag(tag: string): Promise<TeamItem | null> {
  const normalizedTag = tag.trim().toUpperCase();
  const t = await prisma.team.findUnique({
    where: { tag: normalizedTag },
    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          username: true,
        },
      },
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  if (!t) return null;

  return {
    id: t.id,
    name: t.name,
    tag: t.tag,
    description: t.description,
    logoUrl: t.logoUrl,
    ownerId: t.ownerId,
    ownerName: t.owner.fullName,
    ownerUsername: t.owner.username,
    memberCount: t._count.members,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

/**
 * Creates a team and atomically records the creator as OWNER member.
 */
export async function createTeam(input: CreateTeamInput): Promise<TeamItem> {
  const validated = createTeamSchema.parse(input);

  // Validate owner existence
  const owner = await prisma.member.findUnique({
    where: { id: validated.ownerId },
    select: { id: true, fullName: true, username: true },
  });

  if (!owner) {
    throw new Error("Owner member tidak ditemukan");
  }

  // Check unique team name
  const existingName = await prisma.team.findFirst({
    where: { name: { equals: validated.name, mode: "insensitive" } },
  });
  if (existingName) {
    throw new Error(`Nama tim '${validated.name}' sudah digunakan`);
  }

  // Check unique team tag
  const existingTag = await prisma.team.findUnique({
    where: { tag: validated.tag },
  });
  if (existingTag) {
    throw new Error(`Tag tim '${validated.tag}' sudah digunakan`);
  }

  // Create atomically
  const result = await prisma.$transaction(async (tx) => {
    const team = await tx.team.create({
      data: {
        name: validated.name,
        tag: validated.tag,
        description: validated.description || null,
        logoUrl: validated.logoUrl || null,
        ownerId: owner.id,
      },
    });

    await tx.teamMember.create({
      data: {
        teamId: team.id,
        memberId: owner.id,
        role: TeamMemberRole.OWNER,
      },
    });

    return team;
  });

  return {
    id: result.id,
    name: result.name,
    tag: result.tag,
    description: result.description,
    logoUrl: result.logoUrl,
    ownerId: owner.id,
    ownerName: owner.fullName,
    ownerUsername: owner.username,
    memberCount: 1,
    createdAt: result.createdAt.toISOString(),
    updatedAt: result.updatedAt.toISOString(),
  };
}

/**
 * Updates team attributes.
 */
export async function updateTeam(id: string, input: UpdateTeamInput): Promise<TeamItem> {
  const validated = updateTeamSchema.parse(input);

  const existingTeam = await prisma.team.findUnique({
    where: { id },
  });

  if (!existingTeam) {
    throw new Error("Tim tidak ditemukan");
  }

  if (validated.name && validated.name.toLowerCase() !== existingTeam.name.toLowerCase()) {
    const dupName = await prisma.team.findFirst({
      where: {
        name: { equals: validated.name, mode: "insensitive" },
        id: { not: id },
      },
    });
    if (dupName) {
      throw new Error(`Nama tim '${validated.name}' sudah digunakan`);
    }
  }

  if (validated.tag && validated.tag !== existingTeam.tag) {
    const dupTag = await prisma.team.findFirst({
      where: {
        tag: validated.tag,
        id: { not: id },
      },
    });
    if (dupTag) {
      throw new Error(`Tag tim '${validated.tag}' sudah digunakan`);
    }
  }

  const updated = await prisma.team.update({
    where: { id },
    data: {
      name: validated.name,
      tag: validated.tag,
      description: validated.description,
      logoUrl: validated.logoUrl,
    },
    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          username: true,
        },
      },
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  return {
    id: updated.id,
    name: updated.name,
    tag: updated.tag,
    description: updated.description,
    logoUrl: updated.logoUrl,
    ownerId: updated.ownerId,
    ownerName: updated.owner.fullName,
    ownerUsername: updated.owner.username,
    memberCount: updated._count.members,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

/**
 * Deletes team and cascade cleans up TeamMember rows. Member accounts remain untouched.
 */
export async function deleteTeam(id: string): Promise<boolean> {
  const existing = await prisma.team.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Tim tidak ditemukan");
  }

  await prisma.team.delete({
    where: { id },
  });

  return true;
}

/**
 * Lists all members belonging to a team.
 */
export async function listTeamMembers(teamId: string): Promise<TeamMemberDTO[]> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true },
  });

  if (!team) {
    throw new Error("Tim tidak ditemukan");
  }

  const members = await prisma.teamMember.findMany({
    where: { teamId },
    orderBy: [
      { role: "asc" }, // OWNER first
      { joinedAt: "asc" },
    ],
    include: {
      member: {
        select: {
          id: true,
          fullName: true,
          username: true,
          memberCode: true,
          tier: true,
          dreamRating: true,
          dreamRank: true,
          avatarUrl: true,
        },
      },
    },
  });

  return members.map((tm) => ({
    id: tm.id,
    teamId: tm.teamId,
    memberId: tm.memberId,
    memberName: tm.member.fullName,
    username: tm.member.username,
    memberCode: tm.member.memberCode,
    tier: tm.member.tier as MemberTier,
    role: tm.role as TeamMemberRole,
    dreamRating: tm.member.dreamRating,
    dreamRank: tm.member.dreamRank as DreamRank,
    avatarUrl: tm.member.avatarUrl,
    joinedAt: tm.joinedAt.toISOString(),
  }));
}

/**
 * Adds a new member to a team.
 */
export async function addTeamMember(
  teamId: string,
  input: { memberId: string; role?: "OWNER" | "MEMBER" }
): Promise<TeamMemberDTO> {
  const validated = addTeamMemberSchema.parse(input);

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true },
  });
  if (!team) {
    throw new Error("Tim tidak ditemukan");
  }

  const member = await prisma.member.findUnique({
    where: { id: validated.memberId },
    select: {
      id: true,
      fullName: true,
      username: true,
      memberCode: true,
      tier: true,
      dreamRating: true,
      dreamRank: true,
      avatarUrl: true,
    },
  });
  if (!member) {
    throw new Error("Member tidak ditemukan");
  }

  // Prevent duplicate membership
  const existingMember = await prisma.teamMember.findUnique({
    where: {
      teamId_memberId: {
        teamId,
        memberId: validated.memberId,
      },
    },
  });
  if (existingMember) {
    throw new Error("Member sudah terdaftar dalam tim ini");
  }

  const created = await prisma.teamMember.create({
    data: {
      teamId,
      memberId: validated.memberId,
      role: (validated.role as TeamMemberRole) || TeamMemberRole.MEMBER,
    },
  });

  return {
    id: created.id,
    teamId: created.teamId,
    memberId: member.id,
    memberName: member.fullName,
    username: member.username,
    memberCode: member.memberCode,
    tier: member.tier as MemberTier,
    role: created.role as TeamMemberRole,
    dreamRating: member.dreamRating,
    dreamRank: member.dreamRank as DreamRank,
    avatarUrl: member.avatarUrl,
    joinedAt: created.joinedAt.toISOString(),
  };
}

/**
 * Removes a non-owner member from the team.
 */
export async function removeTeamMember(teamId: string, memberId: string): Promise<boolean> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, ownerId: true },
  });
  if (!team) {
    throw new Error("Tim tidak ditemukan");
  }

  if (team.ownerId === memberId) {
    throw new Error("Owner tim tidak dapat dihapus dari anggota");
  }

  const membership = await prisma.teamMember.findUnique({
    where: {
      teamId_memberId: {
        teamId,
        memberId,
      },
    },
  });

  if (!membership) {
    throw new Error("Member tidak terdaftar dalam tim ini");
  }

  await prisma.teamMember.delete({
    where: {
      teamId_memberId: {
        teamId,
        memberId,
      },
    },
  });

  return true;
}

/**
 * Allows a member to leave the team. Owner cannot leave without transfer.
 */
export async function leaveTeam(teamId: string, memberId: string): Promise<boolean> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, ownerId: true },
  });
  if (!team) {
    throw new Error("Tim tidak ditemukan");
  }

  if (team.ownerId === memberId) {
    throw new Error("Owner tidak dapat keluar dari tim tanpa mentransfer kepemilikan terlebih dahulu");
  }

  const membership = await prisma.teamMember.findUnique({
    where: {
      teamId_memberId: {
        teamId,
        memberId,
      },
    },
  });

  if (!membership) {
    throw new Error("Member tidak terdaftar dalam tim ini");
  }

  await prisma.teamMember.delete({
    where: {
      teamId_memberId: {
        teamId,
        memberId,
      },
    },
  });

  return true;
}

/**
 * Atomically transfers team ownership from current owner to another existing team member.
 */
export async function transferTeamOwnership(
  teamId: string,
  newOwnerId: string
): Promise<{ team: TeamItem; newOwner: TeamMemberDTO }> {
  transferTeamOwnershipSchema.parse({ newOwnerId });

  return await prisma.$transaction(async (tx) => {
    const team = await tx.team.findUnique({
      where: { id: teamId },
      include: {
        owner: true,
      },
    });

    if (!team) {
      throw new Error("Tim tidak ditemukan");
    }

    if (team.ownerId === newOwnerId) {
      throw new Error("Member tersebut sudah merupakan owner tim");
    }

    // Verify candidate is an active member of this team
    const newOwnerMembership = await tx.teamMember.findUnique({
      where: {
        teamId_memberId: {
          teamId,
          memberId: newOwnerId,
        },
      },
      include: {
        member: true,
      },
    });

    if (!newOwnerMembership) {
      throw new Error("Calon owner baru harus merupakan anggota tim yang terdaftar");
    }

    // 1. Demote old owner to MEMBER
    await tx.teamMember.update({
      where: {
        teamId_memberId: {
          teamId,
          memberId: team.ownerId,
        },
      },
      data: {
        role: TeamMemberRole.MEMBER,
      },
    });

    // 2. Promote new owner to OWNER
    const updatedMembership = await tx.teamMember.update({
      where: {
        teamId_memberId: {
          teamId,
          memberId: newOwnerId,
        },
      },
      data: {
        role: TeamMemberRole.OWNER,
      },
    });

    // 3. Update team.ownerId
    const updatedTeam = await tx.team.update({
      where: { id: teamId },
      data: {
        ownerId: newOwnerId,
      },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return {
      team: {
        id: updatedTeam.id,
        name: updatedTeam.name,
        tag: updatedTeam.tag,
        description: updatedTeam.description,
        logoUrl: updatedTeam.logoUrl,
        ownerId: updatedTeam.ownerId,
        ownerName: updatedTeam.owner.fullName,
        ownerUsername: updatedTeam.owner.username,
        memberCount: updatedTeam._count.members,
        createdAt: updatedTeam.createdAt.toISOString(),
        updatedAt: updatedTeam.updatedAt.toISOString(),
      },
      newOwner: {
        id: updatedMembership.id,
        teamId: updatedMembership.teamId,
        memberId: newOwnerMembership.member.id,
        memberName: newOwnerMembership.member.fullName,
        username: newOwnerMembership.member.username,
        memberCode: newOwnerMembership.member.memberCode,
        tier: newOwnerMembership.member.tier as MemberTier,
        role: updatedMembership.role as TeamMemberRole,
        dreamRating: newOwnerMembership.member.dreamRating,
        dreamRank: newOwnerMembership.member.dreamRank as DreamRank,
        avatarUrl: newOwnerMembership.member.avatarUrl,
        joinedAt: updatedMembership.joinedAt.toISOString(),
      },
    };
  });
}

/**
 * Computes team summary including real DREAMRANK statistics calculated from actual members.
 */
export async function getTeamSummary(teamId: string): Promise<TeamSummaryDTO> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          username: true,
          memberCode: true,
        },
      },
      members: {
        orderBy: [
          { role: "asc" },
          { joinedAt: "asc" },
        ],
        include: {
          member: {
            select: {
              id: true,
              fullName: true,
              username: true,
              memberCode: true,
              tier: true,
              dreamRating: true,
              dreamRank: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  if (!team) {
    throw new Error("Tim tidak ditemukan");
  }

  const memberList: TeamMemberDTO[] = team.members.map((tm) => ({
    id: tm.id,
    teamId: tm.teamId,
    memberId: tm.memberId,
    memberName: tm.member.fullName,
    username: tm.member.username,
    memberCode: tm.member.memberCode,
    tier: tm.member.tier as MemberTier,
    role: tm.role as TeamMemberRole,
    dreamRating: tm.member.dreamRating,
    dreamRank: tm.member.dreamRank as DreamRank,
    avatarUrl: tm.member.avatarUrl,
    joinedAt: tm.joinedAt.toISOString(),
  }));

  const ratings = memberList.map((m) => m.dreamRating);
  const totalRating = ratings.reduce((sum, r) => sum + r, 0);
  const averageRating = ratings.length > 0 ? Math.round(totalRating / ratings.length) : 0;
  const highestRating = ratings.length > 0 ? Math.max(...ratings) : 0;
  const lowestRating = ratings.length > 0 ? Math.min(...ratings) : 0;
  const highestRank = calculateDreamRank(highestRating);
  const lowestRank = calculateDreamRank(lowestRating);

  return {
    team: {
      id: team.id,
      name: team.name,
      tag: team.tag,
      description: team.description,
      logoUrl: team.logoUrl,
      ownerId: team.ownerId,
      ownerName: team.owner.fullName,
      ownerUsername: team.owner.username,
      memberCount: memberList.length,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
    },
    owner: {
      id: team.owner.id,
      fullName: team.owner.fullName,
      username: team.owner.username,
      memberCode: team.owner.memberCode,
    },
    memberCount: memberList.length,
    members: memberList,
    averageRating,
    highestRating,
    lowestRating,
    highestRank,
    lowestRank,
  };
}

/**
 * Returns all team memberships for a given member.
 */
export async function getMemberTeams(memberId: string): Promise<MemberTeamMembershipDTO[]> {
  const memberships = await prisma.teamMember.findMany({
    where: { memberId },
    include: {
      team: {
        include: {
          _count: {
            select: { members: true },
          },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return memberships.map((tm) => ({
    id: tm.id,
    teamId: tm.teamId,
    teamName: tm.team.name,
    teamTag: tm.team.tag,
    role: tm.role as TeamMemberRole,
    memberCount: tm.team._count.members,
    joinedAt: tm.joinedAt.toISOString(),
  }));
}
