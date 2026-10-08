"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { CompetitiveMatchDetailDTO } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  ArrowLeft,
  Crosshair,
  RefreshCw,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  XCircle,
  FileText,
  Users,
  Trophy,
  Shield,
} from "lucide-react";
import { formatDateTime } from "@/lib/formatters";

export default function CompetitiveMatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [match, setMatch] = useState<CompetitiveMatchDetailDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected Acting Actor: Default to Team A Owner or Team B Owner
  const [selectedActorRole, setSelectedActorRole] = useState<"TEAM_A" | "TEAM_B">("TEAM_A");

  // Action Modals
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [submitResultModalOpen, setSubmitResultModalOpen] = useState(false);
  const [resultChoice, setResultChoice] = useState("TEAM_A_WIN");
  const [resultNote, setResultNote] = useState("");

  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyResultChoice, setVerifyResultChoice] = useState("TEAM_A_WIN");
  const [verifyNote, setVerifyNote] = useState("");

  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const fetchMatch = useCallback(async () => {
    try {
      setErrorMessage(null);
      const res = await fetch(`/api/competitive-matches/${id}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal memuat detail pertandingan");
      }
      setMatch(json.data);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan server");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchMatch();
  };

  const getActorMemberId = () => {
    if (!match) return "";
    return selectedActorRole === "TEAM_A" ? match.teamA.ownerId : match.teamB.ownerId;
  };

  const handleScheduleSubmit = async () => {
    if (!match) return;
    setIsActionSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/competitive-matches/${match.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorMemberId: match.teamB.ownerId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal mengonfirmasi jadwal");
      }
      await fetchMatch();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleStartSubmit = async () => {
    if (!match) return;
    setIsActionSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/competitive-matches/${match.id}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorMemberId: getActorMemberId() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal memulai pertandingan");
      }
      await fetchMatch();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!match) return;
    setIsActionSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/competitive-matches/${match.id}/submit-result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorMemberId: getActorMemberId(),
          result: resultChoice,
          note: resultNote.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal mensubmit hasil");
      }
      setSubmitResultModalOpen(false);
      setResultNote("");
      await fetchMatch();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleVerifyDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!match) return;
    setIsActionSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/competitive-matches/${match.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorMemberId: getActorMemberId(),
          result: verifyResultChoice,
          note: verifyNote.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal memverifikasi pertandingan");
      }
      setVerifyModalOpen(false);
      await fetchMatch();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!match) return;
    if (!disputeReason.trim()) {
      setActionError("Masukkan alasan dispute");
      return;
    }
    setIsActionSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/competitive-matches/${match.id}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorMemberId: getActorMemberId(),
          reason: disputeReason.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal mengajukan dispute");
      }
      setDisputeModalOpen(false);
      setDisputeReason("");
      await fetchMatch();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleCancelSubmit = async () => {
    if (!match) return;
    setIsActionSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/competitive-matches/${match.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorMemberId: getActorMemberId() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal membatalkan pertandingan");
      }
      setCancelModalOpen(false);
      await fetchMatch();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsActionSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-text-muted font-mono text-xs">
        Memuat detail official match...
      </div>
    );
  }

  if (errorMessage || !match) {
    return (
      <div className="p-8 text-center bg-surface-card border border-surface-border rounded-[4px] space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
        <div className="text-xs text-rose-300 font-mono">
          {errorMessage || "Pertandingan tidak ditemukan"}
        </div>
        <Link href="/competitive-matches">
          <Button variant="outline" size="sm" className="text-xs">
            Kembali ke Daftar Pertandingan
          </Button>
        </Link>
      </div>
    );
  }

  const teamAParticipants = match.participants.filter((p) => p.teamId === match.teamAId);
  const teamBParticipants = match.participants.filter((p) => p.teamId === match.teamBId);

  const teamASubmission = match.submissions.find((s) => s.submittedByTeamId === match.teamAId);
  const teamBSubmission = match.submissions.find((s) => s.submittedByTeamId === match.teamBId);

  let statusBadgeClass = "bg-surface-dark text-text-muted border-surface-border";
  if (match.status === "LIVE") {
    statusBadgeClass = "bg-rose-950/60 text-rose-400 border-rose-800/80 animate-pulse";
  } else if (match.status === "SCHEDULED") {
    statusBadgeClass = "bg-persona-blue/20 text-persona-blue border-persona-blue/40";
  } else if (match.status === "PENDING") {
    statusBadgeClass = "bg-amber-950/50 text-amber-400 border-amber-800/50";
  } else if (match.status === "RESULT_PENDING") {
    statusBadgeClass = "bg-purple-950/50 text-purple-300 border-purple-800/50";
  } else if (match.status === "VERIFIED") {
    statusBadgeClass = "bg-emerald-950/50 text-emerald-400 border-emerald-800/50";
  } else if (match.status === "DISPUTED") {
    statusBadgeClass = "bg-orange-950/60 text-orange-400 border-orange-800/80 font-bold";
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/competitive-matches"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Competitive Matches</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Acting Actor Toggle for Multi-Role Validation */}
          <div className="flex items-center gap-1.5 bg-surface-dark border border-surface-border px-2 py-1 rounded text-xs font-mono">
            <span className="text-text-muted text-[10px]">Aktor Operasi:</span>
            <button
              type="button"
              onClick={() => setSelectedActorRole("TEAM_A")}
              className={`px-1.5 py-0.5 rounded text-[10px] ${
                selectedActorRole === "TEAM_A"
                  ? "bg-persona-blue text-white font-bold"
                  : "text-text-secondary hover:text-white"
              }`}
            >
              #{match.teamA.tag} Owner
            </button>
            <button
              type="button"
              onClick={() => setSelectedActorRole("TEAM_B")}
              className={`px-1.5 py-0.5 rounded text-[10px] ${
                selectedActorRole === "TEAM_B"
                  ? "bg-persona-red text-white font-bold"
                  : "text-text-secondary hover:text-white"
              }`}
            >
              #{match.teamB.tag} Owner
            </button>
          </div>

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
        </div>
      </div>

      {actionError && (
        <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Versus Matchup Banner */}
      <div className="p-6 bg-surface-card border border-surface-border rounded-[4px] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border pb-4">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono px-2.5 py-1 rounded border uppercase font-bold ${statusBadgeClass}`}>
              {match.status}
            </span>
            <span className="text-xs font-mono text-text-muted bg-surface-dark border border-surface-border px-2 py-1 rounded">
              BEST OF {match.bestOf}
            </span>
            {match.sourceScrimId && (
              <span className="text-xs font-mono text-persona-blue bg-persona-blue/10 border border-persona-blue/30 px-2 py-1 rounded">
                Promoted from Scrim
              </span>
            )}
          </div>

          <div className="text-xs font-mono text-text-secondary flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-text-muted" />
            <span>Jadwal: {formatDateTime(match.scheduledAt)}</span>
          </div>
        </div>

        {/* Big Versus Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6 py-2">
          {/* Team A */}
          <div className="p-4 bg-surface-dark border border-surface-border/60 rounded-[4px] text-center md:text-left space-y-1.5">
            <div className="text-[10px] text-persona-blue font-mono font-bold tracking-wider uppercase">
              Home Team (Tim A)
            </div>
            <div className="text-lg font-bold text-text-primary flex items-center justify-center md:justify-start gap-2">
              <span className="font-mono text-persona-blue">#{match.teamA.tag}</span>
              <span>{match.teamA.name}</span>
            </div>
            <div className="text-xs text-text-muted font-mono">
              Owner: {match.teamA.ownerName} (@{match.teamA.ownerUsername})
            </div>
          </div>

          {/* Versus Center Game Info */}
          <div className="text-center space-y-2">
            <div className="inline-block px-3 py-1 bg-surface-dark border border-surface-border text-text-muted font-mono text-xs font-bold rounded">
              VS
            </div>
            <div className="flex items-center justify-center gap-1.5 text-sm font-bold text-text-primary font-mono">
              <Trophy className="w-4 h-4 text-persona-blue" />
              <span>{match.game.title}</span>
            </div>
            <div className="text-[11px] text-text-muted font-mono">
              Genre: {match.game.genre}
            </div>
          </div>

          {/* Team B */}
          <div className="p-4 bg-surface-dark border border-surface-border/60 rounded-[4px] text-center md:text-right space-y-1.5">
            <div className="text-[10px] text-persona-red font-mono font-bold tracking-wider uppercase">
              Away Team (Tim B)
            </div>
            <div className="text-lg font-bold text-text-primary flex items-center justify-center md:justify-end gap-2">
              <span>{match.teamB.name}</span>
              <span className="font-mono text-persona-red">#{match.teamB.tag}</span>
            </div>
            <div className="text-xs text-text-muted font-mono">
              Owner: {match.teamB.ownerName} (@{match.teamB.ownerUsername})
            </div>
          </div>
        </div>

        {/* Verification Result Banner */}
        {match.status === "VERIFIED" && (
          <div className="p-4 bg-emerald-950/30 border border-emerald-800/50 rounded-[4px] flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wide">
                Pertandingan Terverifikasi Resmi
              </div>
              <div className="text-xs text-text-primary mt-0.5">
                Hasil:{" "}
                <strong className="text-emerald-300 font-mono">
                  {match.result === "DRAW"
                    ? "DRAW (SERI)"
                    : match.result === "NO_CONTEST"
                    ? "NO CONTEST"
                    : match.winnerTeam
                    ? `${match.winnerTeam.name} (#${match.winnerTeam.tag}) MENANG`
                    : match.result}
                </strong>
                {match.completedAt && (
                  <span className="text-text-muted font-mono ml-2 text-[11px]">
                    (Selesai: {formatDateTime(match.completedAt)})
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Disputed Banner */}
        {match.status === "DISPUTED" && (
          <div className="p-4 bg-orange-950/30 border border-orange-800/50 rounded-[4px] flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-400 shrink-0" />
            <div>
              <div className="text-xs font-bold font-mono text-orange-400 uppercase tracking-wide">
                Status Sengketa (Dispute)
              </div>
              <div className="text-xs text-orange-200 mt-0.5">
                Kedua tim mensubmit hasil yang bertolak belakang. Harap tinjau kembali submission masing-masing atau verifikasi langsung.
              </div>
            </div>
          </div>
        )}

        {/* Match Action Bar */}
        <div className="pt-2 border-t border-surface-border flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-text-muted font-mono">
            {match.startedAt && <span>Dimulai: {formatDateTime(match.startedAt)}</span>}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* PENDING ACTIONS */}
            {match.status === "PENDING" && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleScheduleSubmit}
                  disabled={isActionSubmitting}
                  className="bg-persona-blue hover:bg-persona-blue-hover text-white text-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Konfirmasi Jadwal (Accept)</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCancelModalOpen(true)}
                  disabled={isActionSubmitting}
                  className="text-xs text-rose-400 hover:text-rose-300 border-rose-900/60"
                >
                  Batalkan Match
                </Button>
              </>
            )}

            {/* SCHEDULED ACTIONS */}
            {match.status === "SCHEDULED" && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleStartSubmit}
                  disabled={isActionSubmitting}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs flex items-center gap-1.5"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Mulai Match (LIVE)</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCancelModalOpen(true)}
                  disabled={isActionSubmitting}
                  className="text-xs text-rose-400 hover:text-rose-300 border-rose-900/60"
                >
                  Batalkan Match
                </Button>
              </>
            )}

            {/* LIVE / RESULT_PENDING / DISPUTED ACTIONS */}
            {(match.status === "LIVE" ||
              match.status === "RESULT_PENDING" ||
              match.status === "DISPUTED") && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setSubmitResultModalOpen(true)}
                  disabled={isActionSubmitting}
                  className="bg-persona-blue hover:bg-persona-blue-hover text-white text-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Submit Hasil ({selectedActorRole === "TEAM_A" ? match.teamA.tag : match.teamB.tag})</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVerifyModalOpen(true)}
                  disabled={isActionSubmitting}
                  className="text-xs border-emerald-800 text-emerald-400 hover:bg-emerald-950/40"
                >
                  Verifikasi Langsung
                </Button>

                {match.status !== "DISPUTED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDisputeModalOpen(true)}
                    disabled={isActionSubmitting}
                    className="text-xs border-orange-800 text-orange-400 hover:bg-orange-950/40"
                  >
                    Ajukan Dispute
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCancelModalOpen(true)}
                  disabled={isActionSubmitting}
                  className="text-xs text-rose-400 hover:text-rose-300 border-rose-900/60"
                >
                  Batalkan Match
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Roster & Submissions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roster Partisipan */}
        <div className="p-4 bg-surface-card border border-surface-border rounded-[4px] space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <h2 className="text-xs font-mono font-bold tracking-wider text-text-primary uppercase flex items-center gap-2">
              <Users className="w-4 h-4 text-persona-blue" />
              <span>Roster Peserta Pertandingan</span>
            </h2>
            <span className="text-[10px] font-mono text-text-muted">
              {match.participants.length} Terdaftar
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Team A Roster */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono font-bold text-persona-blue uppercase">
                #{match.teamA.tag} Roster
              </div>
              {teamAParticipants.length === 0 ? (
                <div className="text-[11px] text-text-muted font-mono p-3 bg-surface-dark rounded">
                  Belum ada peserta didaftarkan
                </div>
              ) : (
                <div className="space-y-1.5">
                  {teamAParticipants.map((p) => (
                    <div
                      key={p.id}
                      className="p-2 bg-surface-dark border border-surface-border rounded text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-text-primary">{p.memberName}</div>
                        <div className="text-[10px] text-text-muted font-mono">{p.memberCode}</div>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-card border border-surface-border text-persona-blue font-bold">
                        {p.dreamRank}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Team B Roster */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono font-bold text-persona-red uppercase">
                #{match.teamB.tag} Roster
              </div>
              {teamBParticipants.length === 0 ? (
                <div className="text-[11px] text-text-muted font-mono p-3 bg-surface-dark rounded">
                  Belum ada peserta didaftarkan
                </div>
              ) : (
                <div className="space-y-1.5">
                  {teamBParticipants.map((p) => (
                    <div
                      key={p.id}
                      className="p-2 bg-surface-dark border border-surface-border rounded text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-text-primary">{p.memberName}</div>
                        <div className="text-[10px] text-text-muted font-mono">{p.memberCode}</div>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-card border border-surface-border text-persona-red font-bold">
                        {p.dreamRank}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submissions Panel */}
        <div className="p-4 bg-surface-card border border-surface-border rounded-[4px] space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <h2 className="text-xs font-mono font-bold tracking-wider text-text-primary uppercase flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Verifikasi Submisi Hasil</span>
            </h2>
            <span className="text-[10px] font-mono text-text-muted">
              {match.submissions.length} / 2 Tim Telah Submit
            </span>
          </div>

          <div className="space-y-3">
            {/* Team A Submission */}
            <div className="p-3 bg-surface-dark border border-surface-border rounded-[4px] space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-persona-blue">
                  Submisi #{match.teamA.tag}
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                    teamASubmission
                      ? "text-emerald-400 border-emerald-800 bg-emerald-950/40"
                      : "text-text-muted border-surface-border"
                  }`}
                >
                  {teamASubmission ? teamASubmission.result : "BELUM SUBMIT"}
                </span>
              </div>
              {teamASubmission ? (
                <div className="text-[11px] text-text-secondary space-y-0.5">
                  <div>Oleh: {teamASubmission.submittedByName}</div>
                  {teamASubmission.note && (
                    <div className="italic text-text-muted">Catatan: &ldquo;{teamASubmission.note}&rdquo;</div>
                  )}
                  <div className="text-[10px] text-text-muted font-mono">
                    Waktu: {formatDateTime(teamASubmission.createdAt)}
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-text-muted italic">
                  Menunggu laporan hasil dari owner Tim A...
                </div>
              )}
            </div>

            {/* Team B Submission */}
            <div className="p-3 bg-surface-dark border border-surface-border rounded-[4px] space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-persona-red">
                  Submisi #{match.teamB.tag}
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                    teamBSubmission
                      ? "text-emerald-400 border-emerald-800 bg-emerald-950/40"
                      : "text-text-muted border-surface-border"
                  }`}
                >
                  {teamBSubmission ? teamBSubmission.result : "BELUM SUBMIT"}
                </span>
              </div>
              {teamBSubmission ? (
                <div className="text-[11px] text-text-secondary space-y-0.5">
                  <div>Oleh: {teamBSubmission.submittedByName}</div>
                  {teamBSubmission.note && (
                    <div className="italic text-text-muted">Catatan: &ldquo;{teamBSubmission.note}&rdquo;</div>
                  )}
                  <div className="text-[10px] text-text-muted font-mono">
                    Waktu: {formatDateTime(teamBSubmission.createdAt)}
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-text-muted italic">
                  Menunggu laporan hasil dari owner Tim B...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Result Modal */}
      <Modal
        isOpen={submitResultModalOpen}
        onClose={() => setSubmitResultModalOpen(false)}
        title={`Submit Hasil Match (${selectedActorRole === "TEAM_A" ? match.teamA.name : match.teamB.name})`}
      >
        <form onSubmit={handleSubmitResult} className="space-y-4">
          {actionError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded">
              {actionError}
            </div>
          )}

          <div>
            <label className="text-[10px] font-mono text-text-muted uppercase block mb-1">
              Hasil Pertandingan Menurut Tim Anda *
            </label>
            <select
              value={resultChoice}
              onChange={(e) => setResultChoice(e.target.value)}
              className="w-full h-8 text-xs bg-surface-dark border border-surface-border rounded px-2 text-text-primary focus:outline-none focus:border-persona-blue"
              required
            >
              <option value="TEAM_A_WIN">#{match.teamA.tag} Menang (TEAM_A_WIN)</option>
              <option value="TEAM_B_WIN">#{match.teamB.tag} Menang (TEAM_B_WIN)</option>
              <option value="DRAW">Seri / Seimbang (DRAW)</option>
              <option value="NO_CONTEST">No Contest / Batal Bertanding (NO_CONTEST)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono text-text-muted uppercase block mb-1">
              Catatan / Bukti Skor (Opsional)
            </label>
            <textarea
              value={resultNote}
              onChange={(e) => setResultNote(e.target.value)}
              placeholder="Skor match, map win count, dll..."
              className="w-full h-16 text-xs bg-surface-dark border border-surface-border rounded p-2 text-text-primary focus:outline-none focus:border-persona-blue resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSubmitResultModalOpen(false)}
              disabled={isActionSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isActionSubmitting}
              className="bg-persona-blue hover:bg-persona-blue-hover text-white"
            >
              {isActionSubmitting ? "Mengirim..." : "Submit Hasil"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Verify Direct Modal */}
      <Modal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        title="Verifikasi Langsung Pertandingan"
      >
        <form onSubmit={handleVerifyDirect} className="space-y-4">
          <p className="text-xs text-text-secondary">
            Verifikasi langsung akan segera menandai status sebagai <strong>VERIFIED</strong> dan mencatat pemenang resmi tanpa menunggu kedua tim sepakat.
          </p>

          <div>
            <label className="text-[10px] font-mono text-text-muted uppercase block mb-1">
              Hasil Akhir Resmi *
            </label>
            <select
              value={verifyResultChoice}
              onChange={(e) => setVerifyResultChoice(e.target.value)}
              className="w-full h-8 text-xs bg-surface-dark border border-surface-border rounded px-2 text-text-primary focus:outline-none focus:border-persona-blue"
              required
            >
              <option value="TEAM_A_WIN">#{match.teamA.tag} Menang (TEAM_A_WIN)</option>
              <option value="TEAM_B_WIN">#{match.teamB.tag} Menang (TEAM_B_WIN)</option>
              <option value="DRAW">Seri (DRAW)</option>
              <option value="NO_CONTEST">No Contest (NO_CONTEST)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setVerifyModalOpen(false)}
              disabled={isActionSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isActionSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isActionSubmitting ? "Memproses..." : "Sahkan Hasil"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Dispute Modal */}
      <Modal
        isOpen={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
        title="Ajukan Dispute Pertandingan"
      >
        <form onSubmit={handleDisputeSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-mono text-text-muted uppercase block mb-1">
              Alasan Dispute *
            </label>
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Jelaskan ketidaksesuaian skor atau pelanggaran peraturan..."
              className="w-full h-20 text-xs bg-surface-dark border border-surface-border rounded p-2 text-text-primary focus:outline-none focus:border-persona-blue resize-none"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDisputeModalOpen(false)}
              disabled={isActionSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isActionSubmitting}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isActionSubmitting ? "Memproses..." : "Ajukan Dispute"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Batalkan Pertandingan Kompetitif"
      >
        <div className="space-y-4">
          <p className="text-xs text-text-secondary">
            Apakah Anda yakin ingin membatalkan pertandingan antara{" "}
            <strong>{match.teamA.name}</strong> dan <strong>{match.teamB.name}</strong>?
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCancelModalOpen(false)}
              disabled={isActionSubmitting}
            >
              Kembali
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleCancelSubmit}
              disabled={isActionSubmitting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isActionSubmitting ? "Membatalkan..." : "Ya, Batalkan Match"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
