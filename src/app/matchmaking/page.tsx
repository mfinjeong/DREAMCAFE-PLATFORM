"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  TeamItem,
  GameItem,
  MatchmakingQueueDTO,
  MatchmakingOfferDTO,
  TeamMatchmakingStateDTO,
} from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Swords,
  Shield,
  Gamepad2,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  AlertTriangle,
  Users,
} from "lucide-react";

export default function MatchmakingPage() {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [games, setGames] = useState<GameItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form selections
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [minRating, setMinRating] = useState<number>(0);
  const [maxRating, setMaxRating] = useState<number>(3000);

  // Team matchmaking state
  const [teamState, setTeamState] = useState<TeamMatchmakingStateDTO | null>(null);
  const [activeQueue, setActiveQueue] = useState<MatchmakingQueueDTO | null>(null);
  const [activeOffer, setActiveOffer] = useState<MatchmakingOfferDTO | null>(null);

  // Action states
  const [isQueueing, setIsQueueing] = useState(false);
  const [isActing, setIsActing] = useState(false);

  // Polling ref
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Load Teams and Games on Mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoading(true);
        const [teamsRes, gamesRes] = await Promise.all([
          fetch("/api/teams"),
          fetch("/api/games?status=ACTIVE"),
        ]);

        const teamsJson = await teamsRes.json();
        const gamesJson = await gamesRes.json();

        if (teamsJson.success && Array.isArray(teamsJson.data)) {
          setTeams(teamsJson.data);
          if (teamsJson.data.length > 0) {
            setSelectedTeamId(teamsJson.data[0].id);
          }
        }

        if (gamesJson.success && Array.isArray(gamesJson.data)) {
          const activeGames = gamesJson.data.filter((g: GameItem) => g.isActive);
          setGames(activeGames);
          if (activeGames.length > 0) {
            setSelectedGameId(activeGames[0].id);
          }
        }
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error ? err.message : "Gagal memuat data tim dan game"
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // 2. Fetch Team Matchmaking State when team changes
  const fetchTeamMatchmakingState = useCallback(async (teamId: string) => {
    if (!teamId) return;
    try {
      const res = await fetch(`/api/teams/${teamId}/matchmaking`);
      const json = await res.json();
      if (json.success && json.data) {
        const state: TeamMatchmakingStateDTO = json.data;
        setTeamState(state);
        setActiveQueue(state.activeQueue || null);
        setActiveOffer(state.activeOffer || null);

        // Update default min/max rating based on team rating if no active queue
        if (!state.activeQueue && state.teamRating !== undefined) {
          setMinRating(Math.max(0, state.teamRating - 250));
          setMaxRating(state.teamRating + 250);
        }
      }
    } catch {
      // Ignore polling errors
    }
  }, []);

  useEffect(() => {
    if (selectedTeamId) {
      fetchTeamMatchmakingState(selectedTeamId);
    }
  }, [selectedTeamId, fetchTeamMatchmakingState]);

  // 3. Polling when in active queue or offer states
  useEffect(() => {
    if (!selectedTeamId) return;

    const shouldPoll =
      activeQueue &&
      (activeQueue.status === "QUEUED" ||
        activeQueue.status === "ACCEPTING" ||
        activeQueue.status === "MATCH_FOUND");

    if (shouldPoll) {
      pollingRef.current = setInterval(() => {
        fetchTeamMatchmakingState(selectedTeamId);
      }, 3000);
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [selectedTeamId, activeQueue, fetchTeamMatchmakingState]);

  // Handle Join Queue
  const handleJoinQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId || !selectedGameId) {
      setErrorMessage("Silakan pilih tim dan game terlebih dahulu");
      return;
    }

    const team = teams.find((t) => t.id === selectedTeamId);
    if (!team) return;

    try {
      setIsQueueing(true);
      setErrorMessage(null);

      const res = await fetch("/api/matchmaking/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: selectedTeamId,
          gameId: selectedGameId,
          minRating,
          maxRating,
          actorMemberId: team.ownerId, // Menggunakan owner tim
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal masuk antrean matchmaking");
      }

      await fetchTeamMatchmakingState(selectedTeamId);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Terjadi kesalahan saat masuk antrean"
      );
    } finally {
      setIsQueueing(false);
    }
  };

  // Handle Leave Queue
  const handleLeaveQueue = async () => {
    if (!activeQueue || !selectedTeamId) return;
    const team = teams.find((t) => t.id === selectedTeamId);
    if (!team) return;

    try {
      setIsActing(true);
      setErrorMessage(null);

      const res = await fetch(`/api/matchmaking/queue/${activeQueue.id}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorMemberId: team.ownerId,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal keluar dari antrean");
      }

      await fetchTeamMatchmakingState(selectedTeamId);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Terjadi kesalahan saat keluar antrean"
      );
    } finally {
      setIsActing(false);
    }
  };

  // Handle Accept Offer
  const handleAcceptOffer = async () => {
    if (!activeQueue || !selectedTeamId) return;
    const team = teams.find((t) => t.id === selectedTeamId);
    if (!team) return;

    try {
      setIsActing(true);
      setErrorMessage(null);

      const res = await fetch(`/api/matchmaking/queue/${activeQueue.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorMemberId: team.ownerId,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menerima tawaran pertandingan");
      }

      await fetchTeamMatchmakingState(selectedTeamId);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Terjadi kesalahan saat menerima tawaran"
      );
    } finally {
      setIsActing(false);
    }
  };

  // Handle Decline Offer
  const handleDeclineOffer = async () => {
    if (!activeQueue || !selectedTeamId) return;
    const team = teams.find((t) => t.id === selectedTeamId);
    if (!team) return;

    try {
      setIsActing(true);
      setErrorMessage(null);

      const res = await fetch(`/api/matchmaking/queue/${activeQueue.id}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorMemberId: team.ownerId,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menolak tawaran pertandingan");
      }

      await fetchTeamMatchmakingState(selectedTeamId);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Terjadi kesalahan saat menolak tawaran"
      );
    } finally {
      setIsActing(false);
    }
  };

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  // Determine opponent team from offer
  const isTeamA = activeOffer?.teamAId === selectedTeamId;
  const opponentTeam = activeOffer
    ? isTeamA
      ? activeOffer.teamB
      : activeOffer.teamA
    : null;
  const isAcceptedByCurrentTeam = activeOffer
    ? isTeamA
      ? activeOffer.acceptedByA
      : activeOffer.acceptedByB
    : false;
  const isAcceptedByOpponent = activeOffer
    ? isTeamA
      ? activeOffer.acceptedByB
      : activeOffer.acceptedByA
    : false;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Swords className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Team Matchmaking
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              Antrean pencarian lawan resmi tim berbasis rating DREAMRANK nyata.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedTeamId && fetchTeamMatchmakingState(selectedTeamId)}
              disabled={isLoading || isActing}
              className="border-slate-800 hover:bg-slate-900"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Link href="/competitive-matches">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                Competitive Matches <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">{errorMessage}</div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-300 text-xs font-semibold"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Team & Game Setup */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                Pilih Tim & Parameter
              </h2>

              {/* Team Selector */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Pilih Tim Anda</label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  disabled={Boolean(activeQueue && ["QUEUED", "ACCEPTING", "MATCH_FOUND"].includes(activeQueue.status))}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                >
                  {teams.length === 0 ? (
                    <option value="">Tidak ada tim</option>
                  ) : (
                    teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        [{t.tag}] {t.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Team Stats Summary */}
              {selectedTeam && teamState && (
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">DREAMRANK Tim:</span>
                    <span className="font-bold text-amber-400 text-sm">
                      {teamState.teamRating} RR
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Jumlah Anggota Roster:</span>
                    <span className="font-medium text-slate-300 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {teamState.memberCount} pemain
                    </span>
                  </div>
                </div>
              )}

              {/* Game Selector */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Pilih Game Kompetitif</label>
                <select
                  value={selectedGameId}
                  onChange={(e) => setSelectedGameId(e.target.value)}
                  disabled={Boolean(activeQueue && ["QUEUED", "ACCEPTING", "MATCH_FOUND"].includes(activeQueue.status))}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                >
                  {games.length === 0 ? (
                    <option value="">Tidak ada game aktif</option>
                  ) : (
                    games.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title} ({g.genre})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Rating Range */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <label className="text-xs font-medium text-slate-400">
                  Target Rating Lawan (Min – Max)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                      Min Rating
                    </span>
                    <Input
                      type="number"
                      value={minRating}
                      onChange={(e) => setMinRating(parseInt(e.target.value) || 0)}
                      disabled={Boolean(activeQueue && ["QUEUED", "ACCEPTING", "MATCH_FOUND"].includes(activeQueue.status))}
                      className="bg-slate-950 border-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                      Max Rating
                    </span>
                    <Input
                      type="number"
                      value={maxRating}
                      onChange={(e) => setMaxRating(parseInt(e.target.value) || 0)}
                      disabled={Boolean(activeQueue && ["QUEUED", "ACCEPTING", "MATCH_FOUND"].includes(activeQueue.status))}
                      className="bg-slate-950 border-slate-800"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Pencarian lawan bersifat mutual: lawan harus berada dalam rentang Anda dan Anda harus berada dalam rentang lawan.
                </p>
              </div>

              {/* Join Queue Button */}
              {(!activeQueue || ["ACCEPTED", "DECLINED", "EXPIRED", "CANCELLED"].includes(activeQueue.status)) && (
                <Button
                  onClick={handleJoinQueue}
                  disabled={isQueueing || !selectedTeamId || !selectedGameId}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-600/20"
                >
                  <Swords className="w-4 h-4 mr-2" />
                  {isQueueing ? "Mendaftarkan Antrean..." : "Mulai Cari Lawan (Join Queue)"}
                </Button>
              )}
            </div>
          </div>

          {/* Right Column: Queue Status & Match Arena */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 min-h-[420px] flex flex-col justify-between">
              {/* STATE 1: NO ACTIVE QUEUE / EMPTY */}
              {(!activeQueue || ["CANCELLED", "DECLINED", "EXPIRED"].includes(activeQueue.status)) && !activeOffer && (
                <div className="my-auto text-center py-12 px-4 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
                    <Gamepad2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white">Antrean Siap Dimulai</h3>
                    <p className="text-sm text-slate-400 max-w-md mx-auto">
                      Pilih tim dan game di sebelah kiri, tentukan toleransi rating, lalu tekan tombol Mulai Cari Lawan untuk menemukan tim lawan yang setara.
                    </p>
                  </div>
                  {activeQueue && (
                    <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">
                      Status Terakhir: {activeQueue.status}
                    </div>
                  )}
                </div>
              )}

              {/* STATE 2: QUEUED / SEARCHING */}
              {activeQueue && activeQueue.status === "QUEUED" && !activeOffer && (
                <div className="my-auto text-center py-10 px-4 space-y-6">
                  {/* Radar Searching Animation */}
                  <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" />
                    <div className="absolute inset-2 rounded-full border border-indigo-500/30 animate-pulse" />
                    <div className="w-14 h-14 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                      <Search className="w-6 h-6 animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      Mencari Lawan...
                    </h3>
                    <p className="text-sm text-slate-400 max-w-md mx-auto">
                      Sedang memindai antrean untuk tim dengan rating {activeQueue.minRating} – {activeQueue.maxRating} RR pada game {activeQueue.gameTitle}.
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-500 block">Rating Tim Anda</span>
                      <span className="font-bold text-amber-400 text-sm">
                        {activeQueue.teamRating} RR
                      </span>
                    </div>
                    <div className="h-8 w-[1px] bg-slate-800" />
                    <div>
                      <span className="text-slate-500 block">Game</span>
                      <span className="font-semibold text-slate-200">
                        {activeQueue.gameTitle}
                      </span>
                    </div>
                    <div className="h-8 w-[1px] bg-slate-800" />
                    <div>
                      <span className="text-slate-500 block">Status</span>
                      <span className="font-semibold text-indigo-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 animate-spin" /> QUEUED
                      </span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      variant="outline"
                      onClick={handleLeaveQueue}
                      disabled={isActing}
                      className="border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30"
                    >
                      Batal Cari Lawan (Leave Queue)
                    </Button>
                  </div>
                </div>
              )}

              {/* STATE 3: MATCH_FOUND / ACCEPTING */}
              {activeOffer && activeOffer.status === "PENDING" && (
                <div className="my-auto py-6 px-4 space-y-6">
                  {/* Match Found Banner */}
                  <div className="text-center space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wide uppercase">
                      <Swords className="w-3.5 h-3.5" /> Lawan Ditemukan (Match Found)
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tight">
                      Siap Bertanding?
                    </h3>
                    <p className="text-xs text-slate-400">
                      Kedua tim harus menerima tawaran dalam batas waktu untuk memulai pertandingan.
                    </p>
                  </div>

                  {/* VS Card Display */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    {/* Your Team */}
                    <div className="md:col-span-2 p-5 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold mx-auto flex items-center justify-center text-sm">
                        {selectedTeam?.tag}
                      </div>
                      <div className="font-bold text-white text-sm">{selectedTeam?.name}</div>
                      <div className="text-xs text-amber-400 font-semibold">
                        {isTeamA ? activeOffer.teamA.teamRating : activeOffer.teamB.teamRating} RR
                      </div>
                      <div className="pt-2">
                        {isAcceptedByCurrentTeam ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3" /> Anda Menerima
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                            <Clock className="w-3 h-3" /> Belum Konfirmasi
                          </span>
                        )}
                      </div>
                    </div>

                    {/* VS Badge */}
                    <div className="md:col-span-1 text-center py-2">
                      <span className="text-xs font-black text-slate-500 px-3 py-1 rounded-full bg-slate-800/80">
                        VS
                      </span>
                    </div>

                    {/* Opponent Team */}
                    <div className="md:col-span-2 p-5 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold mx-auto flex items-center justify-center text-sm">
                        {opponentTeam?.tag}
                      </div>
                      <div className="font-bold text-white text-sm">{opponentTeam?.name}</div>
                      <div className="text-xs text-amber-400 font-semibold">
                        {opponentTeam?.teamRating} RR
                      </div>
                      <div className="pt-2">
                        {isAcceptedByOpponent ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3" /> Lawan Menerima
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                            <Clock className="w-3 h-3" /> Menunggu Lawan
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Accept / Decline Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                    {!isAcceptedByCurrentTeam ? (
                      <>
                        <Button
                          onClick={handleAcceptOffer}
                          disabled={isActing}
                          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-emerald-600/20"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Terima Pertandingan (Accept)
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleDeclineOffer}
                          disabled={isActing}
                          className="w-full sm:w-auto border-rose-500/30 text-rose-400 hover:bg-rose-500/10 px-6 py-3 rounded-xl"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Tolak (Decline)
                        </Button>
                      </>
                    ) : (
                      <div className="text-center space-y-2">
                        <div className="inline-flex items-center gap-2 text-sm text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          Anda telah menerima! Menunggu lawan mengonfirmasi...
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STATE 4: ACCEPTED / MATCH CREATED */}
              {activeOffer && activeOffer.status === "ACCEPTED" && (
                <div className="my-auto text-center py-10 px-4 space-y-5">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white">Pertandingan Berhasil Dibuat!</h3>
                    <p className="text-sm text-slate-400 max-w-md mx-auto">
                      Kedua tim telah menerima tawaran. Pertandingan resmi CompetitiveMatch telah dijadwalkan.
                    </p>
                  </div>
                  {activeOffer.competitiveMatchId && (
                    <div className="pt-3">
                      <Link href={`/competitive-matches/${activeOffer.competitiveMatchId}`}>
                        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl">
                          Buka Detail Pertandingan <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Footer Info */}
              <div className="border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
                <span>DREAMCAFE Matchmaking Server Authoritative v1.0</span>
                <span>Fair play guaranteed • No client-side rating forgery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
