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
      title={`${pc.stationNumber} Detail`}
      subtitle={`${pc.name} • ${pc.zone}`}
      maxWidth="md"
    >
      <div className="space-y-3.5">
        {errorMsg && (
          <div className="p-2 bg-[#251014] border border-red-900/60 rounded text-[11px] text-red-400 font-mono">
            {errorMsg}
          </div>
        )}

        {/* Status & Rate Bar */}
        <div className="flex items-center justify-between p-2.5 bg-[#0a0b10] border border-[#1b1e28] rounded">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400">Status:</span>
            <StatusBadge status={pc.status} />
          </div>
          <div className="text-right font-mono text-xs">
            <span className="text-zinc-400">Rate: </span>
            <span className="font-semibold text-white">{formatRupiah(pc.hourlyRate)}</span>/hr
          </div>
        </div>

        {/* Hardware Specifications */}
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1.5 font-semibold">
            Hardware Specifications
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-[#12141c] border border-[#1e222e] rounded">
              <span className="text-[10px] text-zinc-500 font-mono uppercase block">CPU</span>
              <span className="text-zinc-200">{pc.specsCpu}</span>
            </div>
            <div className="p-2 bg-[#12141c] border border-[#1e222e] rounded">
              <span className="text-[10px] text-zinc-500 font-mono uppercase block">GPU</span>
              <span className="text-zinc-200">{pc.specsGpu}</span>
            </div>
            <div className="p-2 bg-[#12141c] border border-[#1e222e] rounded">
              <span className="text-[10px] text-zinc-500 font-mono uppercase block">RAM</span>
              <span className="text-zinc-200">{pc.specsRam}</span>
            </div>
            <div className="p-2 bg-[#12141c] border border-[#1e222e] rounded">
              <span className="text-[10px] text-zinc-500 font-mono uppercase block">Monitor</span>
              <span className="text-zinc-200">{pc.specsMonitor}</span>
            </div>
            <div className="p-2 bg-[#12141c] border border-[#1e222e] rounded">
              <span className="text-[10px] text-zinc-500 font-mono uppercase block">Storage</span>
              <span className="text-zinc-200">{pc.specsStorage}</span>
            </div>
            <div className="p-2 bg-[#12141c] border border-[#1e222e] rounded">
              <span className="text-[10px] text-zinc-500 font-mono uppercase block">Peripherals</span>
              <span className="text-zinc-200">{pc.specsPeripherals}</span>
            </div>
          </div>
        </div>

        {/* Network Info */}
        <div className="p-2 bg-[#0a0b10] border border-[#1b1e28] rounded flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <div>IP: <span className="text-zinc-200">{pc.ipAddress || "-"}</span></div>
          <div>MAC: <span className="text-zinc-200">{pc.macAddress || "-"}</span></div>
        </div>

        {/* Change Status */}
        <div className="pt-2 border-t border-[#1b1e28]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1 font-semibold">
            Change Station Status
          </span>
          <div className="flex items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as PCStatus)}
              className="flex-1 bg-[#12141c] border border-[#202431] rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-red-600"
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

        <div className="flex justify-end pt-2 border-t border-[#1b1e28]">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
