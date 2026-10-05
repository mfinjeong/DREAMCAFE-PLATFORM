"use client";

import React, { useState, useEffect } from "react";
import { PCStation } from "@/lib/types";
import { formatRupiah, formatCountdown } from "@/lib/formatters";

interface PCStationCardProps {
  pc: PCStation;
  onStartSession?: (pc: PCStation) => void;
  onViewDetail?: (pc: PCStation) => void;
  onEndSession?: (pc: PCStation) => void;
  onAddTime?: (pc: PCStation) => void;
}

export const PCStationCard: React.FC<PCStationCardProps> = ({
  pc,
  onStartSession,
  onViewDetail,
  onEndSession,
  onAddTime,
}) => {
  // Live ticking countdown calculation
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    if (pc.status === "IN_USE" && pc.activeSession) {
      const start = new Date(pc.activeSession.startTime).getTime();
      const durationMs = pc.activeSession.durationMinutes * 60 * 1000;
      const end = start + durationMs;
      const leftSec = Math.max(0, Math.floor((end - Date.now()) / 1000));
      return leftSec > 0 ? leftSec : pc.activeSession.remainingMinutes * 60;
    }
    return 0;
  });

  useEffect(() => {
    if (pc.status !== "IN_USE") return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [pc.status]);

  return (
    <div className="bg-[#10121a] border border-[#1e222e] rounded p-3 flex flex-col justify-between select-none">
      {/* Station Number & Zone */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-sm font-bold text-zinc-100 block font-mono">
            {pc.stationNumber}
          </span>
          <span className="text-[10px] uppercase font-mono text-zinc-400 tracking-wider">
            {pc.zone}
          </span>
        </div>

        {/* Status Indicator */}
        <span
          className={`text-[10px] font-mono uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded border ${
            pc.status === "IN_USE"
              ? "text-red-400 bg-[#221014] border-red-900/60"
              : pc.status === "AVAILABLE"
              ? "text-emerald-400 bg-[#0d1f17] border-emerald-900/60"
              : pc.status === "MAINTENANCE"
              ? "text-amber-400 bg-[#1f190e] border-amber-900/60"
              : "text-zinc-500 bg-[#14151b] border-zinc-800"
          }`}
        >
          {pc.status === "IN_USE" ? "IN USE" : pc.status}
        </span>
      </div>

      {/* Main Body */}
      <div className="my-3 py-2 border-t border-b border-[#1a1d28] min-h-[76px] flex flex-col justify-center text-xs">
        {pc.status === "IN_USE" ? (
          <div className="space-y-1">
            <div className="font-semibold text-zinc-100 truncate">
              {pc.activeSession?.memberName || pc.activeSession?.guestName || "User"}
            </div>
            <div className="text-zinc-400 text-[11px] truncate">
              {pc.currentGame || pc.activeSession?.currentGame || "Game"}
            </div>
            <div className="flex items-center justify-between pt-1 text-[11px] font-mono">
              <span className="text-red-400 font-semibold">{formatCountdown(secondsRemaining)}</span>
              <span className="text-zinc-300 font-medium">
                {formatRupiah(pc.activeSession?.totalPrice || pc.hourlyRate)}
              </span>
            </div>
          </div>
        ) : pc.status === "AVAILABLE" ? (
          <div className="text-zinc-400 text-center py-1">
            <span className="text-zinc-400 text-xs font-mono">AVAILABLE</span>
          </div>
        ) : pc.status === "MAINTENANCE" ? (
          <div className="text-amber-400/90 text-center py-1 text-xs font-mono">
            MAINTENANCE
          </div>
        ) : (
          <div className="text-zinc-500 text-center py-1 text-xs font-mono">
            OFFLINE
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div>
        {pc.status === "AVAILABLE" ? (
          <button
            onClick={() => onStartSession?.(pc)}
            className="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-semibold py-1.5 px-3 rounded transition-colors uppercase tracking-wider"
          >
            START SESSION
          </button>
        ) : pc.status === "IN_USE" ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onViewDetail?.(pc)}
              className="flex-1 bg-[#181a24] hover:bg-[#202432] text-zinc-200 border border-[#272b3a] text-xs font-medium py-1 px-2 rounded transition-colors"
            >
              DETAIL
            </button>
            <button
              onClick={() => onAddTime?.(pc)}
              className="bg-[#181a24] hover:bg-[#202432] text-zinc-300 border border-[#272b3a] text-xs font-mono py-1 px-2 rounded transition-colors"
              title="Add Time"
            >
              +TIME
            </button>
            <button
              onClick={() => onEndSession?.(pc)}
              className="bg-[#3b1216] hover:bg-[#50171d] text-red-300 border border-red-900/60 text-xs font-medium py-1 px-2 rounded transition-colors"
              title="End Session"
            >
              END
            </button>
          </div>
        ) : (
          <button
            onClick={() => onViewDetail?.(pc)}
            className="w-full bg-[#181a24] hover:bg-[#202432] text-zinc-300 border border-[#272b3a] text-xs font-medium py-1 px-3 rounded transition-colors"
          >
            VIEW
          </button>
        )}
      </div>
    </div>
  );
};
