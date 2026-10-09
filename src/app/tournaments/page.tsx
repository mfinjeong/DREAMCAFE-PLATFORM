"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  TournamentItemDTO,
  TournamentStatus,
  TeamItem,
  GameItem,
} from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { formatRupiah, formatDateTime } from "@/lib/formatters";
import {
  Trophy,
  Users,
  Gamepad2,
  Calendar,
  Search,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  XCircle,
  ArrowRight,
} from "lucide-react";

export default function TournamentsPage() {
  const [activeTab, setActiveTab] = useState<"tournaments" | "teams" | "games">("tournaments");
  const [tournaments, setTournaments] = useState<TournamentItemDTO[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [games, setGames] = useState<GameItem[]>([]);
  const [members, setMembers] = useState<Array<{ id: string; fullName: string; username: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [gameFilter, setGameFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formGameId, setFormGameId] = useState("");
  const [formCreatorId, setFormCreatorId] = useState("");
  const [formMinTeams, setFormMinTeams] = useState(2);
  const [formMaxTeams, setFormMaxTeams] = useState(16);
  const [formBestOf, setFormBestOf] = useState(1);
  const [formRegStart, setFormRegStart] = useState("");
  const [formRegEnd, setFormRegEnd] = useState("");
  const [formStartAt, setFormStartAt] = useState("");
  const [formPrizePool, setFormPrizePool] = useState<number | "">("");
  const [formEntryFee, setFormEntryFee] = useState<number | "">("");
  const [formDescription, setFormDescription] = useState("");
  const [formRules, setFormRules] = useState("");

  const loadTournaments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (gameFilter) params.set("gameId", gameFilter);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());

      const res = await fetch(`/api/tournaments?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setTournaments(json.data);
      } else {
        setError(json.message || "Gagal memuat turnamen");
      }
    } catch {
      setError("Koneksi gagal saat memuat turnamen");
    }
  }, [statusFilter, gameFilter, searchQuery]);

  const loadAuxData = useCallback(async () => {
    try {
      // Load Games
      const gRes = await fetch("/api/games");
      const gJson = await gRes.json();
      if (gJson.success) {
        setGames(gJson.data);
        if (gJson.data.length > 0 && !formGameId) {
          setFormGameId(gJson.data[0].id);
        }
      }

      // Load Teams
      const tRes = await fetch("/api/teams");
      const tJson = await tRes.json();
      if (tJson.success) {
        setTeams(tJson.data);
      }

      // Load Members
      const mRes = await fetch("/api/members");
      const mJson = await mRes.json();
      if (mJson.success) {
        setMembers(mJson.data);
        if (mJson.data.length > 0 && !formCreatorId) {
          setFormCreatorId(mJson.data[0].id);
        }
      }
    } catch {
      // Silent error for aux data
    }
  }, [formGameId, formCreatorId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadTournaments(), loadAuxData()]).finally(() => setLoading(false));
  }, [loadTournaments, loadAuxData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTournaments();
    setRefreshing(false);
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);

    try {
      const payload = {
        name: formName,
        gameId: formGameId,
        createdById: formCreatorId,
        minTeams: Number(formMinTeams),
        maxTeams: Number(formMaxTeams),
        bestOf: Number(formBestOf),
        registrationStart: new Date(formRegStart).toISOString(),
        registrationEnd: new Date(formRegEnd).toISOString(),
        startAt: new Date(formStartAt).toISOString(),
        prizePool: formPrizePool === "" ? undefined : Number(formPrizePool),
        entryFee: formEntryFee === "" ? undefined : Number(formEntryFee),
        description: formDescription.trim() || undefined,
        rules: formRules.trim() || undefined,
      };

      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setCreateError(json.message || "Gagal membuat turnamen");
        return;
      }

      setIsCreateOpen(false);
      resetForm();
      await loadTournaments();
    } catch {
      setCreateError("Terjadi kesalahan jaringan saat membuat turnamen");
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormMinTeams(2);
    setFormMaxTeams(16);
    setFormBestOf(1);
    setFormRegStart("");
    setFormRegEnd("");
    setFormStartAt("");
    setFormPrizePool("");
    setFormEntryFee("");
    setFormDescription("");
    setFormRules("");
    setCreateError(null);
  };

  // KPIs
  const totalTournaments = tournaments.length;
  const registrationOpenCount = tournaments.filter(
    (t) => t.status === "REGISTRATION_OPEN"
  ).length;
  const inProgressCount = tournaments.filter(
    (t) => t.status === "IN_PROGRESS"
  ).length;
  const draftCount = tournaments.filter((t) => t.status === "DRAFT").length;

  const getStatusBadge = (status: TournamentStatus) => {
    switch (status) {
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-semibold uppercase tracking-wider">
            <Clock className="w-3 h-3" /> Draft
          </span>
        );
      case "REGISTRATION_OPEN":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold uppercase tracking-wider animate-pulse">
            <CheckCircle2 className="w-3 h-3" /> Registration Open
          </span>
        );
      case "REGISTRATION_CLOSED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px] font-semibold uppercase tracking-wider">
            <AlertCircle className="w-3 h-3" /> Registration Closed
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[10px] font-semibold uppercase tracking-wider">
            <Play className="w-3 h-3" /> In Progress
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-teal-500/15 text-teal-300 border border-teal-500/30 text-[10px] font-semibold uppercase tracking-wider">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-red-500/15 text-red-400 border border-red-500/30 text-[10px] font-semibold uppercase tracking-wider">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-4 bg-persona-red persona-slash" />
          <div>
            <h2 className="text-base font-bold text-text-primary tracking-tight font-sans">
              Esports Tournament System
            </h2>
            <p className="text-xs text-text-muted">
              Turnamen resmi, registrasi tim, dan lifecycle manajemen DREAMCAFÉ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Buat Turnamen
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 bg-surface border border-surface-border rounded-[6px]">
          <div className="flex items-center justify-between text-text-dim text-[11px] font-mono mb-1">
            <span>TOTAL TURNAMEN</span>
            <Trophy className="w-3.5 h-3.5 text-persona-red" />
          </div>
          <div className="text-xl font-bold font-mono text-text-primary">
            {totalTournaments}
          </div>
        </div>

        <div className="p-3 bg-surface border border-surface-border rounded-[6px]">
          <div className="flex items-center justify-between text-text-dim text-[11px] font-mono mb-1">
            <span>REGISTRATION OPEN</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {registrationOpenCount}
          </div>
        </div>

        <div className="p-3 bg-surface border border-surface-border rounded-[6px]">
          <div className="flex items-center justify-between text-text-dim text-[11px] font-mono mb-1">
            <span>IN PROGRESS</span>
            <Play className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-purple-400">
            {inProgressCount}
          </div>
        </div>

        <div className="p-3 bg-surface border border-surface-border rounded-[6px]">
          <div className="flex items-center justify-between text-text-dim text-[11px] font-mono mb-1">
            <span>DRAFT / UPCOMING</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-400">
            {draftCount}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-surface-border pb-1.5 text-xs font-sans">
        <button
          onClick={() => setActiveTab("tournaments")}
          className={`px-3 py-1.5 rounded-[6px] transition-colors cursor-pointer text-xs font-medium flex items-center gap-1.5 ${
            activeTab === "tournaments"
              ? "bg-persona-red-subtle text-white border-l-2 border-persona-red"
              : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          Turnamen ({tournaments.length})
        </button>
        <button
          onClick={() => setActiveTab("teams")}
          className={`px-3 py-1.5 rounded-[6px] transition-colors cursor-pointer text-xs font-medium flex items-center gap-1.5 ${
            activeTab === "teams"
              ? "bg-persona-red-subtle text-white border-l-2 border-persona-red"
              : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Teams & Clans ({teams.length})
        </button>
        <button
          onClick={() => setActiveTab("games")}
          className={`px-3 py-1.5 rounded-[6px] transition-colors cursor-pointer text-xs font-medium flex items-center gap-1.5 ${
            activeTab === "games"
              ? "bg-persona-red-subtle text-white border-l-2 border-persona-red"
              : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          Game Titles ({games.length})
        </button>
      </div>

      {activeTab === "tournaments" ? (
        <div className="space-y-3.5">
          {/* Filters Bar */}
          <div className="p-3 bg-surface border border-surface-border rounded-[6px] flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
              <input
                type="text"
                placeholder="Cari turnamen berdasarkan nama atau deskripsi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-background border border-surface-border rounded-[6px] text-xs text-text-primary placeholder:text-text-dim focus:outline-none focus:border-persona-red"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-background border border-surface-border rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-persona-red"
              >
                <option value="ALL">Semua Status</option>
                <option value="DRAFT">Draft</option>
                <option value="REGISTRATION_OPEN">Registration Open</option>
                <option value="REGISTRATION_CLOSED">Registration Closed</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <select
                value={gameFilter}
                onChange={(e) => setGameFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-background border border-surface-border rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-persona-red"
              >
                <option value="">Semua Game</option>
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tournament Grid */}
          {loading ? (
            <div className="p-12 text-center text-text-muted text-xs">
              <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-persona-red" />
              Memuat data turnamen dari database...
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-[6px] text-xs text-red-400">
              {error}
            </div>
          ) : tournaments.length === 0 ? (
            <div className="p-12 text-center bg-surface border border-surface-border rounded-[6px]">
              <Trophy className="w-8 h-8 mx-auto text-text-dim mb-2" />
              <p className="text-xs font-semibold text-text-primary">
                Tidak ada turnamen ditemukan
              </p>
              <p className="text-[11px] text-text-muted mt-1">
                Silakan sesuaikan filter pencarian atau buat turnamen baru.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {tournaments.map((t) => {
                const capacityPercent = Math.min(
                  100,
                  Math.round((t.confirmedTeamCount / t.maxTeams) * 100)
                );

                return (
                  <div
                    key={t.id}
                    className="relative p-4 bg-surface border border-surface-border rounded-[6px] flex flex-col justify-between overflow-hidden hover:border-surface-border/80 transition-colors"
                  >
                    <div
                      className="absolute top-0 right-0 w-3 h-3 bg-persona-red opacity-80"
                      style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
                    />

                    <div>
                      {/* Top Bar */}
                      <div className="flex items-center justify-between mb-2">
                        {getStatusBadge(t.status)}
                        <span className="text-[11px] font-mono text-text-dim">
                          BO{t.bestOf}
                        </span>
                      </div>

                      {/* Title & Game */}
                      <div className="mb-2.5">
                        <h3 className="text-sm font-bold text-text-primary leading-tight hover:text-persona-red transition-colors">
                          <Link href={`/tournaments/${t.id}`}>{t.name}</Link>
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-p3r-blue font-medium">
                          <Gamepad2 className="w-3.5 h-3.5" />
                          <span>{t.gameTitle}</span>
                          <span className="text-text-dim">•</span>
                          <span className="text-text-muted text-[11px]">
                            {t.gameGenre}
                          </span>
                        </div>
                      </div>

                      {t.description && (
                        <p className="text-xs text-text-muted mb-3 line-clamp-2">
                          {t.description}
                        </p>
                      )}

                      {/* Stats Matrix */}
                      <div className="grid grid-cols-2 gap-2 p-2.5 bg-background rounded-[6px] border border-surface-border text-xs mb-3">
                        <div>
                          <span className="text-text-dim text-[10px] uppercase font-mono block">
                            Prize Pool
                          </span>
                          <span className="font-bold font-mono text-persona-red">
                            {formatRupiah(t.prizePool ?? 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-text-dim text-[10px] uppercase font-mono block">
                            Slot Fee
                          </span>
                          <span className="font-bold font-mono text-text-primary">
                            {formatRupiah(t.entryFee ?? 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-text-dim text-[10px] uppercase font-mono block">
                            Mulai Pertandingan
                          </span>
                          <span className="text-text-primary font-mono text-[11px]">
                            {formatDateTime(t.startAt)}
                          </span>
                        </div>
                        <div>
                          <span className="text-text-dim text-[10px] uppercase font-mono block">
                            Format
                          </span>
                          <span className="text-text-primary font-medium text-[11px]">
                            {t.format || "SINGLE_ELIMINATION"}
                          </span>
                        </div>
                      </div>

                      {/* Capacity Bar */}
                      <div className="mb-3.5">
                        <div className="flex justify-between items-center text-[11px] font-mono mb-1">
                          <span className="text-text-muted">Kapasitas Slot:</span>
                          <span
                            className={
                              t.isCapacityFull
                                ? "text-red-400 font-bold"
                                : "text-text-primary font-bold"
                            }
                          >
                            {t.confirmedTeamCount} / {t.maxTeams} Tim ({capacityPercent}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-background rounded-full overflow-hidden border border-surface-border">
                          <div
                            className={`h-full ${
                              t.isCapacityFull ? "bg-red-500" : "bg-persona-red"
                            }`}
                            style={{ width: `${capacityPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer CTA */}
                    <div className="pt-2 border-t border-surface-border/60 flex items-center justify-between">
                      <div className="text-[10px] text-text-dim font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Reg: {formatDateTime(t.registrationStart)} s/d{" "}
                        {formatDateTime(t.registrationEnd)}
                      </div>

                      <Link href={`/tournaments/${t.id}`}>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-xs flex items-center gap-1"
                        >
                          Detail Turnamen
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === "teams" ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Tag</TableHead>
              <TableHead>Captain</TableHead>
              <TableHead>Roster</TableHead>
              <TableHead>Dibuat</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {teams.map((team, idx) => (
              <TableRow key={team.id}>
                <TableCell className="font-mono font-bold text-text-muted">
                  #{idx + 1}
                </TableCell>
                <TableCell className="font-bold text-text-primary">
                  {team.name}
                </TableCell>
                <TableCell className="font-mono text-p3r-blue font-semibold">
                  [{team.tag}]
                </TableCell>
                <TableCell className="text-text-primary text-xs">
                  {team.ownerName || team.leaderName || "-"}
                </TableCell>
                <TableCell className="font-mono text-text-muted text-xs">
                  {team.memberCount} players
                </TableCell>
                <TableCell className="font-mono text-xs text-text-dim">
                  {team.createdAt ? formatDateTime(team.createdAt) : "-"}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {games.map((g) => (
            <div
              key={g.id}
              className="p-3.5 bg-surface border border-surface-border rounded-[6px]"
            >
              <div className="flex items-start justify-between mb-1">
                <span className="text-xs font-bold text-text-primary">{g.title}</span>
                <span className="text-[10px] font-mono text-text-dim">
                  #{g.popularityRank}
                </span>
              </div>
              <div className="text-[11px] text-text-muted mb-2.5">
                {g.genre} • {g.publisher}
              </div>

              <div className="p-2.5 bg-background rounded-[6px] border border-surface-border text-xs space-y-1">
                <div className="flex justify-between text-text-muted">
                  <span className="text-[11px]">Min GPU:</span>
                  <span className="font-mono text-text-primary text-[11px]">
                    {g.minGpuRequired}
                  </span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span className="text-[11px]">PC:</span>
                  <span
                    className={`text-[11px] font-mono ${
                      g.isInstalledOnPc ? "text-p3r-blue font-medium" : "text-text-dim"
                    }`}
                  >
                    {g.isInstalledOnPc ? "Installed" : "No"}
                  </span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span className="text-[11px]">Console:</span>
                  <span
                    className={`text-[11px] font-mono ${
                      g.isInstalledConsole ? "text-p3r-blue font-medium" : "text-text-dim"
                    }`}
                  >
                    {g.isInstalledConsole ? "Installed" : "No"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Buat Turnamen Baru */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Buat Turnamen Baru"
        subtitle="Registrasikan data kompetisi ke database resmi DREAMCAFÉ"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTournament} className="p-4 space-y-3.5 text-xs">
          {createError && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-[6px] text-red-400">
              {createError}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-text-muted mb-1">
              Nama Turnamen <span className="text-persona-red">*</span>
            </label>
            <Input
              type="text"
              required
              placeholder="e.g. DREAMCAFE Invitational S1"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">
                Pilih Game <span className="text-persona-red">*</span>
              </label>
              <select
                required
                value={formGameId}
                onChange={(e) => setFormGameId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-background border border-surface-border rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-persona-red"
              >
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title} ({g.genre})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">
                Penyelenggara (Member) <span className="text-persona-red">*</span>
              </label>
              <select
                required
                value={formCreatorId}
                onChange={(e) => setFormCreatorId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-background border border-surface-border rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-persona-red"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} (@{m.username})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">
                Min Tim
              </label>
              <Input
                type="number"
                min={2}
                value={formMinTeams}
                onChange={(e) => setFormMinTeams(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">
                Max Tim
              </label>
              <Input
                type="number"
                min={2}
                value={formMaxTeams}
                onChange={(e) => setFormMaxTeams(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">
                Format Seri
              </label>
              <select
                value={formBestOf}
                onChange={(e) => setFormBestOf(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-background border border-surface-border rounded-[6px] text-xs text-text-primary focus:outline-none focus:border-persona-red"
              >
                <option value={1}>Best of 1 (BO1)</option>
                <option value={3}>Best of 3 (BO3)</option>
                <option value={5}>Best of 5 (BO5)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">
                Mulai Registrasi <span className="text-persona-red">*</span>
              </label>
              <Input
                type="datetime-local"
                required
                value={formRegStart}
                onChange={(e) => setFormRegStart(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">
                Selesai Registrasi <span className="text-persona-red">*</span>
              </label>
              <Input
                type="datetime-local"
                required
                value={formRegEnd}
                onChange={(e) => setFormRegEnd(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">
                Mulai Turnamen <span className="text-persona-red">*</span>
              </label>
              <Input
                type="datetime-local"
                required
                value={formStartAt}
                onChange={(e) => setFormStartAt(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">
                Prize Pool (Rp)
              </label>
              <Input
                type="number"
                placeholder="e.g. 5000000"
                value={formPrizePool}
                onChange={(e) =>
                  setFormPrizePool(e.target.value ? Number(e.target.value) : "")
                }
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">
                Biaya Pendaftaran / Slot (Rp)
              </label>
              <Input
                type="number"
                placeholder="e.g. 100000"
                value={formEntryFee}
                onChange={(e) =>
                  setFormEntryFee(e.target.value ? Number(e.target.value) : "")
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-text-muted mb-1">
              Deskripsi Turnamen
            </label>
            <textarea
              rows={2}
              placeholder="Deskripsi singkat seputar turnamen..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-background border border-surface-border rounded-[6px] text-xs text-text-primary placeholder:text-text-dim focus:outline-none focus:border-persona-red"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-text-muted mb-1">
              Peraturan / Rules Khusus
            </label>
            <textarea
              rows={2}
              placeholder="Regulasi pertandingan, penalti keterlambatan, dll..."
              value={formRules}
              onChange={(e) => setFormRules(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-background border border-surface-border rounded-[6px] text-xs text-text-primary placeholder:text-text-dim focus:outline-none focus:border-persona-red"
            />
          </div>

          <div className="pt-3 border-t border-surface-border flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={creating}
            >
              {creating ? "Menyimpan..." : "Buat Turnamen"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
