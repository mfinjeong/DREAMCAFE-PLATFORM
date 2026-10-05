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
    <div className="rounded-[4px] border border-[#22252A] hover:border-[#31363F] bg-[#15171A] p-3 flex flex-col justify-between transition-colors">
      {/* Top: Station & Zone */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-[#EDEDEE] font-mono tracking-tight">
          {pc.stationNumber}
        </span>
        <span className="text-[10px] font-mono text-[#8A909A] uppercase tracking-wider bg-[#111317] border border-[#22252A] px-1.5 py-0.5 rounded-[3px]">
          {pc.zone}
        </span>
      </div>

      {/* Status indicator */}
      <div className="mt-2.5">
        <StatusBadge status={pc.status} />
      </div>

      {/* Middle: Content */}
      <div className="my-2.5 py-2 border-t border-b border-[#1E2126] min-h-[64px] flex flex-col justify-center">
        {pc.status === "IN_USE" ? (
          <div className="space-y-1">
            <div className="font-semibold text-[#EDEDEE] text-xs truncate">
              {pc.activeSession?.memberName || pc.activeSession?.guestName || "Guest"}
            </div>
            <div className="text-[#8A909A] text-[11px] truncate">
              {pc.currentGame || pc.activeSession?.currentGame || "Game"}
            </div>
            <div className="flex items-center justify-between pt-1 font-mono text-[11px]">
              <span className="text-[#D15E65] font-semibold">
                {formatCountdown(secondsRemaining)}
              </span>
              <span className="text-[#8A909A]">
                {formatRupiah(pc.activeSession?.totalPrice || pc.hourlyRate)}
              </span>
            </div>
          </div>
        ) : pc.status === "AVAILABLE" ? (
          <div className="py-1">
            <span className="text-xs font-mono text-[#8A909A] block">
              {formatRupiah(pc.hourlyRate)} / hour
            </span>
          </div>
        ) : pc.status === "MAINTENANCE" ? (
          <div className="py-1">
            <span className="text-xs text-[#8A909A] block font-mono">
              Under maintenance
            </span>
          </div>
        ) : (
          <div className="py-1">
            <span className="text-xs text-[#585C66] block font-mono">
              Offline
            </span>
          </div>
        )}
      </div>

      {/* Bottom Action */}
      <div>
        {pc.status === "AVAILABLE" ? (
          <button
            onClick={() => onStartSession?.(pc)}
            className="w-full bg-[#B4232A] hover:bg-[#961C22] text-[#EDEDEE] text-xs font-semibold py-1.5 px-3 rounded-[4px] transition-colors uppercase tracking-wider font-mono cursor-pointer"
          >
            START
          </button>
        ) : pc.status === "IN_USE" ? (
          <button
            onClick={() => onViewDetail?.(pc)}
            className="w-full bg-[#111317] hover:bg-[#1A1D22] text-[#EDEDEE] border border-[#22252A] text-xs font-medium py-1.5 px-3 rounded-[4px] transition-colors uppercase tracking-wider font-mono cursor-pointer"
          >
            DETAIL
          </button>
        ) : (
          <button
            onClick={() => onViewDetail?.(pc)}
            className="w-full bg-[#111317] hover:bg-[#1A1D22] text-[#8A909A] hover:text-[#EDEDEE] border border-[#22252A] text-xs font-medium py-1.5 px-3 rounded-[4px] transition-colors uppercase tracking-wider font-mono cursor-pointer"
          >
            VIEW
          </button>
        )}
      </div>
    </div>
  );
};
