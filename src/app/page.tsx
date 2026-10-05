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
    <div className="space-y-3.5">
      {/* Top Statistics: Uniform neutral surface for all cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-[#15171A] border border-[#22252A] rounded-[4px] p-3">
          <span className="text-[10px] font-mono uppercase text-[#8A909A] tracking-wider block font-medium">
            TOTAL PC
          </span>
          <span className="text-xl font-bold font-mono text-[#EDEDEE] mt-1 block">
            {totalPC}
          </span>
        </div>

        <div className="bg-[#15171A] border border-[#22252A] rounded-[4px] p-3">
          <span className="text-[10px] font-mono uppercase text-[#8A909A] tracking-wider block font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B4232A]"></span>
            IN USE
          </span>
          <span className="text-xl font-bold font-mono text-[#EDEDEE] mt-1 block">
            {inUseCount}
          </span>
        </div>

        <div className="bg-[#15171A] border border-[#22252A] rounded-[4px] p-3">
          <span className="text-[10px] font-mono uppercase text-[#8A909A] tracking-wider block font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3D7453]"></span>
            AVAILABLE
          </span>
          <span className="text-xl font-bold font-mono text-[#EDEDEE] mt-1 block">
            {availableCount}
          </span>
        </div>

        <div className="bg-[#15171A] border border-[#22252A] rounded-[4px] p-3">
          <span className="text-[10px] font-mono uppercase text-[#8A909A] tracking-wider block font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8A6F3C]"></span>
            MAINTENANCE
          </span>
          <span className="text-xl font-bold font-mono text-[#EDEDEE] mt-1 block">
            {maintenanceCount}
          </span>
        </div>
      </div>

      {/* PC STATIONS Control & Filters */}
      <div className="bg-[#15171A] border border-[#22252A] rounded-[4px] px-3 py-2 flex flex-wrap items-center justify-between gap-2 select-none">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-xs font-bold font-mono text-[#EDEDEE] uppercase tracking-wider mr-2">
            PC STATIONS
          </span>
          <span className="text-[#585C66] font-mono text-[10px] uppercase mr-1">Zone:</span>
          {["ALL", "REGULAR", "VIP", "ARENA"].map((zone) => (
            <button
              key={zone}
              onClick={() => setSelectedZone(zone)}
              className={`px-2 py-0.5 rounded-[3px] text-[11px] font-mono transition-colors duration-75 cursor-pointer ${
                selectedZone === zone
                  ? "bg-[#B4232A] text-[#EDEDEE] font-medium"
                  : "text-[#8A909A] hover:text-[#EDEDEE] hover:bg-[#111317]"
              }`}
            >
              {zone}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[#585C66] font-mono text-[10px] uppercase mr-1">Status:</span>
          {["ALL", "AVAILABLE", "IN_USE", "MAINTENANCE"].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-2 py-0.5 rounded-[3px] text-[11px] font-mono transition-colors duration-75 cursor-pointer ${
                selectedStatus === status
                  ? "bg-[#22252A] text-[#EDEDEE] font-medium"
                  : "text-[#8A909A] hover:text-[#EDEDEE]"
              }`}
            >
              {status === "IN_USE" ? "IN USE" : status}
            </button>
          ))}
          <button
            onClick={() => fetchData()}
            className="p-1 text-[#8A909A] hover:text-[#EDEDEE] ml-2 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main PC Grid */}
      {isLoading ? (
        <div className="h-44 flex items-center justify-center text-[#8A909A] text-xs font-mono">
          Loading stations...
        </div>
      ) : filteredPCs.length === 0 ? (
        <div className="h-32 border border-[#22252A] rounded-[4px] flex items-center justify-center text-[#8A909A] text-xs font-mono">
          No stations found
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
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
