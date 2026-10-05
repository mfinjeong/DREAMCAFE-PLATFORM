"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { PCStation, PCStatus } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatRupiah } from "@/lib/formatters";

interface PCDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  pc: PCStation | null;
  onStatusChange: (pcId: string, newStatus: PCStatus) => Promise<void>;
}

export const PCDetailModal: React.FC<PCDetailModalProps> = ({
  isOpen,
  onClose,
  pc,
  onStatusChange,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<PCStatus | "">("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!pc) return null;

  const handleUpdateStatus = async () => {
    if (!selectedStatus || selectedStatus === pc.status) return;
    setErrorMsg(null);
    try {
      setIsUpdating(true);
      await onStatusChange(pc.id, selectedStatus as PCStatus);
      setSelectedStatus("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Failed to update status.");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${pc.stationNumber} • ${pc.name}`}
      subtitle={`Zone: ${pc.zone}`}
      maxWidth="md"
    >
      <div className="space-y-3">
        {errorMsg && (
          <div className="p-2 bg-[#1E1214] border border-[#3B1C20] rounded-[4px] text-[11px] text-[#D15E65] font-mono">
            {errorMsg}
          </div>
        )}

        {/* Primary Operational Section */}
        <div className="p-3 bg-[#111317] border border-[#22252A] rounded-[4px] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#8A909A] tracking-wider font-semibold">
              Current Session
            </span>
            <StatusBadge status={pc.status} />
          </div>

          {pc.status === "IN_USE" && pc.activeSession ? (
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 font-mono">
              <div>
                <span className="text-[10px] text-[#585C66] block">Member</span>
                <span className="text-[#EDEDEE] font-medium">
                  {pc.activeSession.memberName || pc.activeSession.guestName || "Guest"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#585C66] block">Active Game</span>
                <span className="text-[#EDEDEE]">
                  {pc.currentGame || pc.activeSession.currentGame || "Game"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#585C66] block">Duration / Remaining</span>
                <span className="text-[#D15E65]">
                  {pc.activeSession.durationMinutes}m ({pc.activeSession.remainingMinutes}m left)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#585C66] block">Session Amount</span>
                <span className="text-[#EDEDEE] font-semibold">
                  {formatRupiah(pc.activeSession.totalPrice)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs pt-1 font-mono">
              <span className="text-[#8A909A]">
                {pc.status === "AVAILABLE"
                  ? "No active session"
                  : pc.status === "MAINTENANCE"
                  ? "Station under maintenance"
                  : "Station offline"}
              </span>
              <span className="text-[#EDEDEE] font-medium">
                Rate: {formatRupiah(pc.hourlyRate)} / hr
              </span>
            </div>
          )}
        </div>

        {/* Secondary Section: Hardware Information */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8A909A] block font-semibold">
            Hardware Specifications
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 bg-[#111317] border border-[#22252A] rounded-[4px]">
              <span className="text-[9px] text-[#585C66] uppercase block">CPU</span>
              <span className="text-[#EDEDEE] text-[11px] truncate block">{pc.specsCpu}</span>
            </div>
            <div className="p-2 bg-[#111317] border border-[#22252A] rounded-[4px]">
              <span className="text-[9px] text-[#585C66] uppercase block">GPU</span>
              <span className="text-[#EDEDEE] text-[11px] truncate block">{pc.specsGpu}</span>
            </div>
            <div className="p-2 bg-[#111317] border border-[#22252A] rounded-[4px]">
              <span className="text-[9px] text-[#585C66] uppercase block">RAM</span>
              <span className="text-[#EDEDEE] text-[11px]">{pc.specsRam}</span>
            </div>
            <div className="p-2 bg-[#111317] border border-[#22252A] rounded-[4px]">
              <span className="text-[9px] text-[#585C66] uppercase block">Monitor</span>
              <span className="text-[#EDEDEE] text-[11px] truncate block">{pc.specsMonitor}</span>
            </div>
            <div className="p-2 bg-[#111317] border border-[#22252A] rounded-[4px]">
              <span className="text-[9px] text-[#585C66] uppercase block">Storage</span>
              <span className="text-[#EDEDEE] text-[11px]">{pc.specsStorage}</span>
            </div>
            <div className="p-2 bg-[#111317] border border-[#22252A] rounded-[4px]">
              <span className="text-[9px] text-[#585C66] uppercase block">Peripherals</span>
              <span className="text-[#EDEDEE] text-[11px] truncate block">{pc.specsPeripherals}</span>
            </div>
          </div>
        </div>

        {/* Network & Diagnostics */}
        <div className="p-2 bg-[#111317] border border-[#22252A] rounded-[4px] flex items-center justify-between text-[11px] font-mono text-[#8A909A]">
          <span>IP: <strong className="text-[#EDEDEE] font-normal">{pc.ipAddress || "-"}</strong></span>
          <span>MAC: <strong className="text-[#EDEDEE] font-normal">{pc.macAddress || "-"}</strong></span>
        </div>

        {/* Status Control */}
        <div className="pt-2 border-t border-[#22252A]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8A909A] block mb-1 font-semibold">
            Station Status
          </span>
          <div className="flex items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as PCStatus)}
              className="flex-1 bg-[#111317] border border-[#22252A] rounded-[4px] px-2.5 py-1.5 text-xs text-[#EDEDEE] focus:outline-none focus:border-[#B4232A] font-mono"
            >
              <option value="">Select status...</option>
              <option value="AVAILABLE" disabled={pc.status === "AVAILABLE"}>
                AVAILABLE
              </option>
              <option value="MAINTENANCE" disabled={pc.status === "MAINTENANCE" || pc.status === "IN_USE"}>
                MAINTENANCE
              </option>
              <option value="OFFLINE" disabled={pc.status === "OFFLINE" || pc.status === "IN_USE"}>
                OFFLINE
              </option>
            </select>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleUpdateStatus}
              disabled={!selectedStatus || isUpdating}
              isLoading={isUpdating}
            >
              Update
            </Button>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-[#22252A]">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
