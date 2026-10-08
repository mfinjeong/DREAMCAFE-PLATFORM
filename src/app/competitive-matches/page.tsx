"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CompetitiveMatchItem, TeamItem, GameItem } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  Crosshair,
  Search,
  Plus,
  RefreshCw,
  Clock,
  Calendar,
  Shield,
  Trophy,
  Filter,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  FileText,
} from "lucide-react";
import { formatDateTime } from "@/lib/formatters";

export default function CompetitiveMatchesPage() {
  const [matches, setMatches] = useState<CompetitiveMatchItem[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [games, setGames] = useState<GameItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [gameFilter, setGameFilter] = useState("ALL");

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    teamAId: "",
    teamBId: "",
    gameId: "",
    scheduledAt: "",
    bestOf: 1,
    sourceScrimId: "",
    note: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setErrorMessage(null);
      const [matchesRes, teamsRes, gamesRes] = await Promise.all([
        fetch("/api/competitive-matches"),
        fetch("/api/teams"),
        fetch("/api/games?status=ACTIVE"),
      ]);

      const [matchesJson, teamsJson, gamesJson] = await Promise.all([
        matchesRes.json(),
        teamsRes.json(),
        gamesRes.json(),
      ]);

      if (matchesRes.ok && matchesJson.success) {
        setMatches(matchesJson.data);
      } else {
        throw new Error(matchesJson.message || "Gagal memuat rekor pertandingan kompetitif");
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
    now.setHours(now.getHours() + 2, 0, 0, 0);
    const localDatetime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    setFormData({
      teamAId: teams[0]?.id || "",
      teamBId: teams[1]?.id || "",
      gameId: games[0]?.id || "",
      scheduledAt: localDatetime,
      bestOf: 1,
      sourceScrimId: "",
      note: "",
    });
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.teamAId || !formData.teamBId) {
      setFormError("Pilih Tim A dan Tim B");
      return;
    }
    if (formData.teamAId === formData.teamBId) {
      setFormError("Tim A dan Tim B tidak boleh sama");
      return;
    }
    if (!formData.gameId) {
      setFormError("Pilih Game kompetitif");
      return;
    }
    if (!formData.scheduledAt) {
      setFormError("Tentukan jadwal pertandingan");
      return;
    }

    const teamA = teams.find((t) => t.id === formData.teamAId);
    if (!teamA) {
      setFormError("Data Tim A tidak ditemukan");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/competitive-matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamAId: formData.teamAId,
          teamBId: formData.teamBId,
          gameId: formData.gameId,
          scheduledAt: new Date(formData.scheduledAt).toISOString(),
          bestOf: Number(formData.bestOf),
          sourceScrimId: formData.sourceScrimId.trim() || undefined,
          note: formData.note.trim() || undefined,
          actorMemberId: teamA.ownerId,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal membuat jadwal pertandingan");
      }

      setCreateModalOpen(false);
      await fetchData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  // KPIs
  const totalCount = matches.length;
  const pendingCount = matches.filter((m) => m.status === "PENDING").length;
  const scheduledCount = matches.filter((m) => m.status === "SCHEDULED").length;
  const liveCount = matches.filter((m) => m.status === "LIVE").length;
  const verifiedCount = matches.filter((m) => m.status === "VERIFIED").length;
  const disputedCount = matches.filter((m) => m.status === "DISPUTED").length;

  // Filtered Matches
  const filteredMatches = matches.filter((match) => {
    if (statusFilter !== "ALL" && match.status !== statusFilter) return false;
    if (gameFilter !== "ALL" && match.gameId !== gameFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTeamA =
        match.teamA.name.toLowerCase().includes(q) ||
        match.teamA.tag.toLowerCase().includes(q);
      const matchTeamB =
        match.teamB.name.toLowerCase().includes(q) ||
        match.teamB.tag.toLowerCase().includes(q);
      const matchGame = match.game.title.toLowerCase().includes(q);
      if (!matchTeamA && !matchTeamB && !matchGame) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 bg-persona-blue persona-slash rounded-[1px]"></div>
            <h1 className="text-lg font-mono font-bold tracking-wider text-text-primary uppercase flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-persona-blue" />
              <span>Competitive Match Management</span>
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Rekap pertandingan resmi (official competitive) antar tim esports DREAMCAFE.
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
            className="flex items-center gap-1.5 bg-persona-blue hover:bg-persona-blue-hover text-white"
          >
            <Plus className="w-4 h-4" />
            <span>Jadwalkan Official Match</span>
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* KPI Overview Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 bg-surface-card border border-surface-border rounded-[4px]">
          <div className="text-[10px] text-text-muted font-mono uppercase">Total Match</div>
          <div className="text-xl font-bold font-mono text-text-primary mt-1">{totalCount}</div>
        </div>

        <div className="p-3 bg-surface-card border border-surface-border rounded-[4px]">
          <div className="text-[10px] text-amber-400/80 font-mono uppercase">Pending</div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">{pendingCount}</div>
        </div>

        <div className="p-3 bg-surface-card border border-surface-border rounded-[4px]">
          <div className="text-[10px] text-persona-blue/80 font-mono uppercase">Scheduled</div>
          <div className="text-xl font-bold font-mono text-persona-blue mt-1">{scheduledCount}</div>
        </div>

        <div className="p-3 bg-surface-card border border-surface-border rounded-[4px]">
          <div className="text-[10px] text-rose-400/80 font-mono uppercase">Live Match</div>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">{liveCount}</div>
        </div>

        <div className="p-3 bg-surface-card border border-surface-border rounded-[4px]">
          <div className="text-[10px] text-emerald-400/80 font-mono uppercase">Verified</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{verifiedCount}</div>
        </div>

        <div className="p-3 bg-surface-card border border-surface-border rounded-[4px]">
          <div className="text-[10px] text-orange-400/80 font-mono uppercase">Disputed</div>
          <div className="text-xl font-bold font-mono text-orange-400 mt-1">{disputedCount}</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-3 bg-surface-card border border-surface-border rounded-[4px] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Cari tim atau game..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-xs bg-surface-dark border-surface-border w-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 text-xs bg-surface-dark border border-surface-border rounded px-2 text-text-primary focus:outline-none focus:border-persona-blue"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">PENDING</option>
            <option value="SCHEDULED">SCHEDULED</option>
            <option value="LIVE">LIVE</option>
            <option value="RESULT_PENDING">RESULT_PENDING</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="DISPUTED">DISPUTED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-text-secondary ml-2">
            <span>Game:</span>
          </div>
          <select
            value={gameFilter}
            onChange={(e) => setGameFilter(e.target.value)}
            className="h-8 text-xs bg-surface-dark border border-surface-border rounded px-2 text-text-primary focus:outline-none focus:border-persona-blue"
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

      {/* Matches List */}
      {isLoading ? (
        <div className="p-12 text-center text-text-muted font-mono text-xs">
          Memuat daftar official match...
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="p-12 text-center bg-surface-card border border-surface-border rounded-[4px] space-y-3">
          <Crosshair className="w-8 h-8 text-text-muted mx-auto" />
          <p className="text-xs text-text-muted font-mono">
            Belum ada rekor pertandingan kompetitif resmi yang sesuai filter.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenCreateModal}
            className="text-xs"
          >
            Jadwalkan Official Match Pertama
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMatches.map((match) => {
            let statusColor = "bg-surface-dark text-text-muted border-surface-border";
            if (match.status === "LIVE") {
              statusColor = "bg-rose-950/60 text-rose-400 border-rose-800/80 animate-pulse";
            } else if (match.status === "SCHEDULED") {
              statusColor = "bg-persona-blue/20 text-persona-blue border-persona-blue/40";
            } else if (match.status === "PENDING") {
              statusColor = "bg-amber-950/50 text-amber-400 border-amber-800/50";
            } else if (match.status === "RESULT_PENDING") {
              statusColor = "bg-purple-950/50 text-purple-300 border-purple-800/50";
            } else if (match.status === "VERIFIED") {
              statusColor = "bg-emerald-950/50 text-emerald-400 border-emerald-800/50";
            } else if (match.status === "DISPUTED") {
              statusColor = "bg-orange-950/60 text-orange-400 border-orange-800/80 font-bold";
            }

            return (
              <div
                key={match.id}
                className="p-4 bg-surface-card border border-surface-border hover:border-surface-border/80 transition-all rounded-[4px] flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Matchup Header */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${statusColor}`}>
                      {match.status}
                    </span>

                    <span className="text-[10px] font-mono text-text-muted bg-surface-dark border border-surface-border px-1.5 py-0.5 rounded">
                      BO{match.bestOf}
                    </span>

                    <span className="text-[10px] font-mono font-bold text-text-secondary flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-persona-blue" />
                      <span>{match.game.title}</span>
                    </span>

                    <span className="text-[10px] font-mono text-text-muted flex items-center gap-1 ml-auto lg:ml-0">
                      <Clock className="w-3 h-3" />
                      <span>{formatDateTime(match.scheduledAt)}</span>
                    </span>
                  </div>

                  {/* Team A vs Team B */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-persona-blue font-bold">#{match.teamA.tag}</span>
                      <span className="text-sm font-bold text-text-primary">{match.teamA.name}</span>
                    </div>

                    <span className="text-xs font-mono font-bold text-text-muted px-1.5 py-0.5 bg-surface-dark rounded border border-surface-border">
                      VS
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-persona-red font-bold">#{match.teamB.tag}</span>
                      <span className="text-sm font-bold text-text-primary">{match.teamB.name}</span>
                    </div>
                  </div>

                  {/* Submissions & Winner Info */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-secondary pt-1">
                    {match.status === "VERIFIED" && (
                      <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          Hasil:{" "}
                          <strong>
                            {match.result === "DRAW"
                              ? "DRAW (SERI)"
                              : match.result === "NO_CONTEST"
                              ? "NO CONTEST"
                              : match.winnerTeam
                              ? `Pemenang: ${match.winnerTeam.name} (#${match.winnerTeam.tag})`
                              : match.result}
                          </strong>
                        </span>
                      </div>
                    )}

                    {match.status === "DISPUTED" && (
                      <div className="flex items-center gap-1.5 text-orange-400 font-mono">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Status Sengketa (Kedua tim submit hasil berbeda)</span>
                      </div>
                    )}

                    {match.participantsCount > 0 && (
                      <span className="text-text-muted font-mono">
                        {match.participantsCount} Peserta Roster Terdaftar
                      </span>
                    )}

                    {match.sourceScrimId && (
                      <span className="text-persona-blue font-mono text-[10px]">
                        Linked Scrim
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Link */}
                <div className="flex items-center gap-2 self-end lg:self-center">
                  <Link href={`/competitive-matches/${match.id}`}>
                    <Button variant="outline" size="sm" className="h-8 text-xs flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Lihat Detail Match</span>
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Jadwalkan Pertandingan Kompetitif Resmi"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono text-text-muted uppercase block mb-1">
                Tim A (Challenger) *
              </label>
              <select
                value={formData.teamAId}
                onChange={(e) => setFormData({ ...formData, teamAId: e.target.value })}
                className="w-full h-8 text-xs bg-surface-dark border border-surface-border rounded px-2 text-text-primary focus:outline-none focus:border-persona-blue"
                required
              >
                <option value="">Pilih Tim A</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    #{t.tag} - {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono text-text-muted uppercase block mb-1">
                Tim B (Opponent) *
              </label>
              <select
                value={formData.teamBId}
                onChange={(e) => setFormData({ ...formData, teamBId: e.target.value })}
                className="w-full h-8 text-xs bg-surface-dark border border-surface-border rounded px-2 text-text-primary focus:outline-none focus:border-persona-blue"
                required
              >
                <option value="">Pilih Tim B</option>
                {teams
                  .filter((t) => t.id !== formData.teamAId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      #{t.tag} - {t.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono text-text-muted uppercase block mb-1">
              Game Kompetitif *
            </label>
            <select
              value={formData.gameId}
              onChange={(e) => setFormData({ ...formData, gameId: e.target.value })}
              className="w-full h-8 text-xs bg-surface-dark border border-surface-border rounded px-2 text-text-primary focus:outline-none focus:border-persona-blue"
              required
            >
              <option value="">Pilih Game</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title} ({g.genre})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono text-text-muted uppercase block mb-1">
                Jadwal Pertandingan *
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                className="w-full h-8 text-xs bg-surface-dark border border-surface-border rounded px-2 text-text-primary focus:outline-none focus:border-persona-blue"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-text-muted uppercase block mb-1">
                Format Best Of *
              </label>
              <div className="flex items-center gap-4 h-8">
                {[1, 3, 5].map((bo) => (
                  <label key={bo} className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
                    <input
                      type="radio"
                      name="bestOf"
                      value={bo}
                      checked={Number(formData.bestOf) === bo}
                      onChange={() => setFormData({ ...formData, bestOf: bo })}
                      className="accent-persona-blue"
                    />
                    <span>BO{bo}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono text-text-muted uppercase block mb-1">
              Catatan Match (Opsional)
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Peraturan tambahan, map pool, atau info lobby..."
              className="w-full h-16 text-xs bg-surface-dark border border-surface-border rounded p-2 text-text-primary focus:outline-none focus:border-persona-blue resize-none"
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
              className="bg-persona-blue hover:bg-persona-blue-hover text-white"
            >
              {isSubmitting ? "Menyimpan..." : "Jadwalkan Match"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
