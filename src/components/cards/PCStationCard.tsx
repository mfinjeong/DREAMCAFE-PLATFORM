"use client";

import React, { useState, useEffect } from "react";
import { PCStation } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
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
    <div
      className={`rounded-[3px] border bg-[#12141c] p-3 flex flex-col justify-between transition-colors ${
        pc.status === "IN_USE"
          ? "border-[#3a1d23]"
          : pc.status === "MAINTENANCE"
          ? "border-[#382b13]"
          : "border-[#202432] hover:border-[#2d3245]"
      }`}
    >
      {/* Top: Station & Status */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-sm font-bold text-white font-mono tracking-tight block">
            {pc.stationNumber}
          </span>
          <span className="text-[10px] font-mono text-[#8a8f9d] uppercase tracking-wider block">
            {pc.zone}
          </span>
        </div>
        <StatusBadge status={pc.status} />
      </div>

      {/* Middle: Content tailored exactly to operator scanability */}
      <div className="my-2.5 py-2 border-t border-b border-[#1c1f2b] min-h-[70px] flex flex-col justify-center">
        {pc.status === "IN_USE" ? (
          <div className="space-y-1">
            <div className="font-semibold text-white text-xs truncate">
              {pc.activeSession?.memberName || pc.activeSession?.guestName || "Guest"}
            </div>
            <div className="text-[#8a8f9d] text-[11px] truncate">
              {pc.currentGame || pc.activeSession?.currentGame || "Game"}
            </div>
            <div className="flex items-center justify-between pt-0.5 font-mono text-[11px]">
              <span className="text-[#f87171] font-semibold">
                {formatCountdown(secondsRemaining)}
              </span>
              <span className="text-zinc-200">
                {formatRupiah(pc.activeSession?.totalPrice || pc.hourlyRate)}
              </span>
            </div>
          </div>
        ) : pc.status === "AVAILABLE" ? (
          <div className="py-1">
            <span className="text-xs font-mono text-[#8a8f9d] block">
              {formatRupiah(pc.hourlyRate)} / hour
            </span>
          </div>
        ) : pc.status === "MAINTENANCE" ? (
          <div className="py-1">
            <span className="text-xs text-[#fbbf24]/90 block">
              Under maintenance
            </span>
          </div>
        ) : (
          <div className="py-1">
            <span className="text-xs text-[#717684] block">
              Offline
            </span>
          </div>
        )}
      </div>

      {/* Bottom: Action */}
      <div>
        {pc.status === "AVAILABLE" ? (
          <button
            onClick={() => onStartSession?.(pc)}
            className="w-full bg-[#b91c1c] hover:bg-[#991b1b] text-white text-xs font-semibold py-1.5 px-3 rounded-[2px] transition-colors uppercase tracking-wider font-mono"
          >
            START
          </button>
        ) : pc.status === "IN_USE" ? (
          <button
            onClick={() => onViewDetail?.(pc)}
            className="w-full bg-[#181a24] hover:bg-[#222533] text-zinc-200 border border-[#2b3040] text-xs font-medium py-1.5 px-3 rounded-[2px] transition-colors uppercase tracking-wider font-mono"
          >
            DETAIL
          </button>
        ) : (
          <button
            onClick={() => onViewDetail?.(pc)}
            className="w-full bg-[#181a24] hover:bg-[#222533] text-zinc-300 border border-[#2b3040] text-xs font-medium py-1.5 px-3 rounded-[2px] transition-colors uppercase tracking-wider font-mono"
          >
            VIEW
          </button>
        )}
      </div>
    </div>
  );
};
