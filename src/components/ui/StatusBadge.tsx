import React from "react";
import { PCStatus, SessionStatus, BookingStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: PCStatus | SessionStatus | BookingStatus | string;
  size?: "sm" | "md";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const s = status.toUpperCase();

  let styles = "bg-[#181a20] text-zinc-400 border-[#262830]";
  let label = s;

  if (s === "AVAILABLE") {
    styles = "bg-[#0d1f17] text-emerald-400 border-emerald-900/60";
    label = "AVAILABLE";
  } else if (s === "IN_USE" || s === "ACTIVE") {
    styles = "bg-[#201014] text-red-400 border-red-900/60 font-semibold";
    label = "IN USE";
  } else if (s === "MAINTENANCE") {
    styles = "bg-[#1f190e] text-amber-400 border-amber-900/60";
    label = "MAINTENANCE";
  } else if (s === "OFFLINE") {
    styles = "bg-[#121316] text-zinc-500 border-zinc-800";
    label = "OFFLINE";
  } else if (s === "COMPLETED" || s === "CONFIRMED") {
    styles = "bg-[#0d1f17] text-emerald-400 border-emerald-900/60";
    label = s;
  } else if (s === "CANCELLED") {
    styles = "bg-[#201014] text-red-400 border-red-900/60";
    label = "CANCELLED";
  }

  return (
    <span
      className={`inline-block text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded border uppercase ${styles}`}
    >
      {label}
    </span>
  );
};
