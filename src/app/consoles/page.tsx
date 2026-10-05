"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ConsoleStation, MemberItem } from "@/lib/types";
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
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-3.5 bg-p3r-blue persona-slash rounded-[1px]"></span>
          <h2 className="text-xs font-bold text-[#F2F3F5] uppercase tracking-wider font-sans">
            Console Lounge
          </h2>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs">
          {["ALL", "PS5", "PS4", "SWITCH"].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer ${
                selectedType === t
                  ? "bg-p3r-blue text-white"
                  : "text-text-secondary hover:text-[#F2F3F5] hover:bg-surface-hover"
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
            className="p-3.5 bg-surface border border-surface-border rounded-[8px] flex flex-col justify-between relative overflow-hidden"
          >
            {/* P3R blue corner badge */}
            <span
              className="absolute top-0 right-0 w-3.5 h-3.5 bg-p3r-blue"
              style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
            />

            <div>
              <div className="flex items-start justify-between mb-1.5 pr-2">
                <div>
                  <span className="text-sm font-extrabold text-[#F2F3F5] font-sans block">
                    {con.stationNumber}
                  </span>
                  <span className="text-[11px] font-mono text-p3r-blue font-semibold">{con.consoleType}</span>
                </div>
                <StatusBadge status={con.status} />
              </div>

              <div className="p-2.5 bg-surface-muted border border-surface-border rounded-[6px] my-2 text-xs space-y-1 font-mono">
                <div className="flex justify-between text-text-secondary text-[11px]">
                  <span>Display:</span>
                  <span className="text-[#F2F3F5] truncate max-w-[120px] font-medium">{con.specsDisplay}</span>
                </div>
                <div className="flex justify-between text-text-secondary text-[11px]">
                  <span>Controllers:</span>
                  <span className="text-[#F2F3F5]">{con.controllersCount} Wireless</span>
                </div>
                <div className="flex justify-between text-text-secondary text-[11px]">
                  <span>Rate:</span>
                  <span className="text-[#F2F3F5] font-bold">{formatRupiah(con.hourlyRate)} / hr</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {con.installedGames.map((g, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-1.5 py-0.5 rounded-[3px] bg-surface-muted text-text-secondary border border-surface-border font-sans"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2.5 border-t border-surface-border">
              {con.status === "AVAILABLE" ? (
                <button
                  onClick={() => handleStartSession(con)}
                  className="w-full bg-persona-red hover:bg-persona-red-hover text-white text-xs font-bold py-1.5 px-3 rounded-[6px] uppercase tracking-wider font-sans cursor-pointer transition-colors"
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
                  className="w-full bg-surface-muted hover:bg-surface-hover text-persona-red border border-persona-red-border text-xs font-bold py-1.5 px-3 rounded-[6px] cursor-pointer transition-colors"
                >
                  Checkout
                </button>
              ) : (
                <button
                  disabled
                  className="w-full bg-surface-muted text-text-muted text-xs py-1.5 px-3 rounded-[6px] cursor-not-allowed"
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
