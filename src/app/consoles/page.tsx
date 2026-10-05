"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ConsoleStation, MemberItem } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StartSessionModal } from "@/components/modals/StartSessionModal";
import { EndSessionPaymentModal } from "@/components/modals/EndSessionPaymentModal";
import { formatRupiah } from "@/lib/formatters";

export default function ConsolesPage() {
  const [consoles, setConsoles] = useState<ConsoleStation[]>([]);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [activeModal, setActiveModal] = useState<"start" | "end" | null>(null);
  const [selectedConsole, setSelectedConsole] = useState<ConsoleStation | null>(null);
  const [checkoutData, setCheckoutData] = useState<{
    id: string;
    stationNumber: string;
    userName: string;
    durationMinutes: number;
    totalAmount: number;
  } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [conRes, memRes] = await Promise.all([
        fetch("/api/consoles"),
        fetch("/api/members"),
      ]);
      const conJson = await conRes.json();
      const memJson = await memRes.json();
      if (conJson.success) setConsoles(conJson.data);
      if (memJson.success) setMembers(memJson.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = consoles.filter((c) => {
    if (selectedType !== "ALL" && c.consoleType !== selectedType) return false;
    return true;
  });

  const handleStartSession = (con: ConsoleStation) => {
    setSelectedConsole(con);
    setActiveModal("start");
  };

  const handleConfirmStart = async (payload: {
    stationId: string;
    type: "PC" | "CONSOLE";
    memberId?: string | null;
    guestName?: string | null;
    durationMinutes: number;
    currentGame?: string;
  }) => {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    await fetchData();
  };

  const handleConfirmEnd = async (payload: {
    sessionId: string;
    totalAmount: number;
    cashReceived: number;
  }) => {
    const res = await fetch("/api/sessions/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    await fetchData();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-mono">
          Console Stations
        </h2>

        <div className="flex items-center gap-1 font-mono text-xs">
          {["ALL", "PS5", "PS4", "SWITCH"].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                selectedType === t
                  ? "bg-red-600 text-white font-medium"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {filtered.map((con) => (
          <div
            key={con.id}
            className="p-3 bg-[#10121a] border border-[#1e222e] rounded flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-1">
                <div>
                  <span className="text-sm font-bold text-white font-mono block">
                    {con.stationNumber}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">{con.consoleType}</span>
                </div>
                <StatusBadge status={con.status} />
              </div>

              <div className="p-2 bg-[#0a0b10] border border-[#181a24] rounded my-2 text-xs space-y-1 font-mono">
                <div className="flex justify-between text-zinc-400 text-[11px]">
                  <span>Display:</span>
                  <span className="text-zinc-200 truncate max-w-[120px]">{con.specsDisplay}</span>
                </div>
                <div className="flex justify-between text-zinc-400 text-[11px]">
                  <span>Controllers:</span>
                  <span className="text-zinc-200">{con.controllersCount}</span>
                </div>
                <div className="flex justify-between text-zinc-400 text-[11px]">
                  <span>Rate:</span>
                  <span className="text-white font-bold">{formatRupiah(con.hourlyRate)}/hr</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {con.installedGames.map((g, idx) => (
                  <span
                    key={idx}
                    className="text-[9px] px-1 py-0.2 rounded bg-[#161821] text-zinc-400 border border-[#232734]"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[#181a24]">
              {con.status === "AVAILABLE" ? (
                <button
                  onClick={() => handleStartSession(con)}
                  className="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-semibold py-1.5 px-3 rounded uppercase tracking-wider"
                >
                  START SESSION
                </button>
              ) : con.status === "IN_USE" ? (
                <button
                  onClick={() => {
                    setCheckoutData({
                      id: con.activeSessionId || "ses-con",
                      stationNumber: con.stationNumber,
                      userName: con.currentGame || "Guest",
                      durationMinutes: 120,
                      totalAmount: con.hourlyRate * 2,
                    });
                    setActiveModal("end");
                  }}
                  className="w-full bg-[#3b1216] hover:bg-[#50171d] text-red-300 border border-red-900/60 text-xs font-medium py-1.5 px-3 rounded"
                >
                  Checkout
                </button>
              ) : (
                <button
                  disabled
                  className="w-full bg-[#161822] text-zinc-500 text-xs py-1.5 px-3 rounded cursor-not-allowed"
                >
                  Maintenance
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <StartSessionModal
        isOpen={activeModal === "start"}
        onClose={() => {
          setActiveModal(null);
          setSelectedConsole(null);
        }}
        station={selectedConsole}
        members={members}
        onConfirm={handleConfirmStart}
      />

      <EndSessionPaymentModal
        isOpen={activeModal === "end"}
        onClose={() => {
          setActiveModal(null);
          setCheckoutData(null);
        }}
        sessionData={checkoutData}
        onConfirmCheckout={handleConfirmEnd}
      />
    </div>
  );
}
