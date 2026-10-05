"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatRupiah } from "@/lib/formatters";

interface EndSessionPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData: {
    id: string;
    stationNumber: string;
    userName: string;
    durationMinutes: number;
    totalAmount: number;
  } | null;
  onConfirmCheckout: (payload: {
    sessionId: string;
    totalAmount: number;
    cashReceived: number;
  }) => Promise<void>;
}

export const EndSessionPaymentModal: React.FC<EndSessionPaymentModalProps> = ({
  isOpen,
  onClose,
  sessionData,
  onConfirmCheckout,
}) => {
  const [cashInput, setCashInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!sessionData) return null;

  const totalAmount = sessionData.totalAmount;
  const cashReceived = parseFloat(cashInput) || 0;
  const change = cashReceived - totalAmount;
  const isInsufficient = cashReceived < totalAmount;

  const quickAmounts = [
    { label: "Exact", value: totalAmount },
    { label: "20.000", value: 20000 },
    { label: "50.000", value: 50000 },
    { label: "100.000", value: 100000 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isInsufficient) {
      setError(`Insufficient cash! Received: ${formatRupiah(cashReceived)}, Total: ${formatRupiah(totalAmount)}`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirmCheckout({
        sessionId: sessionData.id,
        totalAmount,
        cashReceived,
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Checkout failed.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Cash Checkout - ${sessionData.stationNumber}`}
      subtitle={`${sessionData.userName} (${sessionData.durationMinutes} min)`}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="p-2 bg-[#261014] border border-red-900/80 rounded text-[11px] text-red-400 font-mono">
            {error}
          </div>
        )}

        {/* Bill Summary */}
        <div className="p-3 bg-[#0a0b10] border border-[#1b1e28] rounded font-mono">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
            <span>Payment:</span>
            <span className="text-zinc-300 font-bold">CASH ONLY</span>
          </div>
          <div className="flex items-baseline justify-between pt-1 border-t border-[#181a24]">
            <span className="text-xs text-zinc-300">Total:</span>
            <span className="text-base font-bold text-white">{formatRupiah(totalAmount)}</span>
          </div>
        </div>

        {/* Cash Received */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
            Cash Received
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500">
              Rp
            </span>
            <input
              type="number"
              min="0"
              step="500"
              placeholder="0"
              value={cashInput}
              onChange={(e) => {
                setCashInput(e.target.value);
                setError(null);
              }}
              className="w-full bg-[#12141d] border border-[#212635] rounded pl-8 pr-3 py-1.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-red-600"
              autoFocus
              required
            />
          </div>

          {/* Quick Cash Buttons */}
          <div className="grid grid-cols-4 gap-1.5 mt-1.5">
            {quickAmounts.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCashInput(q.value.toString());
                  setError(null);
                }}
                className="py-1 px-1 bg-[#151722] hover:bg-[#1e2230] border border-[#222634] text-[10px] font-mono text-zinc-300 rounded transition-colors text-center"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Change Calculation Box */}
        <div
          className={`p-2.5 rounded border flex items-center justify-between font-mono text-xs ${
            cashReceived === 0
              ? "bg-[#0a0b10] border-[#1b1e28] text-zinc-400"
              : isInsufficient
              ? "bg-[#251014] border-red-900/60 text-red-400"
              : "bg-[#0d1f17] border-emerald-900/60 text-emerald-400 font-bold"
          }`}
        >
          <span>Change:</span>
          <span className="text-sm">
            {isInsufficient ? "Insufficient" : formatRupiah(change)}
          </span>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1b1e28]">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isInsufficient || cashReceived === 0 || isSubmitting}
            isLoading={isSubmitting}
          >
            Confirm & Complete
          </Button>
        </div>
      </form>
    </Modal>
  );
};
