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
          <div className="p-2 bg-[#1E1214] border border-[#3B1C20] rounded-[4px] text-[11px] text-[#D15E65] font-mono">
            {error}
          </div>
        )}

        {/* Bill Summary */}
        <div className="p-3 bg-[#111317] border border-[#22252A] rounded-[4px] font-mono">
          <div className="flex items-center justify-between text-[11px] text-[#8A909A] mb-1">
            <span>Payment:</span>
            <span className="text-[#EDEDEE] font-bold">CASH ONLY</span>
          </div>
          <div className="flex items-baseline justify-between pt-1 border-t border-[#1E2126]">
            <span className="text-xs text-[#8A909A]">Total:</span>
            <span className="text-base font-bold text-[#EDEDEE]">{formatRupiah(totalAmount)}</span>
          </div>
        </div>

        {/* Cash Received */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-[#8A909A] mb-1 font-medium">
            Cash Received
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#585C66]">
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
              className="w-full bg-[#111317] border border-[#22252A] rounded-[4px] pl-8 pr-3 py-1.5 text-sm font-mono font-bold text-[#EDEDEE] focus:outline-none focus:border-[#B4232A]"
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
                className="py-1 px-1 bg-[#15171A] hover:bg-[#1A1D22] border border-[#22252A] text-[10px] font-mono text-[#8A909A] hover:text-[#EDEDEE] rounded-[4px] transition-colors text-center cursor-pointer"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Change Calculation Box */}
        <div
          className={`p-2.5 rounded-[4px] border flex items-center justify-between font-mono text-xs ${
            cashReceived === 0
              ? "bg-[#111317] border-[#22252A] text-[#8A909A]"
              : isInsufficient
              ? "bg-[#1E1214] border-[#3B1C20] text-[#D15E65]"
              : "bg-[#141715] border-[#232B25] text-[#9CB1A3] font-bold"
          }`}
        >
          <span>Change:</span>
          <span className="text-sm">
            {isInsufficient ? "Insufficient" : formatRupiah(change)}
          </span>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#22252A]">
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
