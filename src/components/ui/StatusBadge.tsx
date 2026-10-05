import React from "react";
import { PCStatus, SessionStatus, BookingStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: PCStatus | SessionStatus | BookingStatus | string;
  size?: "sm" | "md";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const s = status.toUpperCase();

  let styles = "bg-[#14161c] text-[#8a8f9d] border-[#252834]";
  let label = s;

  if (s === "AVAILABLE") {
    styles = "bg-[#0d1c15] text-[#34d399] border-[#1b382b]";
    label = "AVAILABLE";
  } else if (s === "IN_USE" || s === "ACTIVE") {
    styles = "bg-[#221014] text-[#f87171] border-[#44181f]";
    label = "IN USE";
  } else if (s === "MAINTENANCE") {
    styles = "bg-[#1d180d] text-[#fbbf24] border-[#3d2f14]";
    label = "MAINTENANCE";
  } else if (s === "OFFLINE") {
    styles = "bg-[#14161c] text-[#717684] border-[#22242c]";
    label = "OFFLINE";
  } else if (s === "COMPLETED" || s === "CONFIRMED") {
    styles = "bg-[#0d1c15] text-[#34d399] border-[#1b382b]";
    label = s;
  } else if (s === "CANCELLED") {
    styles = "bg-[#221014] text-[#f87171] border-[#44181f]";
    label = "CANCELLED";
  } else if (s === "PENDING") {
    styles = "bg-[#1d180d] text-[#fbbf24] border-[#3d2f14]";
    label = "PENDING";
  }

  return (
    <span
      className={`inline-block text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded-[2px] border uppercase ${styles}`}
    >
      {label}
    </span>
  );
};
