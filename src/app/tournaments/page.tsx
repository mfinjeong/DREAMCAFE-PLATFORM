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
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-3.5 bg-persona-red persona-slash" />
        <h2 className="text-sm font-bold text-text-primary tracking-tight font-sans">
          Tournaments & Esports Roster
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-surface-border pb-1.5 text-xs font-sans">
        <button
          onClick={() => setActiveTab("tournaments")}
          className={`px-3 py-1.5 rounded-[6px] transition-colors cursor-pointer text-xs font-medium ${
            activeTab === "tournaments"
              ? "bg-persona-red-subtle text-white border-l-2 border-persona-red"
              : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
          }`}
        >
          Active Tournaments ({tournaments.length})
        </button>
        <button
          onClick={() => setActiveTab("teams")}
          className={`px-3 py-1.5 rounded-[6px] transition-colors cursor-pointer text-xs font-medium ${
            activeTab === "teams"
              ? "bg-persona-red-subtle text-white border-l-2 border-persona-red"
              : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
          }`}
        >
          Teams & Clans ({teams.length})
        </button>
        <button
          onClick={() => setActiveTab("games")}
          className={`px-3 py-1.5 rounded-[6px] transition-colors cursor-pointer text-xs font-medium ${
            activeTab === "games"
              ? "bg-persona-red-subtle text-white border-l-2 border-persona-red"
              : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
          }`}
        >
          Game Titles ({games.length})
        </button>
      </div>

      {activeTab === "tournaments" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tournaments.map((t) => (
            <div
              key={t.id}
              className="relative p-3.5 bg-surface border border-surface-border rounded-[6px] flex flex-col justify-between overflow-hidden"
            >
              {/* Subtle angular corner accent */}
              <div
                className="absolute top-0 right-0 w-3 h-3 bg-persona-red opacity-80"
                style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
              />

              <div>
                <div className="flex items-center justify-between mb-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded-[4px] bg-persona-red/15 text-persona-red border border-persona-red/30 font-semibold text-[10px] uppercase tracking-wider">
                    {t.status}
                  </span>
                  <span className="text-text-muted font-mono">{formatDateTime(t.startDate)}</span>
                </div>

                <h3 className="text-sm font-bold text-text-primary mb-1">{t.title}</h3>
                <p className="text-xs text-text-muted mb-3">{t.rules}</p>

                <div className="grid grid-cols-2 gap-2 p-2.5 bg-background rounded-[6px] border border-surface-border text-xs mb-3">
                  <div>
                    <span className="text-text-dim text-[10px] uppercase font-mono block">Prize Pool</span>
                    <span className="font-bold font-mono text-persona-red">{formatRupiah(t.prizePool)}</span>
                  </div>
                  <div>
                    <span className="text-text-dim text-[10px] uppercase font-mono block">Slot Fee</span>
                    <span className="font-bold font-mono text-text-primary">{formatRupiah(t.entryFee)}</span>
                  </div>
                  <div>
                    <span className="text-text-dim text-[10px] uppercase font-mono block">Format</span>
                    <span className="text-text-primary font-medium">{t.format}</span>
                  </div>
                  <div>
                    <span className="text-text-dim text-[10px] uppercase font-mono block">Capacity</span>
                    <span className="text-text-primary font-mono">{t.maxTeams} Teams</span>
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
                  {team.leaderName}
                </TableCell>
                <TableCell className="font-mono text-text-muted text-xs">
                  {team.memberCount} players
                </TableCell>
                <TableCell className="font-mono text-xs">
                  <span className="text-p3r-blue font-bold">{team.wins}W</span> -{" "}
                  <span className="text-persona-red font-bold">{team.losses}L</span>
                </TableCell>
                <TableCell className="font-mono font-bold text-text-primary">
                  {team.eloRating}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {games.map((g) => (
            <div key={g.id} className="p-3.5 bg-surface border border-surface-border rounded-[6px]">
              <div className="flex items-start justify-between mb-1">
                <span className="text-xs font-bold text-text-primary">{g.title}</span>
                <span className="text-[10px] font-mono text-text-dim">#{g.popularityRank}</span>
              </div>
              <div className="text-[11px] text-text-muted mb-2.5">{g.genre} • {g.publisher}</div>

              <div className="p-2.5 bg-background rounded-[6px] border border-surface-border text-xs space-y-1">
                <div className="flex justify-between text-text-muted">
                  <span className="text-[11px]">Min GPU:</span>
                  <span className="font-mono text-text-primary text-[11px]">{g.minGpuRequired}</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span className="text-[11px]">PC:</span>
                  <span className={`text-[11px] font-mono ${g.isInstalledOnPc ? "text-p3r-blue font-medium" : "text-text-dim"}`}>
                    {g.isInstalledOnPc ? "Installed" : "No"}
                  </span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span className="text-[11px]">Console:</span>
                  <span className={`text-[11px] font-mono ${g.isInstalledConsole ? "text-p3r-blue font-medium" : "text-text-dim"}`}>
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
