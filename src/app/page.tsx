"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PCStation, MemberItem, PCStatus } from "@/lib/types";
import { PCStationCard } from "@/components/cards/PCStationCard";
import { StartSessionModal } from "@/components/modals/StartSessionModal";
import { EndSessionPaymentModal } from "@/components/modals/EndSessionPaymentModal";
import { AddSessionTimeModal } from "@/components/modals/AddSessionTimeModal";
import { PCDetailModal } from "@/components/modals/PCDetailModal";
import { RefreshCw } from "lucide-react";

export default function DashboardPage() {
  const [pcs, setPcs] = useState<PCStation[]>([]);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedZone, setSelectedZone] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Modals state
  const [activeModal, setActiveModal] = useState<"start" | "end" | "addTime" | "detail" | null>(null);
  const [selectedPC, setSelectedPC] = useState<PCStation | null>(null);
  const [endSessionData, setEndSessionData] = useState<{
    id: string;
    stationNumber: string;
    userName: string;
    durationMinutes: number;
    totalAmount: number;
  } | null>(null);
  const [addTimeSessionData, setAddTimeSessionData] = useState<{
    id: string;
    stationNumber: string;
    userName: string;
    remainingMinutes: number;
    hourlyRate: number;
  } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [pcRes, memRes] = await Promise.all([
        fetch("/api/pc"),
        fetch("/api/members"),
      ]);

      const pcJson = await pcRes.json();
      const memJson = await memRes.json();

      if (pcJson.success) setPcs(pcJson.data);
      if (memJson.success) setMembers(memJson.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Statistics
  const totalPC = pcs.length;
  const inUseCount = pcs.filter((p) => p.status === "IN_USE").length;
  const availableCount = pcs.filter((p) => p.status === "AVAILABLE").length;
  const maintenanceCount = pcs.filter((p) => p.status === "MAINTENANCE").length;

  const filteredPCs = pcs.filter((p) => {
    if (selectedZone !== "ALL" && p.zone !== selectedZone) return false;
    if (selectedStatus !== "ALL" && p.status !== selectedStatus) return false;
    return true;
  });

  const handleOpenStartSession = (pc: PCStation) => {
    setSelectedPC(pc);
    setActiveModal("start");
  };

  const handleOpenDetail = (pc: PCStation) => {
    setSelectedPC(pc);
    setActiveModal("detail");
  };

  const handleOpenEndSession = (pc: PCStation) => {
    if (!pc.activeSession) return;
    setEndSessionData({
      id: pc.activeSession.id,
      stationNumber: pc.stationNumber,
      userName: pc.activeSession.memberName || pc.activeSession.guestName || "Guest",
      durationMinutes: pc.activeSession.durationMinutes,
      totalAmount: pc.activeSession.totalPrice,
    });
    setActiveModal("end");
  };

  const handleOpenAddTime = (pc: PCStation) => {
    if (!pc.activeSession) return;
    setAddTimeSessionData({
      id: pc.activeSession.id,
      stationNumber: pc.stationNumber,
      userName: pc.activeSession.memberName || pc.activeSession.guestName || "Guest",
      remainingMinutes: pc.activeSession.remainingMinutes,
      hourlyRate: pc.hourlyRate,
    });
    setActiveModal("addTime");
  };

  const handleConfirmStartSession = async (payload: {
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

  const handleConfirmEndSession = async (payload: {
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

  const handleConfirmAddTime = async (sessionId: string, additionalMinutes: number) => {
    const res = await fetch("/api/sessions/add-time", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, additionalMinutes }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    await fetchData();
  };

  const handleStatusChange = async (pcId: string, newStatus: PCStatus) => {
    const res = await fetch(`/api/pc/${pcId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    await fetchData();
    setActiveModal(null);
  };

  return (
    <div className="space-y-4">
      {/* 4 Statistics: TOTAL PC, IN USE, AVAILABLE, MAINTENANCE */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-[#10121a] border border-[#1e222e] rounded p-3">
          <span className="text-[10px] font-mono uppercase text-zinc-400 block tracking-wider font-semibold">
            TOTAL PC
          </span>
          <span className="text-xl font-bold font-mono text-zinc-100 mt-1 block">
            {totalPC}
          </span>
        </div>

        <div className="bg-[#10121a] border border-[#1e222e] rounded p-3">
          <span className="text-[10px] font-mono uppercase text-red-400 block tracking-wider font-semibold">
            IN USE
          </span>
          <span className="text-xl font-bold font-mono text-red-400 mt-1 block">
            {inUseCount}
          </span>
        </div>

        <div className="bg-[#10121a] border border-[#1e222e] rounded p-3">
          <span className="text-[10px] font-mono uppercase text-emerald-400 block tracking-wider font-semibold">
            AVAILABLE
          </span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
            {availableCount}
          </span>
        </div>

        <div className="bg-[#10121a] border border-[#1e222e] rounded p-3">
          <span className="text-[10px] font-mono uppercase text-amber-400 block tracking-wider font-semibold">
            MAINTENANCE
          </span>
          <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
            {maintenanceCount}
          </span>
        </div>
      </div>

      {/* Filter Row: Simple and compact */}
      <div className="bg-[#0e1017] border border-[#1a1d27] rounded px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-xs">
          <span className="text-zinc-500 font-mono text-[10px] mr-1.5 uppercase">Zone:</span>
          {["ALL", "REGULAR", "VIP", "ARENA"].map((zone) => (
            <button
              key={zone}
              onClick={() => setSelectedZone(zone)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors ${
                selectedZone === zone
                  ? "bg-red-600 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {zone}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 text-xs">
          <span className="text-zinc-500 font-mono text-[10px] mr-1.5 uppercase">Status:</span>
          {["ALL", "AVAILABLE", "IN_USE", "MAINTENANCE"].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors ${
                selectedStatus === status
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {status === "IN_USE" ? "IN USE" : status}
            </button>
          ))}
          <button
            onClick={() => fetchData()}
            className="p-1 text-zinc-400 hover:text-zinc-100 ml-2"
            title="Refresh"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* PC Stations Grid */}
      {isLoading ? (
        <div className="h-40 flex items-center justify-center text-zinc-500 text-xs font-mono">
          Loading...
        </div>
      ) : filteredPCs.length === 0 ? (
        <div className="h-32 border border-[#1a1d27] rounded flex items-center justify-center text-zinc-500 text-xs">
          No stations match filter.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredPCs.map((pc) => (
            <PCStationCard
              key={pc.id}
              pc={pc}
              onStartSession={handleOpenStartSession}
              onViewDetail={handleOpenDetail}
              onEndSession={handleOpenEndSession}
              onAddTime={handleOpenAddTime}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <StartSessionModal
        isOpen={activeModal === "start"}
        onClose={() => {
          setActiveModal(null);
          setSelectedPC(null);
        }}
        station={selectedPC}
        members={members}
        onConfirm={handleConfirmStartSession}
      />

      <EndSessionPaymentModal
        isOpen={activeModal === "end"}
        onClose={() => {
          setActiveModal(null);
          setEndSessionData(null);
        }}
        sessionData={endSessionData}
        onConfirmCheckout={handleConfirmEndSession}
      />

      <AddSessionTimeModal
        isOpen={activeModal === "addTime"}
        onClose={() => {
          setActiveModal(null);
          setAddTimeSessionData(null);
        }}
        session={addTimeSessionData}
        onConfirmAddTime={handleConfirmAddTime}
      />

      <PCDetailModal
        isOpen={activeModal === "detail"}
        onClose={() => {
          setActiveModal(null);
          setSelectedPC(null);
        }}
        pc={selectedPC}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
