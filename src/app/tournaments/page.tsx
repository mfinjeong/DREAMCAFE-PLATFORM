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
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-[#EDEDEE] uppercase tracking-wider font-mono">
          Tournaments & Teams
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-[#22252A] pb-1.5 text-xs font-mono">
        <button
          onClick={() => setActiveTab("tournaments")}
          className={`px-2.5 py-1 rounded-[4px] transition-colors cursor-pointer ${
            activeTab === "tournaments"
              ? "bg-[#1E1214] text-[#EDEDEE] font-medium border-l-2 border-[#B4232A]"
              : "text-[#8A909A] hover:text-[#EDEDEE]"
          }`}
        >
          Tournaments ({tournaments.length})
        </button>
        <button
          onClick={() => setActiveTab("teams")}
          className={`px-2.5 py-1 rounded-[4px] transition-colors cursor-pointer ${
            activeTab === "teams"
              ? "bg-[#1E1214] text-[#EDEDEE] font-medium border-l-2 border-[#B4232A]"
              : "text-[#8A909A] hover:text-[#EDEDEE]"
          }`}
        >
          Teams & Clans ({teams.length})
        </button>
        <button
          onClick={() => setActiveTab("games")}
          className={`px-2.5 py-1 rounded-[4px] transition-colors cursor-pointer ${
            activeTab === "games"
              ? "bg-[#1E1214] text-[#EDEDEE] font-medium border-l-2 border-[#B4232A]"
              : "text-[#8A909A] hover:text-[#EDEDEE]"
          }`}
        >
          Games ({games.length})
        </button>
      </div>

      {activeTab === "tournaments" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {tournaments.map((t) => (
            <div
              key={t.id}
              className="p-3 bg-[#15171A] border border-[#22252A] rounded-[4px] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5 font-mono text-[10px]">
                  <span className="px-1.5 py-0.5 rounded-[3px] bg-[#1E1214] text-[#D15E65] border border-[#3B1C20] font-semibold">
                    {t.status}
                  </span>
                  <span className="text-[#8A909A]">{formatDateTime(t.startDate)}</span>
                </div>

                <h3 className="text-sm font-bold text-[#EDEDEE] mb-1 font-mono">{t.title}</h3>
                <p className="text-[11px] text-[#8A909A] mb-3">{t.rules}</p>

                <div className="grid grid-cols-2 gap-2 p-2 bg-[#111317] rounded-[4px] border border-[#22252A] text-xs font-mono mb-3">
                  <div>
                    <span className="text-[#585C66] text-[10px] block">Prize Pool:</span>
                    <span className="font-bold text-[#EDEDEE]">{formatRupiah(t.prizePool)}</span>
                  </div>
                  <div>
                    <span className="text-[#585C66] text-[10px] block">Slot Fee:</span>
                    <span className="font-bold text-[#EDEDEE]">{formatRupiah(t.entryFee)}</span>
                  </div>
                  <div>
                    <span className="text-[#585C66] text-[10px] block">Format:</span>
                    <span className="text-[#EDEDEE]">{t.format}</span>
                  </div>
                  <div>
                    <span className="text-[#585C66] text-[10px] block">Max:</span>
                    <span className="text-[#EDEDEE]">{t.maxTeams} Teams</span>
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
                <TableCell className="font-mono font-bold text-[#8A909A]">
                  #{idx + 1}
                </TableCell>
                <TableCell className="font-bold text-[#EDEDEE]">
                  {team.name}
                </TableCell>
                <TableCell className="font-mono text-[#8A909A]">
                  [{team.tag}]
                </TableCell>
                <TableCell className="text-[#EDEDEE] text-xs">
                  {team.leaderName}
                </TableCell>
                <TableCell className="font-mono text-[#8A909A] text-xs">
                  {team.memberCount} players
                </TableCell>
                <TableCell className="font-mono text-xs">
                  <span className="text-[#9CB1A3] font-bold">{team.wins}W</span> -{" "}
                  <span className="text-[#D15E65] font-bold">{team.losses}L</span>
                </TableCell>
                <TableCell className="font-mono font-bold text-[#EDEDEE]">
                  {team.eloRating}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {games.map((g) => (
            <div key={g.id} className="p-3 bg-[#15171A] border border-[#22252A] rounded-[4px]">
              <div className="flex items-start justify-between mb-1">
                <span className="text-xs font-bold text-[#EDEDEE] font-mono">{g.title}</span>
                <span className="text-[10px] font-mono text-[#585C66]">#{g.popularityRank}</span>
              </div>
              <div className="text-[11px] text-[#8A909A] mb-2">{g.genre} • {g.publisher}</div>

              <div className="p-2 bg-[#111317] rounded-[4px] border border-[#22252A] text-[11px] font-mono space-y-1 mb-2">
                <div className="flex justify-between text-[#8A909A]">
                  <span>Min GPU:</span>
                  <span className="text-[#EDEDEE]">{g.minGpuRequired}</span>
                </div>
                <div className="flex justify-between text-[#8A909A]">
                  <span>PC:</span>
                  <span className={g.isInstalledOnPc ? "text-[#9CB1A3]" : "text-[#585C66]"}>
                    {g.isInstalledOnPc ? "Installed" : "No"}
                  </span>
                </div>
                <div className="flex justify-between text-[#8A909A]">
                  <span>Console:</span>
                  <span className={g.isInstalledConsole ? "text-[#9CB1A3]" : "text-[#585C66]"}>
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
