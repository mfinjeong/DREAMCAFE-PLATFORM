"use client";

import React, { useState } from "react";
import { store } from "@/lib/data-store";
import { TournamentItem, TeamItem, GameItem } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { formatRupiah, formatDateTime } from "@/lib/formatters";

export default function TournamentsPage() {
  const [tournaments] = useState<TournamentItem[]>(store.tournaments);
  const [teams] = useState<TeamItem[]>(store.teams);
  const [games] = useState<GameItem[]>(store.games);
  const [activeTab, setActiveTab] = useState<"tournaments" | "teams" | "games">("tournaments");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-mono">
          Tournaments & Teams
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-[#1a1d27] pb-1.5 text-xs font-mono">
        <button
          onClick={() => setActiveTab("tournaments")}
          className={`px-2.5 py-1 rounded transition-colors ${
            activeTab === "tournaments"
              ? "bg-[#181a24] text-white font-medium border-l-2 border-red-600"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Tournaments ({tournaments.length})
        </button>
        <button
          onClick={() => setActiveTab("teams")}
          className={`px-2.5 py-1 rounded transition-colors ${
            activeTab === "teams"
              ? "bg-[#181a24] text-white font-medium border-l-2 border-red-600"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Teams & Clans ({teams.length})
        </button>
        <button
          onClick={() => setActiveTab("games")}
          className={`px-2.5 py-1 rounded transition-colors ${
            activeTab === "games"
              ? "bg-[#181a24] text-white font-medium border-l-2 border-red-600"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Games ({games.length})
        </button>
      </div>

      {activeTab === "tournaments" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tournaments.map((t) => (
            <div
              key={t.id}
              className="p-3.5 bg-[#10121a] border border-[#1e222e] rounded flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5 font-mono text-[10px]">
                  <span className="px-1.5 py-0.2 rounded bg-[#251014] text-red-400 border border-red-900/60 font-semibold">
                    {t.status}
                  </span>
                  <span className="text-zinc-500">{formatDateTime(t.startDate)}</span>
                </div>

                <h3 className="text-sm font-bold text-white mb-1">{t.title}</h3>
                <p className="text-[11px] text-zinc-400 mb-3">{t.rules}</p>

                <div className="grid grid-cols-2 gap-2 p-2 bg-[#0a0b10] rounded border border-[#181a24] text-xs font-mono mb-3">
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Prize Pool:</span>
                    <span className="font-bold text-white">{formatRupiah(t.prizePool)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Slot Fee:</span>
                    <span className="font-bold text-white">{formatRupiah(t.entryFee)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Format:</span>
                    <span className="text-zinc-300">{t.format}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Max:</span>
                    <span className="text-zinc-300">{t.maxTeams} Teams</span>
                  </div>
                </div>
              </div>

              <Button variant="primary" size="sm" className="w-full">
                Register Team
              </Button>
            </div>
          ))}
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
              <TableHead>W / L</TableHead>
              <TableHead>ELO</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {teams.map((team, idx) => (
              <TableRow key={team.id}>
                <TableCell className="font-mono font-bold text-zinc-400">
                  #{idx + 1}
                </TableCell>
                <TableCell className="font-bold text-white">
                  {team.name}
                </TableCell>
                <TableCell className="font-mono text-zinc-400">
                  [{team.tag}]
                </TableCell>
                <TableCell className="text-zinc-300 text-xs">
                  {team.leaderName}
                </TableCell>
                <TableCell className="font-mono text-zinc-400 text-xs">
                  {team.memberCount} players
                </TableCell>
                <TableCell className="font-mono text-xs">
                  <span className="text-emerald-400 font-bold">{team.wins}W</span> -{" "}
                  <span className="text-red-400 font-bold">{team.losses}L</span>
                </TableCell>
                <TableCell className="font-mono font-bold text-white">
                  {team.eloRating}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {games.map((g) => (
            <div key={g.id} className="p-3 bg-[#10121a] border border-[#1e222e] rounded">
              <div className="flex items-start justify-between mb-1">
                <span className="text-xs font-bold text-white">{g.title}</span>
                <span className="text-[10px] font-mono text-zinc-500">#{g.popularityRank}</span>
              </div>
              <div className="text-[11px] text-zinc-400 mb-2">{g.genre} • {g.publisher}</div>

              <div className="p-2 bg-[#0a0b10] rounded border border-[#181a24] text-[11px] font-mono space-y-1 mb-2">
                <div className="flex justify-between text-zinc-400">
                  <span>Min GPU:</span>
                  <span className="text-zinc-200">{g.minGpuRequired}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>PC:</span>
                  <span className={g.isInstalledOnPc ? "text-emerald-400" : "text-zinc-500"}>
                    {g.isInstalledOnPc ? "Installed" : "No"}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Console:</span>
                  <span className={g.isInstalledConsole ? "text-emerald-400" : "text-zinc-500"}>
                    {g.isInstalledConsole ? "Installed" : "No"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
