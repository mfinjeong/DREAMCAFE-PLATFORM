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
      {/* Top Statistics: Persona-inspired top accent lines on solid dark surfaces */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* TOTAL PC: Neutral */}
        <div className="relative overflow-hidden bg-surface border border-surface-border rounded-[8px] p-3.5">
          <span className="absolute top-0 left-0 right-0 h-[2px] bg-surface-border"></span>
          <span className="text-[10px] font-mono uppercase text-text-secondary tracking-wider block font-semibold">
            TOTAL PC
          </span>
          <span className="text-2xl font-black font-sans text-[#F2F3F5] mt-1 block">
            {totalPC}
          </span>
        </div>

        {/* IN USE: Persona Red Accent */}
        <div className="relative overflow-hidden bg-surface border border-surface-border rounded-[8px] p-3.5">
          <span className="absolute top-0 left-0 right-0 h-[2px] bg-persona-red"></span>
          <span className="text-[10px] font-mono uppercase text-text-secondary tracking-wider block font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-persona-red persona-slash rounded-[1px]"></span>
            IN USE
          </span>
          <span className="text-2xl font-black font-sans text-[#F2F3F5] mt-1 block">
            {inUseCount}
          </span>
        </div>

        {/* AVAILABLE: Persona 3 Reload Blue Accent */}
        <div className="relative overflow-hidden bg-surface border border-surface-border rounded-[8px] p-3.5">
          <span className="absolute top-0 left-0 right-0 h-[2px] bg-p3r-blue"></span>
          <span className="text-[10px] font-mono uppercase text-text-secondary tracking-wider block font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-p3r-blue persona-slash rounded-[1px]"></span>
            AVAILABLE
          </span>
          <span className="text-2xl font-black font-sans text-[#F2F3F5] mt-1 block">
            {availableCount}
          </span>
        </div>

        {/* MAINTENANCE: Warm Amber Accent */}
        <div className="relative overflow-hidden bg-surface border border-surface-border rounded-[8px] p-3.5">
          <span className="absolute top-0 left-0 right-0 h-[2px] bg-pamber"></span>
          <span className="text-[10px] font-mono uppercase text-text-secondary tracking-wider block font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-pamber persona-slash rounded-[1px]"></span>
            MAINTENANCE
          </span>
          <span className="text-2xl font-black font-sans text-[#F2F3F5] mt-1 block">
            {maintenanceCount}
          </span>
        </div>
      </div>

      {/* PC STATIONS Control & Filters */}
      <div className="bg-surface border border-surface-border rounded-[8px] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 select-none">
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-1.5 h-3.5 bg-persona-red persona-slash rounded-[1px]"></span>
            <span className="text-xs font-extrabold text-[#F2F3F5] uppercase tracking-wider font-sans">
              PC STATIONS
            </span>
          </div>
          <span className="text-text-muted font-mono text-[10px] uppercase mr-1">Zone:</span>
          {["ALL", "REGULAR", "VIP", "ARENA"].map((zone) => (
            <button
              key={zone}
              onClick={() => setSelectedZone(zone)}
              className={`px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-colors duration-100 cursor-pointer ${
                selectedZone === zone
                  ? "bg-persona-red text-white"
                  : "text-text-secondary hover:text-[#F2F3F5] hover:bg-surface-hover"
              }`}
            >
              {zone}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-text-muted font-mono text-[10px] uppercase mr-1">Status:</span>
          {["ALL", "AVAILABLE", "IN_USE", "MAINTENANCE"].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-colors duration-100 cursor-pointer ${
                selectedStatus === status
                  ? "bg-surface-muted text-white border border-surface-border"
                  : "text-text-secondary hover:text-[#F2F3F5]"
              }`}
            >
              {status === "IN_USE" ? "IN USE" : status}
            </button>
          ))}
          <button
            onClick={() => fetchData()}
            className="p-1.5 text-text-secondary hover:text-[#F2F3F5] hover:bg-surface-hover rounded-[4px] ml-1 transition-colors cursor-pointer"
            title="Refresh Stations"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main PC Grid */}
      {isLoading ? (
        <div className="h-44 flex items-center justify-center text-text-secondary text-xs font-mono">
          Loading stations...
        </div>
      ) : filteredPCs.length === 0 ? (
        <div className="h-32 border border-surface-border rounded-[8px] flex items-center justify-center text-text-secondary text-xs font-mono">
          No stations found
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
