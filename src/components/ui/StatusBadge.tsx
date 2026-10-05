import React from "react";
import { PCStatus, SessionStatus, BookingStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: PCStatus | SessionStatus | BookingStatus | string;
  size?: "sm" | "md";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const s = status.toUpperCase();

  let styles = "bg-[#17191C] text-[#8A909A] border-[#25282E]";
  let dotColor = "bg-[#585C66]";
  let label = s;

  if (s === "AVAILABLE") {
    styles = "bg-[#141715] text-[#9CB1A3] border-[#232B25]";
    dotColor = "bg-[#3D7453]";
    label = "AVAILABLE";
  } else if (s === "IN_USE" || s === "ACTIVE") {
    styles = "bg-[#1E1214] text-[#D15E65] border-[#3B1C20]";
    dotColor = "bg-[#B4232A]";
    label = "IN USE";
  } else if (s === "MAINTENANCE") {
    styles = "bg-[#1C1813] text-[#BFA779] border-[#332A1C]";
    dotColor = "bg-[#8A6F3C]";
    label = "MAINTENANCE";
  } else if (s === "OFFLINE") {
    styles = "bg-[#17191C] text-[#70757F] border-[#25282E]";
    dotColor = "bg-[#4B4F58]";
    label = "OFFLINE";
  } else if (s === "COMPLETED" || s === "CONFIRMED") {
    styles = "bg-[#141715] text-[#9CB1A3] border-[#232B25]";
    dotColor = "bg-[#3D7453]";
    label = s;
  } else if (s === "CANCELLED") {
    styles = "bg-[#1E1214] text-[#D15E65] border-[#3B1C20]";
    dotColor = "bg-[#B4232A]";
    label = "CANCELLED";
  } else if (s === "PENDING") {
    styles = "bg-[#1C1813] text-[#BFA779] border-[#332A1C]";
    dotColor = "bg-[#8A6F3C]";
    label = "PENDING";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded-[4px] border uppercase ${styles}`}
    >
      <span className={`w-1 h-1 rounded-full ${dotColor}`}></span>
      <span>{label}</span>
    </span>
  );
};
