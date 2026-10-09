"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  TournamentDetailDTO,
  TournamentStatus,
  TournamentRegistrationDTO,
} from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatRupiah, formatDateTime } from "@/lib/formatters";
import {
  Trophy,
  Users,
  Gamepad2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  XCircle,
  ArrowLeft,
  RefreshCw,
  ShieldAlert,
  UserCheck,
  UserX,
  Swords,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TournamentDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const tournamentId = resolvedParams.id;

  const [tournament, setTournament] = useState<TournamentDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Actor Member
  const [members, setMembers] = useState<Array<{ id: string; fullName: string; username: string }>>([]);
  const [selectedActorId, setSelectedActorId] = useState<string>("");

  // Teams owned by actor
  const [availableTeams, setAvailableTeams] = useState<Array<{ id: string; name: string; tag: string; ownerId: string }>>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  // Modals & States
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);

  const loadTournament = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`);
      const json = await res.json();
      if (json.success) {
        setTournament(json.data);
      } else {
        setError(json.message || "Gagal memuat detail turnamen");
      }
    } catch {
      setError("Kesalahan koneksi saat memuat detail turnamen");
    }
  }, [tournamentId]);

  const loadMembersAndTeams = useCallback(async () => {
    try {
      const mRes = await fetch("/api/members");
      const mJson = await mRes.json();
      if (mJson.success && mJson.data.length > 0) {
        setMembers(mJson.data);
        if (!selectedActorId) {
          setSelectedActorId(mJson.data[0].id);
        }
      }

      const tRes = await fetch("/api/teams");
      const tJson = await tRes.json();
      if (tJson.success) {
        setAvailableTeams(tJson.data);
      }
    } catch {
      // ignore
    }
  }, [selectedActorId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadTournament(), loadMembersAndTeams()]).finally(() => setLoading(false));
  }, [loadTournament, loadMembersAndTeams]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setActionError(null);
    setActionSuccess(null);
    await loadTournament();
    setRefreshing(false);
  };

  // Lifecycle Action Handlers
  const handleLifecycleAction = async (actionPath: string, successMsg: string) => {
    if (!selectedActorId) {
      setActionError("Pilih aktor member terlebih dahulu");
      return;
    }

    setSubmittingAction(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/${actionPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorMemberId: selectedActorId }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setActionError(json.message || `Gagal menjalankan aksi ${actionPath}`);
        return;
      }

      setActionSuccess(successMsg);
      await loadTournament();
    } catch {
      setActionError("Terjadi kesalahan jaringan saat menjalankan aksi");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Team Registration
  const handleRegisterTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId || !selectedActorId) {
      setActionError("Pilih tim dan aktor terlebih dahulu");
      return;
    }

    setSubmittingAction(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: selectedTeamId,
          actorMemberId: selectedActorId,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setActionError(json.message || "Gagal mendaftarkan tim");
        return;
      }

      setActionSuccess("Tim berhasil didaftarkan ke turnamen!");
      setIsRegisterModalOpen(false);
      setSelectedTeamId("");
      await loadTournament();
    } catch {
      setActionError("Terjadi kesalahan jaringan saat mendaftarkan tim");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Team Withdrawal
  const handleWithdrawTeam = async (teamId: string) => {
    if (!selectedActorId) {
      setActionError("Pilih aktor member terlebih dahulu");
      return;
    }

    if (!confirm("Apakah Anda yakin ingin membatalkan pendaftaran tim ini?")) {
      return;
    }

    setSubmittingAction(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/registrations/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          actorMemberId: selectedActorId,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setActionError(json.message || "Gagal membatalkan registrasi tim");
        return;
      }

      setActionSuccess("Registrasi tim berhasil ditarik (status: WITHDRAWN).");
      await loadTournament();
    } catch {
      setActionError("Terjadi kesalahan jaringan saat menarik registrasi");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Filter available teams owned by current actor
  const ownedTeams = availableTeams.filter((t) => t.ownerId === selectedActorId);

  const getStatusBadge = (status: TournamentStatus) => {
    switch (status) {
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-semibold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" /> Draft
          </span>
        );
      case "REGISTRATION_OPEN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold uppercase tracking-wider animate-pulse">
            <CheckCircle2 className="w-3.5 h-3.5" /> Registration Open
          </span>
        );
      case "REGISTRATION_CLOSED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-blue-500/15 text-blue-400 border border-blue-500/30 text-xs font-semibold uppercase tracking-wider">
            <AlertCircle className="w-3.5 h-3.5" /> Registration Closed
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-purple-500/15 text-purple-400 border border-purple-500/30 text-xs font-semibold uppercase tracking-wider">
            <Play className="w-3.5 h-3.5" /> In Progress
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-teal-500/15 text-teal-300 border border-teal-500/30 text-xs font-semibold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-semibold uppercase tracking-wider">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-text-muted text-xs">
        <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-persona-red" />
        Memuat detail turnamen...
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="p-6 bg-surface border border-surface-border rounded-[8px] space-y-3">
        <div className="flex items-center gap-2 text-red-400">
          <ShieldAlert className="w-5 h-5" />
          <h3 className="text-sm font-bold">Turnamen Tidak Ditemukan</h3>
        </div>
        <p className="text-xs text-text-muted">{error || "Data turnamen tidak tersedia di database."}</p>
        <Link href="/tournaments">
          <Button variant="secondary" size="sm" className="text-xs">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Kembali ke Daftar Turnamen
          </Button>
        </Link>
      </div>
    );
  }

  const capacityPercent = Math.min(
    100,
    Math.round((tournament.confirmedTeamCount / tournament.maxTeams) * 100)
  );

  return (
    <div className="space-y-4">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href="/tournaments">
            <Button variant="secondary" size="sm" className="text-xs flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali
            </Button>
          </Link>
          <div className="w-1.5 h-4 bg-persona-red persona-slash" />
          <h2 className="text-sm font-bold text-text-primary tracking-tight font-sans truncate">
            {tournament.name}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Actor Member Selector */}
          <div className="flex items-center gap-1.5 bg-surface border border-surface-border rounded-[6px] px-2.5 py-1">
            <span className="text-[10px] uppercase font-mono text-text-dim">Aktor Member:</span>
            <select
              value={selectedActorId}
              onChange={(e) => setSelectedActorId(e.target.value)}
              className="bg-transparent text-xs text-text-primary focus:outline-none"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id} className="bg-surface text-text-primary">
                  {m.fullName} (@{m.username})
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-[6px] text-xs text-red-400 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-[6px] text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Hero Overview Card */}
      <div className="relative p-5 bg-surface border border-surface-border rounded-[8px] overflow-hidden space-y-4">
        <div
          className="absolute top-0 right-0 w-4 h-4 bg-persona-red"
          style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
        />

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              {getStatusBadge(tournament.status)}
              <span className="text-xs font-mono text-text-dim">
                Best of {tournament.bestOf}
              </span>
              <span className="text-xs font-mono text-text-dim">
                Format: {tournament.format || "SINGLE_ELIMINATION"}
              </span>
            </div>

            <h1 className="text-lg font-bold text-text-primary">{tournament.name}</h1>
            <p className="text-xs text-text-muted">
              Penyelenggara: <span className="text-text-primary font-medium">{tournament.createdByName}</span> • Slug:{" "}
              <code className="text-persona-red font-mono">{tournament.slug}</code>
            </p>

            {tournament.description && (
              <p className="text-xs text-text-secondary pt-1">{tournament.description}</p>
            )}
          </div>

          {/* Game Pill */}
          <div className="p-3 bg-background rounded-[6px] border border-surface-border flex items-center gap-3">
            <Gamepad2 className="w-6 h-6 text-persona-red" />
            <div>
              <div className="text-xs font-bold text-text-primary">{tournament.gameTitle}</div>
              <div className="text-[11px] text-text-muted">{tournament.gameGenre}</div>
            </div>
          </div>
        </div>

        {/* Schedule & Rules Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-background rounded-[6px] border border-surface-border text-xs">
          <div>
            <span className="text-[10px] uppercase font-mono text-text-dim block">
              Pendaftaran Dibuka
            </span>
            <span className="text-text-primary font-mono text-[11px]">
              {formatDateTime(tournament.registrationStart)}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-text-dim block">
              Pendaftaran Ditutup
            </span>
            <span className="text-text-primary font-mono text-[11px]">
              {formatDateTime(tournament.registrationEnd)}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-text-dim block">
              Mulai Turnamen
            </span>
            <span className="text-text-primary font-mono text-[11px]">
              {formatDateTime(tournament.startAt)}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-text-dim block">
              Prize Pool & Entry Fee
            </span>
            <span className="font-bold font-mono text-persona-red">
              {formatRupiah(tournament.prizePool ?? 0)}
            </span>{" "}
            /{" "}
            <span className="text-text-muted font-mono">
              {formatRupiah(tournament.entryFee ?? 0)}
            </span>
          </div>
        </div>

        {/* Capacity Bar */}
        <div>
          <div className="flex justify-between items-center text-xs font-mono mb-1.5">
            <span className="text-text-muted">
              Kapasitas Turnamen (Min {tournament.minTeams} - Max {tournament.maxTeams} Tim):
            </span>
            <span
              className={
                tournament.isCapacityFull ? "text-red-400 font-bold" : "text-text-primary font-bold"
              }
            >
              {tournament.confirmedTeamCount} / {tournament.maxTeams} Tim Terkonfirmasi ({capacityPercent}%)
            </span>
          </div>
          <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-surface-border">
            <div
              className={`h-full ${tournament.isCapacityFull ? "bg-red-500" : "bg-persona-red"}`}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
        </div>

        {/* Lifecycle Action Buttons */}
        <div className="pt-3 border-t border-surface-border flex flex-wrap items-center justify-between gap-2.5">
          <div className="text-xs text-text-muted font-mono flex items-center gap-1.5">
            <span>Aksi Lifecycle:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* DRAFT ACTIONS */}
            {tournament.status === "DRAFT" && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={submittingAction}
                  onClick={() => handleLifecycleAction("open-registration", "Pendaftaran turnamen resmi dibuka!")}
                  className="text-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Buka Pendaftaran
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={submittingAction}
                  onClick={() => handleLifecycleAction("cancel", "Turnamen berhasil dibatalkan")}
                  className="text-xs flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Batalkan Turnamen
                </Button>
              </>
            )}

            {/* REGISTRATION_OPEN ACTIONS */}
            {tournament.status === "REGISTRATION_OPEN" && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsRegisterModalOpen(true)}
                  disabled={tournament.isCapacityFull || submittingAction}
                  className="text-xs flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Daftarkan Tim
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={submittingAction}
                  onClick={() => handleLifecycleAction("close-registration", "Pendaftaran turnamen telah ditutup")}
                  className="text-xs flex items-center gap-1.5"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  Tutup Pendaftaran
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={submittingAction}
                  onClick={() => handleLifecycleAction("cancel", "Turnamen berhasil dibatalkan")}
                  className="text-xs flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Batalkan Turnamen
                </Button>
              </>
            )}

            {/* REGISTRATION_CLOSED ACTIONS */}
            {tournament.status === "REGISTRATION_CLOSED" && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={tournament.confirmedTeamCount < tournament.minTeams || submittingAction}
                  onClick={() => handleLifecycleAction("start", "Turnamen resmi dimulai!")}
                  className="text-xs flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  Mulai Turnamen
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={submittingAction}
                  onClick={() => handleLifecycleAction("cancel", "Turnamen berhasil dibatalkan")}
                  className="text-xs flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Batalkan Turnamen
                </Button>
              </>
            )}

            {/* IN_PROGRESS ACTIONS */}
            {tournament.status === "IN_PROGRESS" && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={submittingAction}
                  onClick={() => handleLifecycleAction("complete", "Turnamen telah selesai secara resmi!")}
                  className="text-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Selesaikan Turnamen
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={submittingAction}
                  onClick={() => handleLifecycleAction("cancel", "Turnamen berhasil dibatalkan")}
                  className="text-xs flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Batalkan Turnamen
                </Button>
              </>
            )}

            {/* COMPLETED OR CANCELLED (READ ONLY) */}
            {(tournament.status === "COMPLETED" || tournament.status === "CANCELLED") && (
              <span className="text-xs font-mono text-text-dim px-2.5 py-1 bg-background border border-surface-border rounded-[4px]">
                Turnamen Berstatus Final (Read-only)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Registered Teams Section */}
      <div className="p-4 bg-surface border border-surface-border rounded-[8px] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-persona-red" />
            <h3 className="text-sm font-bold text-text-primary">
              Daftar Tim Terdaftar ({tournament.registrations.length})
            </h3>
          </div>

          {tournament.status === "REGISTRATION_OPEN" && !tournament.isCapacityFull && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsRegisterModalOpen(true)}
              className="text-xs flex items-center gap-1"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Daftarkan Tim Baru
            </Button>
          )}
        </div>

        {tournament.registrations.length === 0 ? (
          <div className="p-8 text-center bg-background rounded-[6px] border border-surface-border text-xs text-text-muted">
            Belum ada tim yang mendaftar pada turnamen ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {tournament.registrations.map((reg) => {
              const isOwnerCurrentActor = reg.ownerId === selectedActorId;
              const canWithdraw =
                tournament.status === "REGISTRATION_OPEN" &&
                reg.status === "CONFIRMED" &&
                isOwnerCurrentActor;

              return (
                <div
                  key={reg.id}
                  className={`p-3.5 rounded-[6px] border text-xs flex flex-col justify-between ${
                    reg.status === "CONFIRMED"
                      ? "bg-background border-surface-border"
                      : "bg-surface-muted/50 border-surface-border/50 opacity-70"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-p3r-blue font-bold text-xs">
                        [{reg.teamTag}]
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-[4px] text-[10px] font-semibold uppercase ${
                          reg.status === "CONFIRMED"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : reg.status === "WITHDRAWN"
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : "bg-red-500/15 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {reg.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-text-primary text-sm">{reg.teamName}</h4>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        Captain/Owner: <span className="text-text-primary">{reg.ownerName}</span>
                      </p>
                      <p className="text-[10px] text-text-dim font-mono mt-0.5">
                        Roster: {reg.memberCount} pemain • Didaftarkan: {formatDateTime(reg.createdAt)}
                      </p>
                    </div>
                  </div>

                  {canWithdraw && (
                    <div className="pt-2.5 mt-2.5 border-t border-surface-border flex justify-end">
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={submittingAction}
                        onClick={() => handleWithdrawTeam(reg.teamId)}
                        className="text-[11px] flex items-center gap-1 py-1"
                      >
                        <UserX className="w-3 h-3" />
                        Tarik Registrasi
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tournament Matches Foundation */}
      <div className="p-4 bg-surface border border-surface-border rounded-[8px] space-y-3">
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4 text-persona-red" />
          <h3 className="text-sm font-bold text-text-primary">
            Pertandingan Kompetitif Turnamen ({tournament.matches.length})
          </h3>
        </div>

        {tournament.matches.length === 0 ? (
          <div className="p-8 text-center bg-background rounded-[6px] border border-surface-border text-xs text-text-muted">
            Belum ada pertandingan kompetitif yang dijadwalkan.
            <br />
            <span className="text-[11px] text-text-dim">
              (Braket dan pembuatan pertandingan otomatis akan diimplementasikan pada Fase 2).
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {tournament.matches.map((m) => (
              <div
                key={m.id}
                className="p-3 bg-background border border-surface-border rounded-[6px] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-text-dim text-[11px]">
                    R{m.tournamentRound ?? 1} M{m.tournamentMatchNumber ?? 1}
                  </span>
                  <span className="font-bold text-text-primary">
                    {m.teamA.name} vs {m.teamB.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-[4px] bg-surface-muted text-text-muted text-[10px] font-mono">
                    {m.status}
                  </span>
                  <span className="font-mono text-[11px] text-text-dim">
                    {formatDateTime(m.scheduledAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Registrasi Tim */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Daftarkan Tim ke Turnamen"
        subtitle={`Pilih tim Anda untuk bertanding di ${tournament.name}`}
        maxWidth="md"
      >
        <form onSubmit={handleRegisterTeam} className="p-4 space-y-3.5 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-text-muted mb-1">
              Aktor Pendaftar (Owner Tim)
            </label>
            <div className="p-2.5 bg-background border border-surface-border rounded-[6px] text-text-primary font-medium">
              {members.find((m) => m.id === selectedActorId)?.fullName || "Pilih aktor"} (
              @{members.find((m) => m.id === selectedActorId)?.username})
            </div>
            <p className="text-[10px] text-text-dim mt-1">
              Hanya owner tim yang berhak mendaftarkan tim ke turnamen.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-text-muted mb-1">
              Pilih Tim yang Dimiliki <span className="text-persona-red">*</span>
            </label>
            {ownedTeams.length === 0 ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-[6px] text-amber-400 text-[11px]">
                Aktor ini belum memiliki tim terdaftar. Silakan ganti aktor member atau buat tim baru di menu Tim & Clan.
              </div>
            ) : (
              <select
                required
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-background border border-surface-border rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-persona-red"
              >
                <option value="">-- Pilih Tim --</option>
                {ownedTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} [{t.tag}]
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="p-2.5 bg-background rounded-[6px] border border-surface-border text-[11px] space-y-1 text-text-muted">
            <div className="flex justify-between">
              <span>Game Turnamen:</span>
              <span className="text-text-primary font-medium">{tournament.gameTitle}</span>
            </div>
            <div className="flex justify-between">
              <span>Biaya Slot:</span>
              <span className="text-text-primary font-mono">{formatRupiah(tournament.entryFee ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Sisa Slot:</span>
              <span className="text-emerald-400 font-mono">
                {tournament.maxTeams - tournament.confirmedTeamCount} slot tersedia
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-surface-border flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsRegisterModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submittingAction || !selectedTeamId}
            >
              {submittingAction ? "Mendaftarkan..." : "Konfirmasi Registrasi"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
