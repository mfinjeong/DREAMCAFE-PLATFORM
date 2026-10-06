"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { TeamItem, MemberItem } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  Shield,
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  Crown,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { formatDateTime } from "@/lib/formatters";

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamItem | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form states
  const [teamForm, setTeamForm] = useState({
    name: "",
    tag: "",
    description: "",
    ownerId: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    tag: "",
    description: "",
  });

  const fetchTeams = useCallback(async () => {
    try {
      setErrorMessage(null);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/teams?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal memuat daftar tim");
      }
      setTeams(json.data);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan server");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery]);

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/members");
      const json = await res.json();
      if (res.ok && json.success) {
        setMembers(json.data);
        if (json.data.length > 0 && !teamForm.ownerId) {
          setTeamForm((prev) => ({ ...prev, ownerId: json.data[0].id }));
        }
      }
    } catch (err) {
      console.error("Gagal memuat daftar member untuk owner", err);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTeams();
  };

  const handleOpenCreate = () => {
    setFormError(null);
    setTeamForm({
      name: "",
      tag: "",
      description: "",
      ownerId: members[0]?.id || "",
    });
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name.trim() || !teamForm.tag.trim() || !teamForm.ownerId) {
      setFormError("Nama tim, Tag tim, dan Pemilik tim wajib diisi.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: teamForm.name.trim(),
          tag: teamForm.tag.trim().toUpperCase(),
          description: teamForm.description.trim() || undefined,
          ownerId: teamForm.ownerId,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal membuat tim");
      }

      setCreateModalOpen(false);
      fetchTeams();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (team: TeamItem) => {
    setSelectedTeam(team);
    setEditForm({
      name: team.name,
      tag: team.tag,
      description: team.description || "",
    });
    setFormError(null);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;

    try {
      setIsSubmitting(true);
      setFormError(null);

      const res = await fetch(`/api/teams/${selectedTeam.id}`, {
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
      fetchTeams();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = (team: TeamItem) => {
    setSelectedTeam(team);
    setFormError(null);
    setDeleteModalOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!selectedTeam) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/teams/${selectedTeam.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menghapus tim");
      }

      setDeleteModalOpen(false);
      fetchTeams();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Gagal menghapus tim");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 bg-persona-red persona-slash rounded-[1px]"></div>
            <h1 className="text-sm font-mono font-bold tracking-wider text-text-primary uppercase flex items-center gap-2">
              <span>Manajemen Tim & Clan</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-surface-dark border border-surface-border text-text-muted rounded">
                Esports Division
              </span>
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Daftar tim resmi DREAMCAFÉ untuk kompetisi komunitas, matchmaking, dan persiapan turnamen.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
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
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 bg-persona-red hover:bg-persona-red-hover text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Tim Baru</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface-card border border-surface-border p-3.5 rounded-[4px] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau #TAG tim..."
            className="pl-8 text-xs bg-surface-dark h-8"
          />
        </div>

        <div className="text-xs font-mono text-text-muted flex items-center gap-2">
          <span>Total Tim Terdaftar:</span>
          <span className="font-bold text-text-primary px-2 py-0.5 bg-surface-dark border border-surface-border rounded">
            {teams.length} Tim
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-950/30 border border-rose-800/40 rounded-[4px] flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="p-16 text-center bg-surface-card border border-surface-border rounded-[4px]">
          <RefreshCw className="w-6 h-6 animate-spin text-persona-red mx-auto mb-2" />
          <p className="text-xs text-text-secondary font-mono">Memuat direktori tim DREAMCAFÉ...</p>
        </div>
      ) : teams.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center bg-surface-card border border-surface-border rounded-[4px] space-y-3">
          <Shield className="w-8 h-8 text-text-muted mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-text-primary">Belum Ada Tim Terdaftar</h3>
            <p className="text-xs text-text-secondary mt-1">
              {searchQuery
                ? `Tidak ada tim yang cocok dengan kata kunci "${searchQuery}".`
                : "Mulai daftarkan tim esport pertama member untuk turnamen."}
            </p>
          </div>
          {searchQuery ? (
            <Button variant="outline" size="sm" onClick={() => setSearchQuery("")}>
              Hapus Pencarian
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={handleOpenCreate}>
              Buat Tim Sekarang
            </Button>
          )}
        </div>
      ) : (
        /* Team Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <div
              key={team.id}
              className="bg-surface-card border border-surface-border hover:border-surface-border-active transition-all p-4 rounded-[4px] flex flex-col justify-between group"
            >
              <div>
                {/* Header: Tag & Member Count */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-surface-dark border border-persona-blue/40 text-persona-blue">
                    #{team.tag}
                  </span>
                  <div className="flex items-center gap-1.5 text-text-muted font-mono text-[11px]">
                    <Users className="w-3.5 h-3.5 text-text-secondary" />
                    <span>{team.memberCount} Anggota</span>
                  </div>
                </div>

                {/* Team Name & Description */}
                <h3 className="text-sm font-bold text-text-primary group-hover:text-white transition-colors truncate">
                  {team.name}
                </h3>
                <p className="text-xs text-text-secondary mt-1 line-clamp-2 min-h-[32px]">
                  {team.description || "Tidak ada deskripsi tim."}
                </p>

                {/* Owner info */}
                <div className="mt-3.5 pt-3 border-t border-surface-border flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-text-muted text-[11px]">Owner:</span>
                    <span className="font-bold text-text-primary truncate max-w-[130px]">
                      {team.ownerName}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-text-muted">
                    @{team.ownerUsername}
                  </span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-text-muted flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {team.createdAt.slice(0, 10)}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(team)}
                    className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-dark rounded transition-colors"
                    title="Edit Tim"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenDelete(team)}
                    className="p-1.5 text-text-muted hover:text-rose-400 hover:bg-surface-dark rounded transition-colors"
                    title="Hapus Tim"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <Link href={`/teams/${team.id}`}>
                    <Button variant="outline" size="sm" className="h-7 text-xs flex items-center gap-1 px-2.5">
                      <span>Roster & Stats</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Daftarkan Tim / Clan Baru"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded">
              {formError}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-mono text-text-secondary block">
              Nama Tim <span className="text-persona-red">*</span>
            </label>
            <Input
              value={teamForm.name}
              onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
              placeholder="e.g. Garuda Cyber Squad"
              className="text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-text-secondary block">
              Tag Tim (#TAG) <span className="text-persona-red">* (2-6 Karakter Alfanumerik)</span>
            </label>
            <Input
              value={teamForm.tag}
              onChange={(e) => setTeamForm({ ...teamForm, tag: e.target.value.toUpperCase() })}
              placeholder="e.g. GCS"
              maxLength={6}
              className="text-xs font-mono uppercase"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-text-secondary block">
              Pemilik Tim (Owner) <span className="text-persona-red">*</span>
            </label>
            <select
              value={teamForm.ownerId}
              onChange={(e) => setTeamForm({ ...teamForm, ownerId: e.target.value })}
              className="w-full bg-surface-dark border border-surface-border text-text-primary text-xs rounded p-2 focus:outline-none focus:border-surface-border-active"
              required
            >
              {members.length === 0 ? (
                <option value="">Belum ada member terdaftar</option>
              ) : (
                members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} (@{m.username}) — {m.memberCode} [{m.dreamRank}]
                  </option>
                ))
              )}
            </select>
            <p className="text-[11px] text-text-muted mt-0.5">
              Owner akan otomatis dimasukkan ke dalam daftar anggota dengan role OWNER.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-text-secondary block">
              Deskripsi Tim (Opsional)
            </label>
            <textarea
              value={teamForm.description}
              onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
              placeholder="Visi atau deskripsi clan tim..."
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
              onClick={() => setCreateModalOpen(false)}
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
              {isSubmitting ? "Menyimpan..." : "Buat Tim"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Team Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Tim: ${selectedTeam?.name}`}
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

      {/* Delete Team Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Konfirmasi Hapus Tim"
      >
        <div className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded">
              {formError}
            </div>
          )}

          <p className="text-xs text-text-secondary">
            Apakah Anda yakin ingin menghapus tim{" "}
            <span className="font-bold text-text-primary">
              {selectedTeam?.name} (#{selectedTeam?.tag})
            </span>
            ? Tindakan ini akan menghapus susunan roster tim ini, namun akun member yang bersangkutan
            tetap utuh dan aman.
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
