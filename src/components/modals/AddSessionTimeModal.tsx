"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatRupiah } from "@/lib/formatters";

interface AddSessionTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: {
    id: string;
    stationNumber: string;
    userName: string;
    remainingMinutes: number;
    hourlyRate: number;
  } | null;
  onConfirmAddTime: (sessionId: string, additionalMinutes: number) => Promise<void>;
}

export const AddSessionTimeModal: React.FC<AddSessionTimeModalProps> = ({
  isOpen,
  onClose,
  session,
  onConfirmAddTime,
}) => {
  const [minutes, setMinutes] = useState<number>(60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!session) return null;

  const cost = Math.round((minutes / 60) * session.hourlyRate);

  const presets = [
    { label: "+30m", value: 30 },
    { label: "+1h", value: 60 },
    { label: "+2h", value: 120 },
    { label: "+3h", value: 180 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onConfirmAddTime(session.id, minutes);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Time - ${session.stationNumber}`}
      subtitle={session.userName}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
            Add Duration
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {presets.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setMinutes(p.value)}
                className={`py-1.5 px-1 rounded text-xs font-mono transition-colors border text-center ${
                  minutes === p.value
                    ? "bg-[#202534] border-red-600 text-white font-bold"
                    : "bg-[#12141c] border-[#202431] text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-2.5 bg-[#0a0b10] border border-[#1b1e28] rounded flex items-center justify-between font-mono text-xs">
          <span className="text-zinc-400">Additional Cost:</span>
          <span className="text-sm font-bold text-white">{formatRupiah(cost)}</span>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#1b1e28]">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            Add Time
          </Button>
        </div>
      </form>
    </Modal>
  );
};
