"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { GamingProfileDTO } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import {
  Trophy,
  Coins,
  Clock,
  Gamepad2,
  Calendar,
  Monitor,
  Flame,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  Swords,
  ChevronRight,
  Shield,
  Star,
  History,
} from "lucide-react";
import { formatDateTime } from "@/lib/formatters";

export default function MemberGamingProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const memberId = resolvedParams.id;

  const [profile, setProfile] = useState<GamingProfileDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchProfile = async () => {
    try {
      setErrorMessage(null);
      const res = await fetch(`/api/members/${memberId}/gaming`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal memuat profil gaming");
      }
      setProfile(json.data);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan server");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [memberId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchProfile();
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center bg-surface-card border border-surface-border rounded-[4px]">
        <RefreshCw className="w-6 h-6 animate-spin text-persona-red mx-auto mb-2" />
        <p className="text-xs text-text-secondary font-mono">Memuat Gaming Profile member...</p>
      </div>
    );
  }

  if (errorMessage || !profile) {
    return (
      <div className="p-8 bg-surface-card border border-surface-border rounded-[4px] text-center space-y-4">
        <AlertTriangle className="w-8 h-8 text-persona-red mx-auto" />
        <div>
          <h2 className="text-sm font-bold text-text-primary">Profil Tidak Ditemukan</h2>
          <p className="text-xs text-text-secondary mt-1">{errorMessage || "Data member tidak tersedia."}</p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Link href="/members">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Member</span>
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={handleRefresh}>
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  const { member, stats, favoriteGames, gamesPlayed, recentActivity, dreamRankProfile, teams } = profile;

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

  return (
    <div className="space-y-6">
      {/* Navigation Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/members"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Manajemen Member</span>
        </Link>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Sync Data</span>
        </Button>
      </div>

      {/* Gaming Identity Banner */}
      <div className="bg-surface-card border border-surface-border p-5 rounded-[4px] relative overflow-hidden">
        {/* Subtle decorative slash */}
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-persona-red/10 to-transparent pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            {/* Avatar / Gamer Tag Symbol */}
            <div className="w-16 h-16 rounded-[4px] bg-surface-dark border border-surface-border-active flex items-center justify-center text-xl font-black text-persona-red font-mono shrink-0">
              {member.username.slice(0, 2).toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-black text-text-primary tracking-wide">
                  {member.username}
                </span>
                <span className="text-xs font-mono text-text-muted px-1.5 py-0.5 bg-surface-dark border border-surface-border rounded">
                  {member.memberCode}
                </span>
                <span className="text-xs font-mono text-persona-red font-bold px-2 py-0.5 bg-persona-red/10 border border-persona-red/30 rounded">
                  {member.tier}
                </span>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${getRankBadgeStyle(member.dreamRank)}`}>
                  {member.dreamRank} • {member.dreamRating.toLocaleString("id-ID")} RR
                </span>
              </div>

              <p className="text-xs text-text-secondary mt-1">
                {member.fullName} • Member Sejak {member.createdAt.slice(0, 10)}
              </p>
            </div>
          </div>

          {/* Quick Currencies & Badges */}
          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-surface-border pt-3 md:pt-0 md:pl-5">
            <div className="text-right">
              <span className="text-[10px] font-mono text-text-muted block uppercase tracking-wider">
                DREAM Coins
              </span>
              <div className="flex items-center justify-end gap-1 text-sm font-bold text-amber-400 font-mono mt-0.5">
                <Coins className="w-4 h-4" />
                <span>{member.dreamCoins.toLocaleString("id-ID")}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono text-text-muted block uppercase tracking-wider">
                Total XP
              </span>
              <div className="flex items-center justify-end gap-1 text-sm font-bold text-persona-blue font-mono mt-0.5">
                <Sparkles className="w-4 h-4" />
                <span>{member.xp.toLocaleString("id-ID")} XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Level Progression Progress Bar */}
        <div className="mt-5 pt-4 border-t border-surface-border">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-white px-2 py-0.5 bg-persona-red rounded-[2px] text-[11px]">
                LEVEL {member.level}
              </span>
              <span className="text-text-secondary text-[11px]">
                Progress Menuju Level {member.level + 1}
              </span>
            </div>

            <span className="font-mono text-text-muted text-[11px]">
              {member.xp.toLocaleString("id-ID")} / {stats.xpForNextLevel.toLocaleString("id-ID")} XP ({stats.progressPercent}%)
            </span>
          </div>

          <div className="w-full h-2 bg-surface-dark border border-surface-border rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-persona-red to-persona-blue transition-all duration-300"
              style={{ width: `${stats.progressPercent}%` }}
            ></div>
          </div>

          <div className="flex justify-between text-[10px] text-text-muted font-mono mt-1">
            <span>Level {member.level} ({stats.xpForCurrentLevel} XP)</span>
            <span>Butuh {stats.xpRemaining.toLocaleString("id-ID")} XP lagi untuk Level Up</span>
            <span>Level {member.level + 1} ({stats.xpForNextLevel} XP)</span>
          </div>
        </div>
      </div>

      {/* DREAMRANK Competitive Section */}
      <div className="bg-surface-card border border-surface-border p-5 rounded-[4px] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-3.5 bg-amber-400 persona-slash rounded-[1px]"></div>
            <div>
              <h2 className="text-xs font-mono font-bold tracking-wider text-text-primary uppercase flex items-center gap-2">
                <span>DREAMRANK System</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-surface-dark border border-surface-border text-text-muted rounded">
                  Competitive Rating
                </span>
              </h2>
              <p className="text-[11px] text-text-secondary mt-0.5">
                Peringkat kompetitif resmi DREAMCAFÉ berdasarkan rating performa (RR).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`px-2.5 py-1 rounded-[4px] border font-mono font-black text-xs tracking-wider flex items-center gap-1.5 ${getRankBadgeStyle(dreamRankProfile.rank)}`}>
              <Trophy className="w-3.5 h-3.5" />
              <span>{dreamRankProfile.rank}</span>
            </div>
            <div className="text-right font-mono">
              <span className="text-sm font-black text-text-primary">
                {dreamRankProfile.rating.toLocaleString("id-ID")}
              </span>
              <span className="text-[10px] text-text-muted ml-1">Rating (RR)</span>
            </div>
          </div>
        </div>

        {/* Rank Progression Bar & Next Rank Status */}
        <div className="bg-surface-dark/60 border border-surface-border p-3.5 rounded-[4px] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-text-primary font-bold text-[11px]">
                {dreamRankProfile.progress.nextRank ? (
                  <>Next: <span className="text-amber-400 font-bold">{dreamRankProfile.progress.nextRank}</span> — {dreamRankProfile.progress.nextRankMinRating?.toLocaleString("id-ID")} RR</>
                ) : (
                  <span className="text-rose-400 font-bold">Pinnacle Tier (GRANDMASTER)</span>
                )}
              </span>
            </div>

            <span className="font-mono text-text-muted text-[11px]">
              {dreamRankProfile.progress.tierSpan !== null ? (
                <>Progress: {dreamRankProfile.progress.ratingInTier} / {dreamRankProfile.progress.tierSpan} RR ({dreamRankProfile.progress.progressPercent}%)</>
              ) : (
                <>Top Rank Achieved (100%)</>
              )}
            </span>
          </div>

          <div className="w-full h-2 bg-surface-dark border border-surface-border rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300"
              style={{ width: `${dreamRankProfile.progress.progressPercent}%` }}
            ></div>
          </div>

          <div className="flex justify-between text-[10px] text-text-muted font-mono">
            <span>{dreamRankProfile.rank} ({dreamRankProfile.progress.minRating} RR)</span>
            <span>
              {dreamRankProfile.progress.nextRank ? (
                <>Butuh {dreamRankProfile.progress.ratingNeeded.toLocaleString("id-ID")} Rating lagi menuju {dreamRankProfile.progress.nextRank}</>
              ) : (
                <>Maksimum Tier Tercapai</>
              )}
            </span>
            <span>
              {dreamRankProfile.progress.nextRank ? `${dreamRankProfile.progress.nextRank} (${dreamRankProfile.progress.nextRankMinRating} RR)` : "TOP"}
            </span>
          </div>
        </div>

        {/* DREAMRANK Audit History Ledger */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 text-text-secondary text-xs font-mono font-bold uppercase">
              <History className="w-3.5 h-3.5 text-text-muted" />
              <span>Riwayat Perubahan Rating (Rank History)</span>
            </div>
            <span className="text-[10px] font-mono text-text-muted">
              {dreamRankProfile.history.length} Catatan Audit
            </span>
          </div>

          {dreamRankProfile.history.length === 0 ? (
            <div className="p-4 text-center bg-surface-dark/40 border border-surface-border rounded-[4px]">
              <p className="text-xs text-text-secondary font-mono">
                Belum ada catatan perubahan rating kompetitif untuk member ini.
              </p>
            </div>
          ) : (
            <div className="bg-surface-dark/40 border border-surface-border rounded-[4px] overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface-dark border-b border-surface-border text-text-muted uppercase font-mono text-[10px]">
                  <tr>
                    <th className="px-3.5 py-2">Perubahan (RR)</th>
                    <th className="px-3.5 py-2">Transisi Rank</th>
                    <th className="px-3.5 py-2">Alasan / Sumber</th>
                    <th className="px-3.5 py-2 text-right">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border font-mono">
                  {dreamRankProfile.history.map((hist) => (
                    <tr key={hist.id} className="hover:bg-surface-hover/50 transition-colors">
                      <td className="px-3.5 py-2 font-bold">
                        <span
                          className={
                            hist.change > 0
                              ? "text-emerald-400"
                              : hist.change < 0
                              ? "text-rose-400"
                              : "text-text-muted"
                          }
                        >
                          {hist.change > 0 ? `+${hist.change}` : hist.change} RR
                        </span>
                      </td>
                      <td className="px-3.5 py-2 text-text-secondary">
                        <span className="text-text-muted">{hist.previousRank} ({hist.previousRating})</span>
                        <span className="mx-1.5 text-text-muted">→</span>
                        <span className="text-text-primary font-bold">{hist.newRank} ({hist.newRating})</span>
                      </td>
                      <td className="px-3.5 py-2 text-text-primary font-sans text-xs">
                        {hist.reason}
                      </td>
                      <td className="px-3.5 py-2 text-right text-text-muted text-[11px]">
                        {formatDateTime(hist.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Team / Clan Esport Section */}
      <div className="bg-surface-card border border-surface-border p-5 rounded-[4px] space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-3.5 bg-persona-blue persona-slash rounded-[1px]"></div>
            <h2 className="text-xs font-mono font-bold tracking-wider text-text-primary uppercase flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-persona-blue" />
              <span>Tim & Clan Esport</span>
            </h2>
          </div>
          <span className="text-[10px] font-mono text-text-muted">
            {teams?.length || 0} Keanggotaan Tim
          </span>
        </div>

        {(!teams || teams.length === 0) ? (
          <div className="p-4 text-center bg-surface-dark/40 border border-surface-border rounded-[4px]">
            <p className="text-xs text-text-secondary font-mono">
              Member ini belum terdaftar dalam tim atau clan esport manapun.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {teams.map((t) => (
              <div
                key={t.id}
                className="bg-surface-dark/60 border border-surface-border p-3.5 rounded-[4px] flex items-center justify-between gap-3 hover:border-surface-border-active transition-all"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold px-1.5 py-0.2 rounded bg-surface-dark border border-persona-blue/40 text-persona-blue">
                      #{t.teamTag}
                    </span>
                    <h4 className="text-xs font-bold text-text-primary truncate">{t.teamName}</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-text-muted mt-1 font-mono">
                    <span
                      className={`px-1 py-0.2 rounded font-bold ${
                        t.role === "OWNER"
                          ? "text-amber-400 bg-amber-950/40 border border-amber-800/40"
                          : "text-text-secondary bg-surface-dark border border-surface-border"
                      }`}
                    >
                      {t.role}
                    </span>
                    <span>• {t.memberCount} Player</span>
                  </div>
                </div>

                <Link href={`/teams/${t.teamId}`}>
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2 shrink-0">
                    <span>Lihat Tim</span>
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface-card border border-surface-border p-3.5 rounded-[4px]">
          <div className="flex items-center justify-between text-text-muted mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Play Duration</span>
            <Clock className="w-3.5 h-3.5 text-text-secondary" />
          </div>
          <div className="text-lg font-bold text-text-primary font-mono">
            {stats.totalPlayHours} Jam
          </div>
          <div className="text-[10px] text-text-muted mt-0.5">
            {stats.totalPlayMinutes} Menit bermain
          </div>
        </div>

        <div className="bg-surface-card border border-surface-border p-3.5 rounded-[4px]">
          <div className="flex items-center justify-between text-text-muted mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Total Sesi</span>
            <Gamepad2 className="w-3.5 h-3.5 text-persona-blue" />
          </div>
          <div className="text-lg font-bold text-persona-blue font-mono">
            {stats.totalSessions} Sesi
          </div>
          <div className="text-[10px] text-text-muted mt-0.5">Aktivitas game tercatat</div>
        </div>

        <div className="bg-surface-card border border-surface-border p-3.5 rounded-[4px]">
          <div className="flex items-center justify-between text-text-muted mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Games Played</span>
            <Swords className="w-3.5 h-3.5 text-persona-red" />
          </div>
          <div className="text-lg font-bold text-persona-red font-mono">
            {gamesPlayed.length} Judul
          </div>
          <div className="text-[10px] text-text-muted mt-0.5">Pernah dimainkan</div>
        </div>

        <div className="bg-surface-card border border-surface-border p-3.5 rounded-[4px]">
          <div className="flex items-center justify-between text-text-muted mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Favorite Game</span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-text-primary truncate font-mono">
            {favoriteGames[0]?.gameTitle || "-"}
          </div>
          <div className="text-[10px] text-text-muted mt-0.5">
            {favoriteGames[0] ? `${favoriteGames[0].totalPlayHours} Jam main` : "Belum ada sesi"}
          </div>
        </div>
      </div>

      {/* Grid: Games Played & Favorite Games */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Games Played List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-3.5 bg-persona-blue persona-slash rounded-[1px]"></div>
              <h2 className="text-xs font-mono font-bold tracking-wider text-text-primary uppercase">
                Riwayat Game & Statistik Jam Terbang
              </h2>
            </div>
            <span className="text-[11px] font-mono text-text-muted">
              {gamesPlayed.length} Game terdata
            </span>
          </div>

          {gamesPlayed.length === 0 ? (
            <div className="p-8 text-center bg-surface-card border border-surface-border rounded-[4px]">
              <Gamepad2 className="w-6 h-6 text-text-muted mx-auto mb-2" />
              <p className="text-xs text-text-secondary">
                Belum ada statistik game untuk member ini. Sesi bermain dengan game terpilih akan otomatis mencatat jam terbang di sini.
              </p>
            </div>
          ) : (
            <div className="bg-surface-card border border-surface-border rounded-[4px] overflow-hidden divide-y divide-surface-border">
              {gamesPlayed.map((stat, idx) => (
                <div
                  key={stat.id}
                  className="p-3.5 hover:bg-surface-hover transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-center text-xs font-mono font-bold text-text-muted shrink-0">
                      #{idx + 1}
                    </span>

                    <div className="w-9 h-9 rounded bg-surface-dark border border-surface-border flex items-center justify-center font-mono font-bold text-xs text-text-secondary shrink-0">
                      {stat.gameTitle.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-text-primary truncate">
                        {stat.gameTitle}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-text-muted mt-0.5">
                        <span className="font-mono px-1 py-0.2 bg-surface-dark rounded text-text-secondary">
                          {stat.gameGenre}
                        </span>
                        {stat.lastPlayedAt && (
                          <span>Terakhir: {stat.lastPlayedAt.slice(0, 10)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right shrink-0">
                    <div>
                      <span className="text-xs font-bold font-mono text-text-primary block">
                        {stat.totalPlayHours} Jam
                      </span>
                      <span className="text-[10px] text-text-muted font-mono block">
                        {stat.totalSessions} Sesi
                      </span>
                    </div>

                    <div className="w-16">
                      <span className="text-xs font-bold font-mono text-persona-blue block">
                        +{stat.xp} XP
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Top 3 Highlights */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-3.5 bg-persona-red persona-slash rounded-[1px]"></div>
            <h2 className="text-xs font-mono font-bold tracking-wider text-text-primary uppercase">
              Top 3 Most Played
            </h2>
          </div>

          {favoriteGames.length === 0 ? (
            <div className="p-6 text-center bg-surface-card border border-surface-border rounded-[4px]">
              <Flame className="w-5 h-5 text-text-muted mx-auto mb-1.5" />
              <p className="text-xs text-text-muted">Belum ada data favorit</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {favoriteGames.map((fav, i) => (
                <div
                  key={fav.id}
                  className="bg-surface-card border border-surface-border p-3 rounded-[4px] relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        i === 0
                          ? "bg-amber-400/10 text-amber-400 border border-amber-400/30"
                          : i === 1
                          ? "bg-zinc-300/10 text-zinc-300 border border-zinc-400/30"
                          : "bg-amber-700/10 text-amber-600 border border-amber-700/30"
                      }`}
                    >
                      RANK #{i + 1}
                    </span>
                    <span className="text-[10px] font-mono text-persona-blue font-bold">
                      +{fav.xp} XP
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-text-primary">{fav.gameTitle}</h4>
                  <p className="text-[10px] text-text-muted">{fav.gameGenre}</p>

                  <div className="mt-2 pt-2 border-t border-surface-border flex justify-between text-[11px] font-mono">
                    <span className="text-text-muted">Total Jam:</span>
                    <span className="text-text-secondary font-bold">{fav.totalPlayHours} Jam ({fav.totalSessions} Sesi)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-3.5 bg-emerald-500 persona-slash rounded-[1px]"></div>
            <h2 className="text-xs font-mono font-bold tracking-wider text-text-primary uppercase">
              Riwayat Aktivitas Sesi Terkini
            </h2>
          </div>
          <span className="text-[11px] font-mono text-text-muted">
            10 Aktivitas Terakhir
          </span>
        </div>

        {recentActivity.length === 0 ? (
          <div className="p-8 text-center bg-surface-card border border-surface-border rounded-[4px]">
            <Clock className="w-6 h-6 text-text-muted mx-auto mb-2" />
            <p className="text-xs text-text-secondary">
              Member ini belum memiliki riwayat sesi bermain di DREAMCAFÉ.
            </p>
          </div>
        ) : (
          <div className="bg-surface-card border border-surface-border rounded-[4px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface-dark border-b border-surface-border text-text-muted uppercase font-mono text-[10px]">
                  <tr>
                    <th className="px-4 py-2.5">Sesi / Ref</th>
                    <th className="px-4 py-2.5">Game</th>
                    <th className="px-4 py-2.5">Station</th>
                    <th className="px-4 py-2.5">Durasi</th>
                    <th className="px-4 py-2.5">Waktu Mulai</th>
                    <th className="px-4 py-2.5">XP Earned</th>
                    <th className="px-4 py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {recentActivity.map((act) => (
                    <tr key={act.id} className="hover:bg-surface-hover transition-colors">
                      <td className="px-4 py-2.5 font-mono text-text-secondary font-medium">
                        {act.sessionNumber}
                      </td>
                      <td className="px-4 py-2.5 text-text-primary font-medium">
                        {act.gameTitle || "-"}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-text-muted">
                        <span className="px-1.5 py-0.5 bg-surface-dark border border-surface-border rounded text-[11px]">
                          {act.stationType} {act.stationNumber}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-text-secondary">
                        {act.durationMinutes} Menit
                      </td>
                      <td className="px-4 py-2.5 text-text-muted text-[11px]">
                        {formatDateTime(act.startTime)}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-persona-blue font-bold">
                        {act.xpEarned > 0 ? `+${act.xpEarned} XP` : "0 XP"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded ${
                            act.status === "ACTIVE"
                              ? "bg-amber-950/40 text-amber-400 border border-amber-800/40"
                              : act.status === "COMPLETED"
                              ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/40"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {act.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
