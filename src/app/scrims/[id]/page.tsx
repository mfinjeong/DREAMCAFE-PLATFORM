"use client";

import React, { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ScrimItem } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  Swords,
  ArrowLeft,
  Calendar,
  Clock,
  Shield,
  Trophy,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Crown,
} from "lucide-react";
import { formatDateTime } from "@/lib/formatters";

export default function ScrimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const scrimId = resolvedParams.id;

  const [scrim, setScrim] = useState<ScrimItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Action states
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<"TEAM_A_WIN" | "TEAM_B_WIN" | "DRAW" | "NO_CONTEST">("TEAM_A_WIN");

  const fetchScrim = useCallback(async () => {
    try {
      setErrorMessage(null);
      const res = await fetch(`/api/scrims/${scrimId}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal memuat detail scrim");
      }
      setScrim(json.data);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan server");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [scrimId]);

  useEffect(() => {
    fetchScrim();
  }, [fetchScrim]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchScrim();
  };

  const handleAccept = async () => {
    if (!scrim) return;
    try {
      setIsActionLoading(true);
      setActionError(null);
      const res = await fetch(`/api/scrims/${scrimId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorMemberId: scrim.opponentTeam.ownerId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menerima scrim");
      }
      fetchScrim();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Gagal menerima scrim");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!scrim) return;
    try {
      setIsActionLoading(true);
      setActionError(null);
      const res = await fetch(`/api/scrims/${scrimId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorMemberId: scrim.opponentTeam.ownerId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menolak scrim");
      }
      fetchScrim();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Gagal menolak scrim");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!scrim) return;
    try {
      setIsActionLoading(true);
      setActionError(null);
      const res = await fetch(`/api/scrims/${scrimId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorMemberId: scrim.challengerTeam.ownerId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal membatalkan scrim");
      }
      fetchScrim();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Gagal membatalkan scrim");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStart = async () => {
    if (!scrim) return;
    try {
      setIsActionLoading(true);
      setActionError(null);
      const res = await fetch(`/api/scrims/${scrimId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorMemberId: scrim.challengerTeam.ownerId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal memulai scrim");
      }
      fetchScrim();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Gagal memulai scrim");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scrim) return;
    try {
      setIsActionLoading(true);
      setActionError(null);
      const res = await fetch(`/api/scrims/${scrimId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorMemberId: scrim.challengerTeam.ownerId,
          result: selectedResult,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menyelesaikan scrim");
      }
      setCompleteModalOpen(false);
      fetchScrim();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Gagal menyelesaikan scrim");
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center bg-surface-card border border-surface-border rounded-[4px]">
        <RefreshCw className="w-6 h-6 animate-spin text-persona-red mx-auto mb-2" />
        <p className="text-xs text-text-secondary font-mono">Memuat detail match scrim...</p>
      </div>
    );
  }

  if (errorMessage || !scrim) {
    return (
      <div className="p-8 bg-surface-card border border-surface-border rounded-[4px] text-center space-y-4">
        <AlertTriangle className="w-8 h-8 text-persona-red mx-auto" />
        <div>
          <h2 className="text-sm font-bold text-text-primary">Scrim Tidak Ditemukan</h2>
          <p className="text-xs text-text-secondary mt-1">{errorMessage || "Data match tidak tersedia."}</p>
        </div>
        <Link href="/scrims">
          <Button variant="outline" size="sm" className="inline-flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Daftar Scrim</span>
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Nav */}
      <div className="flex items-center justify-between">
        <Link
          href="/scrims"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Jadwal Scrim</span>
        </Link>

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

      {actionError && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/40 rounded text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Match Showcase Banner */}
      <div className="bg-surface-card border border-surface-border rounded-[4px] p-6 relative overflow-hidden">
        {/* Match Header Badges */}
        <div className="flex items-center justify-between gap-3 border-b border-surface-border pb-4 mb-6">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-persona-blue/10 border border-persona-blue/30 text-persona-blue">
              {scrim.game.title}
            </span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-dark border border-surface-border text-text-muted">
              BO{scrim.bestOf} FORMAT
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${
                scrim.status === "LIVE"
                  ? "bg-rose-950/50 text-rose-400 border-rose-800/50 animate-pulse"
                  : scrim.status === "SCHEDULED" || scrim.status === "ACCEPTED"
                  ? "bg-persona-blue/10 text-persona-blue border-persona-blue/30"
                  : scrim.status === "PENDING"
                  ? "bg-amber-950/40 text-amber-400 border-amber-800/40"
                  : scrim.status === "COMPLETED"
                  ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/40"
                  : "bg-surface-dark text-text-muted border-surface-border"
              }`}
            >
              STATUS: {scrim.status}
            </span>
          </div>
        </div>

        {/* Teams Matchup Centerpiece */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
          {/* Challenger Team */}
          <div className="md:col-span-3 bg-surface-dark/70 border border-surface-border p-4 rounded-[4px] flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-text-muted uppercase">Penantang (Team A)</span>
                <span className="text-xs font-mono font-bold text-persona-blue">#{scrim.challengerTeam.tag}</span>
              </div>
              <Link href={`/teams/${scrim.challengerTeamId}`} className="hover:underline">
                <h3 className="text-base font-black text-text-primary mt-1">{scrim.challengerTeam.name}</h3>
              </Link>
            </div>

            <div className="text-[11px] font-mono text-text-secondary border-t border-surface-border pt-2 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" />
                <span>{scrim.challengerTeam.ownerName}</span>
              </span>
              <span>{scrim.challengerTeam.memberCount} Roster</span>
            </div>
          </div>

          {/* VS Divider */}
          <div className="md:col-span-1 text-center py-2 md:py-0">
            <div className="inline-flex flex-col items-center justify-center">
              <span className="w-10 h-10 rounded-full bg-surface-dark border border-surface-border flex items-center justify-center font-mono font-black text-xs text-persona-red">
                VS
              </span>
            </div>
          </div>

          {/* Opponent Team */}
          <div className="md:col-span-3 bg-surface-dark/70 border border-surface-border p-4 rounded-[4px] flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-text-muted uppercase">Lawan (Team B)</span>
                <span className="text-xs font-mono font-bold text-amber-400">#{scrim.opponentTeam.tag}</span>
              </div>
              <Link href={`/teams/${scrim.opponentTeamId}`} className="hover:underline">
                <h3 className="text-base font-black text-text-primary mt-1">{scrim.opponentTeam.name}</h3>
              </Link>
            </div>

            <div className="text-[11px] font-mono text-text-secondary border-t border-surface-border pt-2 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" />
                <span>{scrim.opponentTeam.ownerName}</span>
              </span>
              <span>{scrim.opponentTeam.memberCount} Roster</span>
            </div>
          </div>
        </div>

        {/* Match Result Display if COMPLETED */}
        {scrim.status === "COMPLETED" && (
          <div className="mt-6 p-4 bg-surface-dark border border-emerald-800/40 rounded-[4px] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] font-mono uppercase text-text-muted block">Hasil Pertandingan</span>
                <span className="text-sm font-black text-text-primary">
                  {scrim.result === "TEAM_A_WIN"
                    ? `Pemenang: ${scrim.challengerTeam.name} (#${scrim.challengerTeam.tag})`
                    : scrim.result === "TEAM_B_WIN"
                    ? `Pemenang: ${scrim.opponentTeam.name} (#${scrim.opponentTeam.tag})`
                    : scrim.result === "DRAW"
                    ? "Hasil Imbang (DRAW)"
                    : "Tidak Ada Pemenang (NO CONTEST)"}
                </span>
              </div>
            </div>

            {scrim.completedAt && (
              <span className="text-[11px] font-mono text-text-muted">
                Selesai pada: {formatDateTime(scrim.completedAt)}
              </span>
            )}
          </div>
        )}

        {/* Action Controls Bar */}
        <div className="mt-6 pt-4 border-t border-surface-border flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-text-muted font-mono flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Jadwal: {formatDateTime(scrim.scheduledAt)}</span>
            </span>
            {scrim.startedAt && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-rose-400" />
                  <span>Mulai: {formatDateTime(scrim.startedAt)}</span>
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {scrim.status === "PENDING" && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAccept}
                  disabled={isActionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Terima Tantangan</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReject}
                  disabled={isActionLoading}
                  className="border-surface-border text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Tolak</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isActionLoading}
                  className="border-surface-border text-text-muted hover:text-white"
                >
                  <span>Batalkan</span>
                </Button>
              </>
            )}

            {(scrim.status === "SCHEDULED" || scrim.status === "ACCEPTED") && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleStart}
                  disabled={isActionLoading}
                  className="bg-persona-red hover:bg-persona-red-hover text-white flex items-center gap-1"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Mulai Match (LIVE)</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isActionLoading}
                  className="border-surface-border text-text-muted hover:text-white"
                >
                  <span>Batalkan Scrim</span>
                </Button>
              </>
            )}

            {scrim.status === "LIVE" && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setActionError(null);
                  setCompleteModalOpen(true);
                }}
                disabled={isActionLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Selesaikan Match</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Details & Notes Section */}
      <div className="bg-surface-card border border-surface-border p-5 rounded-[4px] space-y-3">
        <h3 className="text-xs font-mono font-bold tracking-wider text-text-primary uppercase">
          Informasi Tambahan & Aturan Scrim
        </h3>

        <div className="text-xs text-text-secondary bg-surface-dark p-3.5 rounded border border-surface-border font-mono leading-relaxed">
          {scrim.note || "Tidak ada catatan khusus yang dilampirkan untuk match ini."}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px] font-mono text-text-muted">
          <div>
            <span>Dibuat oleh: </span>
            <strong className="text-text-primary">{scrim.createdBy.fullName}</strong>
          </div>
          <div>
            <span>Waktu dibuat: </span>
            <span>{formatDateTime(scrim.createdAt)}</span>
          </div>
          <div>
            <span>Terakhir diperbarui: </span>
            <span>{formatDateTime(scrim.updatedAt)}</span>
          </div>
        </div>
      </div>

      {/* Complete Match Modal */}
      <Modal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title="Catat Hasil Pertandingan Scrim"
      >
        <form onSubmit={handleCompleteSubmit} className="space-y-4">
          <p className="text-xs text-text-secondary font-mono">
            Pilih hasil resmi match antara <strong className="text-text-primary">{scrim.challengerTeam.name}</strong> dan <strong className="text-text-primary">{scrim.opponentTeam.name}</strong>.
          </p>

          <div className="space-y-2">
            <label className="block text-xs font-mono text-text-secondary">
              Hasil Pertandingan *
            </label>

            <div className="space-y-2">
              <label
                className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-colors ${
                  selectedResult === "TEAM_A_WIN"
                    ? "bg-persona-blue/10 border-persona-blue text-text-primary"
                    : "bg-surface-dark border-surface-border text-text-secondary hover:border-surface-border-active"
                }`}
              >
                <input
                  type="radio"
                  name="result"
                  value="TEAM_A_WIN"
                  checked={selectedResult === "TEAM_A_WIN"}
                  onChange={() => setSelectedResult("TEAM_A_WIN")}
                  className="accent-persona-blue"
                />
                <div>
                  <div className="text-xs font-bold font-mono">
                    Kemenangan Tim Penantang: #{scrim.challengerTeam.tag} {scrim.challengerTeam.name}
                  </div>
                  <div className="text-[10px] text-text-muted font-mono">Winner: {scrim.challengerTeam.name}</div>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-colors ${
                  selectedResult === "TEAM_B_WIN"
                    ? "bg-amber-950/40 border-amber-800 text-text-primary"
                    : "bg-surface-dark border-surface-border text-text-secondary hover:border-surface-border-active"
                }`}
              >
                <input
                  type="radio"
                  name="result"
                  value="TEAM_B_WIN"
                  checked={selectedResult === "TEAM_B_WIN"}
                  onChange={() => setSelectedResult("TEAM_B_WIN")}
                  className="accent-amber-400"
                />
                <div>
                  <div className="text-xs font-bold font-mono">
                    Kemenangan Tim Lawan: #{scrim.opponentTeam.tag} {scrim.opponentTeam.name}
                  </div>
                  <div className="text-[10px] text-text-muted font-mono">Winner: {scrim.opponentTeam.name}</div>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-colors ${
                  selectedResult === "DRAW"
                    ? "bg-surface-muted border-persona-blue text-text-primary"
                    : "bg-surface-dark border-surface-border text-text-secondary hover:border-surface-border-active"
                }`}
              >
                <input
                  type="radio"
                  name="result"
                  value="DRAW"
                  checked={selectedResult === "DRAW"}
                  onChange={() => setSelectedResult("DRAW")}
                />
                <div>
                  <div className="text-xs font-bold font-mono">Hasil Seri (DRAW)</div>
                  <div className="text-[10px] text-text-muted font-mono">Tidak ada pemenang yang tercatat</div>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-colors ${
                  selectedResult === "NO_CONTEST"
                    ? "bg-surface-muted border-rose-800 text-text-primary"
                    : "bg-surface-dark border-surface-border text-text-secondary hover:border-surface-border-active"
                }`}
              >
                <input
                  type="radio"
                  name="result"
                  value="NO_CONTEST"
                  checked={selectedResult === "NO_CONTEST"}
                  onChange={() => setSelectedResult("NO_CONTEST")}
                />
                <div>
                  <div className="text-xs font-bold font-mono">Tidak Selesai (NO CONTEST)</div>
                  <div className="text-[10px] text-text-muted font-mono">Match dibatalkan saat sedang berjalan</div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCompleteModalOpen(false)}
              disabled={isActionLoading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isActionLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isActionLoading ? "Menyimpan..." : "Simpan Hasil Match"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
