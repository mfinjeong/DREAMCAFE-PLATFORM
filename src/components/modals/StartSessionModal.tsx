"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PCStation, MemberItem, ConsoleStation } from "@/lib/types";
import { formatRupiah } from "@/lib/formatters";

interface StartSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  station: PCStation | ConsoleStation | null;
  members: MemberItem[];
  onConfirm: (payload: {
    stationId: string;
    type: "PC" | "CONSOLE";
    memberId?: string | null;
    guestName?: string | null;
    durationMinutes: number;
    currentGame?: string;
  }) => Promise<void>;
}

export const StartSessionModal: React.FC<StartSessionModalProps> = ({
  isOpen,
  onClose,
  station,
  members,
  onConfirm,
}) => {
  const [memberType, setMemberType] = useState<"member" | "guest">("member");
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || "");
  const [guestName, setGuestName] = useState<string>("");
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [currentGame, setCurrentGame] = useState<string>("Valorant");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!station) return null;

  const hourlyRate = station.hourlyRate || 10000;
  const totalPrice = Math.round((durationMinutes / 60) * hourlyRate);

  const durationOptions = [
    { label: "1h", value: 60 },
    { label: "2h", value: 120 },
    { label: "3h", value: 180 },
    { label: "4h", value: 240 },
    { label: "5h", value: 300 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (station.status === "IN_USE") {
      setErrorMessage(`Station ${station.stationNumber} is already in use.`);
      return;
    }

    if (memberType === "guest" && (!guestName || guestName.trim().length === 0)) {
      setErrorMessage("Guest name is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm({
        stationId: station.id,
        type: "specsCpu" in station ? "PC" : "CONSOLE",
        memberId: memberType === "member" ? selectedMemberId : null,
        guestName: memberType === "guest" ? guestName.trim() : null,
        durationMinutes,
        currentGame,
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to start session.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Start Session - ${station.stationNumber}`}
      subtitle={`Rate: ${formatRupiah(hourlyRate)}/hr`}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {errorMessage && (
          <div className="p-2 bg-[#261014] border border-red-900/80 rounded text-[11px] text-red-400 font-mono">
            {errorMessage}
          </div>
        )}

        {/* Member or Guest Toggle */}
        <div className="grid grid-cols-2 gap-1.5 p-0.5 bg-[#14161f] border border-[#212532] rounded">
          <button
            type="button"
            onClick={() => setMemberType("member")}
            className={`py-1 text-xs font-medium rounded transition-colors ${
              memberType === "member" ? "bg-[#202534] text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Member
          </button>
          <button
            type="button"
            onClick={() => setMemberType("guest")}
            className={`py-1 text-xs font-medium rounded transition-colors ${
              memberType === "guest" ? "bg-[#202534] text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Guest
          </button>
        </div>

        {memberType === "member" ? (
          <Select
            label="Member"
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            options={members.map((m) => ({
              label: `${m.fullName} (@${m.username})`,
              value: m.id,
            }))}
          />
        ) : (
          <Input
            label="Guest Name"
            placeholder="e.g. Guest 01"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            required
          />
        )}

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
            Duration
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {durationOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDurationMinutes(opt.value)}
                className={`py-1.5 px-1 rounded text-xs font-mono transition-colors text-center border ${
                  durationMinutes === opt.value
                    ? "bg-[#202534] border-red-600 text-white font-bold"
                    : "bg-[#12141c] border-[#202431] text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Game"
          value={currentGame}
          onChange={(e) => setCurrentGame(e.target.value)}
        />

        {/* Total Price Summary */}
        <div className="p-2.5 bg-[#0a0b10] border border-[#1b1e28] rounded flex items-center justify-between font-mono">
          <span className="text-zinc-400 text-xs">Total:</span>
          <span className="text-sm font-bold text-white">{formatRupiah(totalPrice)}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1b1e28]">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            Start Session
          </Button>
        </div>
      </form>
    </Modal>
  );
};
