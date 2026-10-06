"use client";

import React, { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TeamSummaryDTO, TeamMemberDTO, MemberItem, TeamInvitationDTO } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  Shield,
  Users,
  Trophy,
  ArrowLeft,
  Crown,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  UserMinus,
  ArrowRightLeft,
  Calendar,
  LogOut,
  Edit2,
  TrendingUp,
  Award,
  Mail,
  Check,
  X,
} from "lucide-react";
import { formatDateTime } from "@/lib/formatters";

export default function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const teamId = resolvedParams.id;

  const [summary, setSummary] = useState<TeamSummaryDTO | null>(null);
  const [allMembers, setAllMembers] = useState<MemberItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [invitations, setInvitations] = useState<TeamInvitationDTO[]>([]);
  const [selectedMember, setSelectedMember] = useState<TeamMemberDTO | null>(null);
  const [newMemberId, setNewMemberId] = useState("");
  const [inviteMemberId, setInviteMemberId] = useState("");
  const [newOwnerId, setNewOwnerId] = useState("");
  const [leaveMemberId, setLeaveMemberId] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    tag: "",
    description: "",
  });

  const fetchTeamSummary = useCallback(async () => {
    try {
      setErrorMessage(null);
      const [sumRes, invRes] = await Promise.all([
        fetch(`/api/teams/${teamId}/summary`),
        fetch(`/api/teams/${teamId}/invitations`),
      ]);
      const json = await sumRes.json();
      if (!sumRes.ok || !json.success) {
        throw new Error(json.message || "Gagal memuat informasi tim");
      }
      setSummary(json.data);
      setEditForm({
        name: json.data.team.name,
        tag: json.data.team.tag,
        description: json.data.team.description || "",
      });

      if (invRes.ok) {
        const invJson = await invRes.json();
        if (invJson.success) {
          setInvitations(invJson.data);
        }
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan server");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [teamId]);

  const fetchAvailableMembers = async () => {
    try {
      const res = await fetch("/api/members");
      const json = await res.json();
      if (res.ok && json.success) {
        setAllMembers(json.data);
      }
    } catch (err) {
      console.error("Gagal memuat daftar member", err);
    }
  };

  useEffect(() => {
    fetchTeamSummary();
    fetchAvailableMembers();
  }, [fetchTeamSummary]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTeamSummary();
  };

  // Helper for rank badge style
  const getRankBadgeStyle = (rank: string) => {
    switch (rank) {
      case "GRANDMASTER":
        return "bg-rose-950/40 text-rose-400 border-rose-800/40";
      case "MASTER":
        return "bg-purple-950/40 text-purple-400 border-purple-800/40";
      case "DIAMOND":
        return "bg-cyan-950/40 text-cyan-400 border-cyan-800/40";
      case "PLATINUM":
        return "bg-teal-950/40 text-teal-400 border-teal-800/40";
      case "GOLD":
        return "bg-amber-950/40 text-amber-400 border-amber-800/40";
      case "SILVER":
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
      case "BRONZE":
      default:
        return "bg-amber-950/30 text-amber-600 border-amber-900/40";
    }
  };

  // Invite Member Modal
  const handleOpenInviteModal = () => {
    setFormError(null);
    const existingIds = new Set(summary?.members.map((m) => m.memberId) || []);
    const pendingIds = new Set(
      invitations.filter((i) => i.status === "PENDING").map((i) => i.memberId)
    );
    const available = allMembers.filter((m) => !existingIds.has(m.id) && !pendingIds.has(m.id));
    setInviteMemberId(available[0]?.id || "");
    setInviteModalOpen(true);
  };

  const handleSendInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteMemberId) {
      setFormError("Pilih member yang ingin diundang.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const res = await fetch(`/api/teams/${teamId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: inviteMemberId,
          invitedById: summary?.owner.id,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal mengirim undangan");
      }

      setInviteModalOpen(false);
      fetchTeamSummary();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!summary) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/teams/${teamId}/invitations/${invitationId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorMemberId: summary.owner.id }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal membatalkan undangan");
      }

      fetchTeamSummary();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal membatalkan undangan");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Member
  const handleOpenAddMember = () => {
    setFormError(null);
    const existingMemberIds = new Set(summary?.members.map((m) => m.memberId));
    const available = allMembers.filter((m) => !existingMemberIds.has(m.id));
    setNewMemberId(available[0]?.id || "");
    setAddMemberModalOpen(true);
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberId) {
      setFormError("Pilih member yang ingin ditambahkan.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: newMemberId, role: "MEMBER" }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menambahkan anggota");
      }

      setAddMemberModalOpen(false);
      fetchTeamSummary();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove Member
  const handleOpenRemoveMember = (member: TeamMemberDTO) => {
    setSelectedMember(member);
    setFormError(null);
    setRemoveModalOpen(true);
  };

  const handleRemoveMemberSubmit = async () => {
    if (!selectedMember) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/teams/${teamId}/members/${selectedMember.memberId}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menghapus anggota");
      }

      setRemoveModalOpen(false);
      fetchTeamSummary();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Gagal menghapus anggota");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Transfer Ownership
  const handleOpenTransfer = (candidateId?: string) => {
    setFormError(null);
    const otherMembers = summary?.members.filter((m) => m.role !== "OWNER") || [];
    setNewOwnerId(candidateId || otherMembers[0]?.memberId || "");
    setTransferModalOpen(true);
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOwnerId) {
      setFormError("Pilih anggota yang akan menjadi pemilik baru.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const res = await fetch(`/api/teams/${teamId}/transfer-ownership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newOwnerId }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal mentransfer kepemilikan");
      }

      setTransferModalOpen(false);
      fetchTeamSummary();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Leave Team
  const handleOpenLeave = (memberId?: string) => {
    setFormError(null);
    const nonOwnerMembers = summary?.members.filter((m) => m.role !== "OWNER") || [];
    setLeaveMemberId(memberId || nonOwnerMembers[0]?.memberId || "");
    setLeaveModalOpen(true);
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveMemberId) {
      setFormError("Pilih member yang akan keluar dari tim.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const res = await fetch(`/api/teams/${teamId}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: leaveMemberId }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal keluar dari tim");
      }

      setLeaveModalOpen(false);
      fetchTeamSummary();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Team
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setFormError(null);

      const res = await fetch(`/api/teams/${teamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          tag: editForm.tag.trim().toUpperCase(),
          description: editForm.description.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal memperbarui tim");
      }

      setEditModalOpen(false);
      fetchTeamSummary();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Team
  const handleDeleteSubmit = async () => {
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menghapus tim");
      }

      router.push("/teams");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Gagal menghapus tim");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center bg-surface-card border border-surface-border rounded-[4px]">
        <RefreshCw className="w-6 h-6 animate-spin text-persona-red mx-auto mb-2" />
        <p className="text-xs text-text-secondary font-mono">Memuat profil tim & roster...</p>
      </div>
    );
  }

  if (errorMessage || !summary) {
    return (
      <div className="p-8 bg-surface-card border border-surface-border rounded-[4px] text-center space-y-4">
        <AlertTriangle className="w-8 h-8 text-persona-red mx-auto" />
        <div>
          <h2 className="text-sm font-bold text-text-primary">Tim Tidak Ditemukan</h2>
          <p className="text-xs text-text-secondary mt-1">{errorMessage || "Data tim tidak tersedia."}</p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Link href="/teams">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Daftar Tim</span>
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={handleRefresh}>
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  const { team, owner, memberCount, members, averageRating, highestRating, lowestRating, highestRank, lowestRank } = summary;
  const existingMemberIds = new Set(members.map((m) => m.memberId));
  const availableMembersToAdd = allMembers.filter((m) => !existingMemberIds.has(m.id));
  const pendingInvitedMemberIds = new Set(
    invitations.filter((i) => i.status === "PENDING").map((i) => i.memberId)
  );
  const availableMembersToInvite = allMembers.filter(
    (m) => !existingMemberIds.has(m.id) && !pendingInvitedMemberIds.has(m.id)
  );

  return (
    <div className="space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/teams"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Manajemen Tim</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFormError(null);
              setEditModalOpen(true);
            }}
            className="flex items-center gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Info</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFormError(null);
              setDeleteModalOpen(true);
            }}
            className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Tim</span>
          </Button>
        </div>
      </div>

      {/* Team Header Banner */}
      <div className="bg-surface-card border border-surface-border p-5 rounded-[4px] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            {/* Tag Badge Emblem */}
            <div className="w-16 h-16 rounded-[4px] bg-surface-dark border border-persona-blue/40 flex items-center justify-center font-mono font-black text-lg text-persona-blue shrink-0">
              #{team.tag}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-black text-text-primary tracking-wide">
                  {team.name}
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-persona-blue/10 border border-persona-blue/30 text-persona-blue">
                  #{team.tag}
                </span>
                <span className="text-xs font-mono text-text-muted px-2 py-0.5 bg-surface-dark border border-surface-border rounded">
                  {memberCount} Anggota
                </span>
              </div>

              <p className="text-xs text-text-secondary mt-1">
                {team.description || "Tidak ada deskripsi profil untuk tim ini."}
              </p>

              <div className="flex items-center gap-3 text-[11px] text-text-muted mt-2">
                <span className="flex items-center gap-1 text-text-secondary font-mono">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Owner: <strong className="text-text-primary">{owner.fullName}</strong> (@{owner.username})</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Terdaftar: {team.createdAt.slice(0, 10)}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions inside Banner */}
          <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-surface-border pt-3 md:pt-0 md:pl-5">
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAddMember}
              disabled={availableMembersToAdd.length === 0}
              className="bg-persona-red hover:bg-persona-red-hover text-white flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Roster</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInviteModal}
              disabled={availableMembersToInvite.length === 0}
              className="flex items-center gap-1.5 text-persona-blue hover:text-persona-blue/80"
              title="Kirim undangan rekrutmen ke member"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Undang Member</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenTransfer()}
              disabled={members.filter((m) => m.role !== "OWNER").length === 0}
              className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300"
              title="Transfer kepemilikan tim ke anggota lain"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Transfer</span>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Overview: Real DREAMRANK Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface-card border border-surface-border p-3.5 rounded-[4px]">
          <div className="flex items-center justify-between text-text-muted mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Total Roster</span>
            <Users className="w-3.5 h-3.5 text-text-secondary" />
          </div>
          <div className="text-lg font-bold text-text-primary font-mono">
            {memberCount} Player
          </div>
          <div className="text-[10px] text-text-muted mt-0.5">Anggota aktif terdaftar</div>
        </div>

        <div className="bg-surface-card border border-surface-border p-3.5 rounded-[4px]">
          <div className="flex items-center justify-between text-text-muted mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Rata-Rata Rating</span>
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-amber-400 font-mono">
            {averageRating.toLocaleString("id-ID")} RR
          </div>
          <div className="text-[10px] text-text-muted mt-0.5 font-mono">
            Tier Rata-rata: {calculateRankLabel(averageRating)}
          </div>
        </div>

        <div className="bg-surface-card border border-surface-border p-3.5 rounded-[4px]">
          <div className="flex items-center justify-between text-text-muted mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Highest Rating</span>
            <Trophy className="w-3.5 h-3.5 text-persona-blue" />
          </div>
          <div className="text-lg font-bold text-persona-blue font-mono">
            {highestRating.toLocaleString("id-ID")} RR
          </div>
          <div className="text-[10px] text-text-muted mt-0.5 font-mono">
            Top Rank: {highestRank}
          </div>
        </div>

        <div className="bg-surface-card border border-surface-border p-3.5 rounded-[4px]">
          <div className="flex items-center justify-between text-text-muted mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Lowest Rating</span>
            <Award className="w-3.5 h-3.5 text-text-muted" />
          </div>
          <div className="text-lg font-bold text-text-primary font-mono">
            {lowestRating.toLocaleString("id-ID")} RR
          </div>
          <div className="text-[10px] text-text-muted mt-0.5 font-mono">
            Base Rank: {lowestRank}
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-3.5 bg-persona-blue persona-slash rounded-[1px]"></div>
            <h2 className="text-xs font-mono font-bold tracking-wider text-text-primary uppercase">
              Susunan Anggota Tim (Active Roster)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-text-muted">
            {members.length} Player Terdata
          </span>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-[4px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-dark border-b border-surface-border text-text-muted uppercase font-mono text-[10px]">
                <tr>
                  <th className="px-4 py-2.5">Player / Member</th>
                  <th className="px-4 py-2.5">Role Tim</th>
                  <th className="px-4 py-2.5">Member Tier</th>
                  <th className="px-4 py-2.5">DREAMRANK</th>
                  <th className="px-4 py-2.5">Rating (RR)</th>
                  <th className="px-4 py-2.5">Tanggal Bergabung</th>
                  <th className="px-4 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-surface-dark border border-surface-border flex items-center justify-center font-mono font-bold text-xs text-text-secondary">
                          {member.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-text-primary flex items-center gap-1.5">
                            <Link
                              href={`/members/${member.memberId}/gaming`}
                              className="hover:underline hover:text-persona-blue flex items-center gap-1"
                            >
                              <span>{member.memberName}</span>
                            </Link>
                            {member.role === "OWNER" && (
                              <span title="Team Owner">
                                <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-text-muted font-mono">
                            @{member.username} • {member.memberCode}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-2.5">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                          member.role === "OWNER"
                            ? "bg-amber-950/40 text-amber-400 border-amber-800/40"
                            : "bg-surface-dark text-text-secondary border-surface-border"
                        }`}
                      >
                        {member.role}
                      </span>
                    </td>

                    <td className="px-4 py-2.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-surface-dark border border-surface-border text-text-muted rounded">
                        {member.tier}
                      </span>
                    </td>

                    <td className="px-4 py-2.5">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getRankBadgeStyle(
                          member.dreamRank
                        )}`}
                      >
                        {member.dreamRank}
                      </span>
                    </td>

                    <td className="px-4 py-2.5 font-mono text-text-primary font-bold">
                      {member.dreamRating.toLocaleString("id-ID")} RR
                    </td>

                    <td className="px-4 py-2.5 font-mono text-text-muted text-[11px]">
                      {formatDateTime(member.joinedAt)}
                    </td>

                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/members/${member.memberId}/gaming`}
                          className="p-1 text-text-muted hover:text-persona-blue hover:bg-surface-dark rounded transition-colors"
                          title="Lihat Profil Gaming"
                        >
                          <Trophy className="w-3.5 h-3.5" />
                        </Link>

                        {member.role !== "OWNER" && (
                          <>
                            <button
                              onClick={() => handleOpenTransfer(member.memberId)}
                              className="p-1 text-text-muted hover:text-amber-400 hover:bg-surface-dark rounded transition-colors"
                              title="Jadikan Owner Tim"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenRemoveMember(member)}
                              className="p-1 text-text-muted hover:text-rose-400 hover:bg-surface-dark rounded transition-colors"
                              title="Keluarkan dari Tim"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Team Invitations Section (Phase 2) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-3.5 bg-persona-blue persona-slash rounded-[1px]"></div>
            <div>
              <h2 className="text-xs font-mono font-bold tracking-wider text-text-primary uppercase flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-persona-blue" />
                <span>Undangan Tim & Rekrutmen</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-surface-dark border border-surface-border text-amber-400 font-mono rounded">
                  {invitations.filter((i) => i.status === "PENDING").length} Pending
                </span>
              </h2>
              <p className="text-[11px] text-text-secondary mt-0.5">
                Kelola status rekrutmen pemain dan batalkan undangan pending jika diperlukan.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenInviteModal}
            disabled={availableMembersToInvite.length === 0}
            className="flex items-center gap-1.5 text-xs text-persona-blue hover:text-persona-blue/80 self-start sm:self-auto"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Kirim Undangan Baru</span>
          </Button>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-[4px] overflow-hidden">
          {invitations.length === 0 ? (
            <div className="p-8 text-center">
              <Mail className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
              <p className="text-xs font-mono text-text-secondary">
                Belum ada undangan yang pernah dikirimkan oleh tim ini.
              </p>
              <p className="text-[11px] text-text-muted mt-1">
                Owner tim dapat mengundang member kafe untuk bergabung secara resmi ke dalam roster.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-surface-dark border-b border-surface-border text-text-muted font-mono text-[10px] uppercase tracking-wider">
                    <th className="px-3.5 py-2.5">Target Member</th>
                    <th className="px-3.5 py-2.5">Pengundang</th>
                    <th className="px-3.5 py-2.5">Status Undangan</th>
                    <th className="px-3.5 py-2.5">Tanggal Dikirim</th>
                    <th className="px-3.5 py-2.5">Respon</th>
                    <th className="px-3.5 py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border font-mono">
                  {invitations.map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-surface-dark/40 transition-colors"
                    >
                      <td className="px-3.5 py-2.5">
                        <div className="font-sans font-bold text-text-primary text-xs">
                          {inv.memberName}
                        </div>
                        <div className="text-[10px] text-text-muted">
                          @{inv.memberUsername || "member"}
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-text-secondary">
                        <div className="flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-400" />
                          <span>{inv.invitedByName}</span>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            inv.status === "PENDING"
                              ? "bg-amber-950/40 text-amber-400 border-amber-800/40"
                              : inv.status === "ACCEPTED"
                              ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/40"
                              : inv.status === "REJECTED"
                              ? "bg-rose-950/40 text-rose-400 border-rose-800/40"
                              : "bg-surface-dark text-text-muted border-surface-border"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-text-muted text-[11px]">
                        {formatDateTime(inv.createdAt)}
                      </td>
                      <td className="px-3.5 py-2.5 text-text-muted text-[11px]">
                        {inv.respondedAt ? formatDateTime(inv.respondedAt) : "-"}
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        {inv.status === "PENDING" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelInvitation(inv.id)}
                            disabled={isSubmitting}
                            className="h-6 text-[10px] px-2 text-rose-400 hover:text-rose-300 border-rose-900/40 hover:bg-rose-950/30"
                          >
                            Batalkan
                          </Button>
                        ) : (
                          <span className="text-[10px] text-text-muted">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Invite Member Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Kirim Undangan Tim"
      >
        <form onSubmit={handleSendInviteSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded">
              {formError}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-mono text-text-secondary block">
              Pilih Calon Anggota (Target Rekrutmen)
            </label>
            <select
              value={inviteMemberId}
              onChange={(e) => setInviteMemberId(e.target.value)}
              className="w-full bg-surface-dark border border-surface-border text-text-primary text-xs rounded p-2 focus:outline-none focus:border-surface-border-active"
              required
            >
              {availableMembersToInvite.length === 0 ? (
                <option value="">Tidak ada member yang dapat diundang saat ini</option>
              ) : (
                availableMembersToInvite.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} (@{m.username}) — {m.memberCode} [{m.dreamRank} • {m.dreamRating || 0} RR]
                  </option>
                ))
              )}
            </select>
            <p className="text-[11px] text-text-muted mt-0.5">
              Undangan akan dikirimkan dengan status PENDING. Calon pemain dapat menerima atau menolak undangan dari profil gaming mereka.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInviteModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting || availableMembersToInvite.length === 0}
              className="bg-persona-blue hover:bg-persona-blue/80 text-white flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Mengirim..." : "Kirim Undangan"}</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        isOpen={addMemberModalOpen}
        onClose={() => setAddMemberModalOpen(false)}
        title="Tambah Anggota Roster"
      >
        <form onSubmit={handleAddMemberSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded">
              {formError}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-mono text-text-secondary block">
              Pilih Member
            </label>
            <select
              value={newMemberId}
              onChange={(e) => setNewMemberId(e.target.value)}
              className="w-full bg-surface-dark border border-surface-border text-text-primary text-xs rounded p-2 focus:outline-none focus:border-surface-border-active"
              required
            >
              {availableMembersToAdd.length === 0 ? (
                <option value="">Semua member sudah terdaftar di tim ini</option>
              ) : (
                availableMembersToAdd.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} (@{m.username}) — {m.memberCode} [{m.dreamRank} • {m.dreamRating || 0} RR]
                  </option>
                ))
              )}
            </select>
            <p className="text-[11px] text-text-muted mt-0.5">
              Rating DREAMRANK dan rank anggota akan otomatis terhubung secara real-time.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAddMemberModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting || availableMembersToAdd.length === 0}
              className="bg-persona-red hover:bg-persona-red-hover text-white"
            >
              {isSubmitting ? "Menambahkan..." : "Tambahkan ke Roster"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Remove Member Modal */}
      <Modal
        isOpen={removeModalOpen}
        onClose={() => setRemoveModalOpen(false)}
        title="Keluarkan Anggota"
      >
        <div className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded">
              {formError}
            </div>
          )}

          <p className="text-xs text-text-secondary">
            Apakah Anda yakin ingin mengeluarkan{" "}
            <span className="font-bold text-text-primary">
              {selectedMember?.memberName} (@{selectedMember?.username})
            </span>{" "}
            dari tim ini? Akun dan rating DREAMRANK member tidak akan terhapus.
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRemoveModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleRemoveMemberSubmit}
              disabled={isSubmitting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isSubmitting ? "Mengeluarkan..." : "Keluarkan Anggota"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Transfer Ownership Modal */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title="Transfer Kepemilikan Tim"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded">
              {formError}
            </div>
          )}

          <p className="text-xs text-text-secondary">
            Pilih anggota tim yang akan menjadi pemilik (OWNER) baru. Pemilik saat ini (
            <strong className="text-text-primary">{owner.fullName}</strong>) akan secara otomatis menjadi anggota biasa (MEMBER).
          </p>

          <div className="space-y-1">
            <label className="text-xs font-mono text-text-secondary block">
              Calon Owner Baru
            </label>
            <select
              value={newOwnerId}
              onChange={(e) => setNewOwnerId(e.target.value)}
              className="w-full bg-surface-dark border border-surface-border text-text-primary text-xs rounded p-2 focus:outline-none focus:border-surface-border-active"
              required
            >
              {members
                .filter((m) => m.role !== "OWNER")
                .map((m) => (
                  <option key={m.memberId} value={m.memberId}>
                    {m.memberName} (@{m.username}) — [{m.dreamRank} • {m.dreamRating} RR]
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTransferModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting || !newOwnerId}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSubmitting ? "Memproses..." : "Transfer Kepemilikan"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Team Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Informasi Tim: ${team.name}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded">
              {formError}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-mono text-text-secondary block">Nama Tim</label>
            <Input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-text-secondary block">Tag Tim (#TAG)</label>
            <Input
              value={editForm.tag}
              onChange={(e) => setEditForm({ ...editForm, tag: e.target.value.toUpperCase() })}
              maxLength={6}
              className="text-xs font-mono uppercase"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-text-secondary block">Deskripsi</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows={3}
              maxLength={250}
              className="w-full bg-surface-dark border border-surface-border text-text-primary text-xs rounded p-2 focus:outline-none focus:border-surface-border-active"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="bg-persona-red hover:bg-persona-red-hover text-white"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Team Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Hapus Tim"
      >
        <div className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded">
              {formError}
            </div>
          )}

          <p className="text-xs text-text-secondary">
            Apakah Anda yakin ingin menghapus tim{" "}
            <strong className="text-text-primary">{team.name} (#{team.tag})</strong>? Semua anggota tim akan dilepas keanggotaannya dari tim ini.
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleDeleteSubmit}
              disabled={isSubmitting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isSubmitting ? "Menghapus..." : "Ya, Hapus Tim"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function calculateRankLabel(rating: number): string {
  if (rating >= 3500) return "GRANDMASTER";
  if (rating >= 3000) return "MASTER";
  if (rating >= 2500) return "DIAMOND";
  if (rating >= 2000) return "PLATINUM";
  if (rating >= 1500) return "GOLD";
  if (rating >= 1000) return "SILVER";
  return "BRONZE";
}
