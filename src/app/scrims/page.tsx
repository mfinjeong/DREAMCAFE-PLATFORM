"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ScrimItem, TeamItem, GameItem } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  Swords,
  Search,
  Plus,
  RefreshCw,
  Clock,
  Calendar,
  Shield,
  Trophy,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  PlayCircle,
} from "lucide-react";
import { formatDateTime } from "@/lib/formatters";

export default function ScrimsPage() {
  const [scrims, setScrims] = useState<ScrimItem[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [games, setGames] = useState<GameItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [gameFilter, setGameFilter] = useState("ALL");

  // Create Scrim Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    challengerTeamId: "",
    opponentTeamId: "",
    gameId: "",
    scheduledAt: "",
    bestOf: 1,
    note: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setErrorMessage(null);
      const [scrimsRes, teamsRes, gamesRes] = await Promise.all([
        fetch("/api/scrims"),
        fetch("/api/teams"),
        fetch("/api/games?status=ACTIVE"),
      ]);

      const [scrimsJson, teamsJson, gamesJson] = await Promise.all([
        scrimsRes.json(),
        teamsRes.json(),
        gamesRes.json(),
      ]);

      if (scrimsRes.ok && scrimsJson.success) {
        setScrims(scrimsJson.data);
      } else {
        throw new Error(scrimsJson.message || "Gagal memuat daftar scrim");
      }

      if (teamsRes.ok && teamsJson.success) {
        setTeams(teamsJson.data);
      }

      if (gamesRes.ok && gamesJson.success) {
        setGames(gamesJson.data);
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan server");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleOpenCreateModal = () => {
    setFormError(null);
    const now = new Date();
    now.setHours(now.getHours() + 2); // Default to 2 hours from now
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    setFormData({
      challengerTeamId: teams[0]?.id || "",
      opponentTeamId: teams[1]?.id || "",
      gameId: games[0]?.id || "",
      scheduledAt: localIso,
      bestOf: 1,
      note: "",
    });
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.challengerTeamId) {
      setFormError("Pilih tim penantang.");
      return;
    }
    if (!formData.opponentTeamId) {
      setFormError("Pilih tim lawan.");
      return;
    }
    if (formData.challengerTeamId === formData.opponentTeamId) {
      setFormError("Tim tidak dapat bertanding melawan timnya sendiri.");
      return;
    }
    if (!formData.gameId) {
      setFormError("Pilih game yang dipertandingkan.");
      return;
    }
    if (!formData.scheduledAt) {
      setFormError("Tentukan jadwal scrim.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const challengerTeam = teams.find((t) => t.id === formData.challengerTeamId);
      if (!challengerTeam) {
        throw new Error("Tim penantang tidak valid");
      }

      const res = await fetch("/api/scrims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengerTeamId: formData.challengerTeamId,
          opponentTeamId: formData.opponentTeamId,
          gameId: formData.gameId,
          scheduledAt: new Date(formData.scheduledAt).toISOString(),
          bestOf: Number(formData.bestOf),
          note: formData.note.trim() || null,
          actorMemberId: challengerTeam.ownerId,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal membuat tantangan scrim");
      }

      setCreateModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered list
  const filteredScrims = scrims.filter((s) => {
    if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
    if (gameFilter !== "ALL" && s.gameId !== gameFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchA = s.challengerTeam.name.toLowerCase().includes(q) || s.challengerTeam.tag.toLowerCase().includes(q);
      const matchB = s.opponentTeam.name.toLowerCase().includes(q) || s.opponentTeam.tag.toLowerCase().includes(q);
      const matchGame = s.game.title.toLowerCase().includes(q);
      if (!matchA && !matchB && !matchGame) return false;
    }
    return true;
  });

  // Helper status badge styles
  const getStatusBadge = (status: ScrimItem["status"]) => {
    switch (status) {
      case "LIVE":
        return "bg-rose-950/40 text-rose-400 border-rose-800/40 animate-pulse";
      case "SCHEDULED":
      case "ACCEPTED":
        return "bg-persona-blue/10 text-persona-blue border-persona-blue/30";
      case "PENDING":
        return "bg-amber-950/40 text-amber-400 border-amber-800/40";
      case "COMPLETED":
        return "bg-emerald-950/40 text-emerald-400 border-emerald-800/40";
      case "REJECTED":
      case "CANCELLED":
        return "bg-surface-dark text-text-muted border-surface-border";
      default:
        return "bg-surface-dark text-text-secondary border-surface-border";
    }
  };

  const getResultBadge = (result?: ScrimItem["result"]) => {
    if (!result) return null;
    switch (result) {
      case "TEAM_A_WIN":
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-800/40 font-bold">Challenger Win</span>;
      case "TEAM_B_WIN":
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-800/40 font-bold">Opponent Win</span>;
      case "DRAW":
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/50 text-amber-400 border border-amber-800/40 font-bold">DRAW</span>;
      case "NO_CONTEST":
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-text-muted border border-surface-border font-bold">NO CONTEST</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-5 bg-persona-red persona-slash rounded-[1px]"></div>
            <h1 className="text-base font-black tracking-widest text-[#F2F3F5] uppercase">
              MANAJEMEN SCRIM & SPARRING TIM
            </h1>
          </div>
          <p className="text-xs text-text-secondary font-mono mt-1">
            Sistem tantangan, jadwal pertandingan sparring, dan pencatatan hasil scrim antar tim esports.
          </p>
        </div>

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
            variant="primary"
            size="sm"
            onClick={handleOpenCreateModal}
            disabled={teams.length < 2 || games.length === 0}
            className="bg-persona-red hover:bg-persona-red-hover text-white flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tantang Scrim</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-surface-card border border-surface-border p-3.5 rounded-[4px]">
          <div className="flex items-center justify-between text-text-muted mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Total Scrim</span>
            <Swords className="w-3.5 h-3.5 text-text-secondary" />
          </div>
          <div className="text-lg font-bold text-text-primary font-mono">{scrims.length}</div>
          <div className="text-[10px] text-text-muted mt-0.5">Semua match</div>
        </div>

        <div className="bg-surface-card border border-surface-border p-3.5 rounded-[4px]">
          <div className="flex items-center justify-between text-text-muted mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Pending</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-amber-400 font-mono">
            {scrims.filter((s) => s.status === "PENDING").length}
          </div>
          <div className="text-[10px] text-text-muted mt-0.5">Menunggu respon</div>
        </div>

        <div className="bg-surface-card border border-surface-border p-3.5 rounded-[4px]">
          <div className="flex items-center justify-between text-text-muted mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Scheduled</span>
            <Calendar className="w-3.5 h-3.5 text-persona-blue" />
          </div>
          <div className="text-lg font-bold text-persona-blue font-mono">
            {scrims.filter((s) => s.status === "SCHEDULED" || s.status === "ACCEPTED").length}
          </div>
          <div className="text-[10px] text-text-muted mt-0.5">Terjadwal</div>
        </div>

        <div className="bg-surface-card border border-surface-border p-3.5 rounded-[4px]">
          <div className="flex items-center justify-between text-text-muted mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Match LIVE</span>
            <PlayCircle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-lg font-bold text-rose-400 font-mono">
            {scrims.filter((s) => s.status === "LIVE").length}
          </div>
          <div className="text-[10px] text-text-muted mt-0.5">Sedang tanding</div>
        </div>

        <div className="bg-surface-card border border-surface-border p-3.5 rounded-[4px] col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-text-muted mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Selesai</span>
            <Trophy className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400 font-mono">
            {scrims.filter((s) => s.status === "COMPLETED").length}
          </div>
          <div className="text-[10px] text-text-muted mt-0.5">Hasil tercatat</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-surface-card border border-surface-border p-3 rounded-[4px]">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari tim atau game..."
            className="pl-8 text-xs bg-surface-dark border-surface-border h-8 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-text-muted font-mono">
            <Filter className="w-3 h-3 text-text-muted" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-surface-dark border border-surface-border text-text-primary px-2.5 py-1 rounded-[4px] font-mono h-8 focus:outline-none focus:border-persona-blue"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">PENDING</option>
            <option value="SCHEDULED">SCHEDULED</option>
            <option value="LIVE">LIVE</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <select
            value={gameFilter}
            onChange={(e) => setGameFilter(e.target.value)}
            className="text-xs bg-surface-dark border border-surface-border text-text-primary px-2.5 py-1 rounded-[4px] font-mono h-8 focus:outline-none focus:border-persona-blue"
          >
            <option value="ALL">Semua Game</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scrim List Table */}
      {isLoading ? (
        <div className="p-16 text-center bg-surface-card border border-surface-border rounded-[4px]">
          <RefreshCw className="w-6 h-6 animate-spin text-persona-red mx-auto mb-2" />
          <p className="text-xs text-text-secondary font-mono">Memuat jadwal dan riwayat scrim...</p>
        </div>
      ) : filteredScrims.length === 0 ? (
        <div className="p-12 text-center bg-surface-card border border-surface-border rounded-[4px]">
          <Swords className="w-8 h-8 text-text-muted mx-auto mb-3" />
          <h3 className="text-sm font-bold text-text-primary">Tidak Ada Scrim Ditemukan</h3>
          <p className="text-xs text-text-secondary mt-1">
            {scrims.length === 0
              ? "Belum ada tantangan atau match sparring scrim terdaftar."
              : "Tidak ada data scrim yang cocok dengan filter pencarian."}
          </p>
          {teams.length >= 2 && games.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenCreateModal}
              className="mt-4 text-persona-red border-persona-red/40 hover:bg-persona-red/10"
            >
              Buat Tantangan Pertama
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-surface-card border border-surface-border rounded-[4px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-dark border-b border-surface-border text-text-muted uppercase font-mono text-[10px]">
                <tr>
                  <th className="px-4 py-2.5">Pertandingan (Teams)</th>
                  <th className="px-4 py-2.5">Game</th>
                  <th className="px-4 py-2.5">Format</th>
                  <th className="px-4 py-2.5">Jadwal Tanding</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Hasil</th>
                  <th className="px-4 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredScrims.map((scrim) => (
                  <tr key={scrim.id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="font-mono text-persona-blue">#{scrim.challengerTeam.tag}</span>
                          <span className="text-text-primary">{scrim.challengerTeam.name}</span>
                        </div>
                        <span className="text-text-muted font-mono font-black text-[11px] px-1 bg-surface-dark border border-surface-border rounded">
                          VS
                        </span>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="font-mono text-amber-400">#{scrim.opponentTeam.tag}</span>
                          <span className="text-text-primary">{scrim.opponentTeam.name}</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-text-muted font-mono mt-0.5">
                        Dibuat oleh: {scrim.createdBy.fullName}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-bold text-text-primary block">{scrim.game.title}</span>
                      <span className="text-[10px] text-text-muted font-mono">{scrim.game.genre}</span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-mono font-bold px-1.5 py-0.5 bg-surface-dark border border-surface-border rounded text-[11px] text-text-secondary">
                        BO{scrim.bestOf}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] text-text-secondary">
                      {formatDateTime(scrim.scheduledAt)}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getStatusBadge(
                          scrim.status
                        )}`}
                      >
                        {scrim.status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {getResultBadge(scrim.result) || <span className="text-text-muted font-mono text-[10px]">-</span>}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Link href={`/scrims/${scrim.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">
                          Detail Match
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Scrim Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Buat Tantangan Scrim Baru"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-2.5 bg-rose-950/40 border border-rose-800/40 rounded text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-text-secondary mb-1">
              Tim Penantang (Challenger) *
            </label>
            <select
              value={formData.challengerTeamId}
              onChange={(e) => setFormData({ ...formData, challengerTeamId: e.target.value })}
              className="w-full text-xs bg-surface-dark border border-surface-border text-text-primary px-3 py-2 rounded focus:outline-none focus:border-persona-blue font-mono"
              required
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  #{t.tag} {t.name} (Owner: {t.ownerName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-text-secondary mb-1">
              Tim Lawan (Opponent) *
            </label>
            <select
              value={formData.opponentTeamId}
              onChange={(e) => setFormData({ ...formData, opponentTeamId: e.target.value })}
              className="w-full text-xs bg-surface-dark border border-surface-border text-text-primary px-3 py-2 rounded focus:outline-none focus:border-persona-blue font-mono"
              required
            >
              {teams
                .filter((t) => t.id !== formData.challengerTeamId)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    #{t.tag} {t.name} (Owner: {t.ownerName})
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-text-secondary mb-1">
                Game / Judul *
              </label>
              <select
                value={formData.gameId}
                onChange={(e) => setFormData({ ...formData, gameId: e.target.value })}
                className="w-full text-xs bg-surface-dark border border-surface-border text-text-primary px-3 py-2 rounded focus:outline-none focus:border-persona-blue font-mono"
                required
              >
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title} ({g.genre})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-text-secondary mb-1">
                Format Match *
              </label>
              <select
                value={formData.bestOf}
                onChange={(e) => setFormData({ ...formData, bestOf: Number(e.target.value) })}
                className="w-full text-xs bg-surface-dark border border-surface-border text-text-primary px-3 py-2 rounded focus:outline-none focus:border-persona-blue font-mono"
                required
              >
                <option value={1}>Best of 1 (BO1)</option>
                <option value={3}>Best of 3 (BO3)</option>
                <option value={5}>Best of 5 (BO5)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-text-secondary mb-1">
              Jadwal Tanding (Waktu & Tanggal) *
            </label>
            <Input
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
              className="text-xs bg-surface-dark border-surface-border font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-text-secondary mb-1">
              Catatan / Rule Khusus (Opsional)
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Contoh: Server custom, default ban map, pemanasan 15 menit..."
              rows={2}
              className="w-full text-xs bg-surface-dark border border-surface-border text-text-primary px-3 py-2 rounded focus:outline-none focus:border-persona-blue"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
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
              {isSubmitting ? "Mengirim..." : "Kirim Tantangan"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
