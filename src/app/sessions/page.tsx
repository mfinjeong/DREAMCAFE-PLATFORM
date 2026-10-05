"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SessionItem } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EndSessionPaymentModal } from "@/components/modals/EndSessionPaymentModal";
import { AddSessionTimeModal } from "@/components/modals/AddSessionTimeModal";
import { formatRupiah, formatDateTime } from "@/lib/formatters";
import { Search, RefreshCw } from "lucide-react";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [activeModal, setActiveModal] = useState<"end" | "addTime" | null>(null);
  const [checkoutData, setCheckoutData] = useState<{
    id: string;
    stationNumber: string;
    userName: string;
    durationMinutes: number;
    totalAmount: number;
  } | null>(null);
  const [addTimeData, setAddTimeData] = useState<{
    id: string;
    stationNumber: string;
    userName: string;
    remainingMinutes: number;
    hourlyRate: number;
  } | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions");
      const json = await res.json();
      if (json.success) setSessions(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const filtered = sessions.filter((s) => {
    const station = s.pcStationNumber || s.consoleStationNumber || "";
    const user = s.memberName || s.guestName || "";
    const matchesSearch =
      station.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sessionNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenEnd = (s: SessionItem) => {
    setCheckoutData({
      id: s.id,
      stationNumber: s.pcStationNumber || s.consoleStationNumber || "Station",
      userName: s.memberName || s.guestName || "Guest",
      durationMinutes: s.durationMinutes,
      totalAmount: s.totalPrice,
    });
    setActiveModal("end");
  };

  const handleOpenAddTime = (s: SessionItem) => {
    setAddTimeData({
      id: s.id,
      stationNumber: s.pcStationNumber || s.consoleStationNumber || "Station",
      userName: s.memberName || s.guestName || "Guest",
      remainingMinutes: s.remainingMinutes,
      hourlyRate: s.hourlyRate,
    });
    setActiveModal("addTime");
  };

  const handleConfirmCheckout = async (payload: {
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
    await fetchSessions();
  };

  const handleConfirmAddTime = async (sessionId: string, additionalMinutes: number) => {
    const res = await fetch("/api/sessions/add-time", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, additionalMinutes }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    await fetchSessions();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-mono">
          Rental Sessions
        </h2>
        <button
          onClick={() => fetchSessions()}
          className="p-1 rounded text-zinc-400 hover:text-zinc-100 bg-[#161821] border border-[#232734]"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-[#0e1017] border border-[#1a1d27] rounded px-3 py-2 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="w-3 h-3 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search session, user, station..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#12141c] border border-[#202431] rounded pl-7 pr-2.5 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-600"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {["ALL", "ACTIVE", "COMPLETED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                statusFilter === st
                  ? "bg-red-600 text-white font-medium"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Session ID</TableHead>
            <TableHead>Station</TableHead>
            <TableHead>User / Game</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <tbody>
          {filtered.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-mono text-[11px] text-zinc-400">
                {s.sessionNumber}
              </TableCell>
              <TableCell className="font-bold text-zinc-100 font-mono">
                {s.pcStationNumber || s.consoleStationNumber}
              </TableCell>
              <TableCell className="text-xs">
                <span className="font-medium text-zinc-200 block">
                  {s.memberName || s.guestName || "Guest"}
                </span>
                {s.currentGame && (
                  <span className="text-[10px] text-zinc-500 font-mono">{s.currentGame}</span>
                )}
              </TableCell>
              <TableCell className="text-[11px] text-zinc-400 font-mono">
                {formatDateTime(s.startTime)}
              </TableCell>
              <TableCell className="font-mono text-zinc-300">
                {s.durationMinutes}m
              </TableCell>
              <TableCell>
                <StatusBadge status={s.status} />
              </TableCell>
              <TableCell className="font-mono font-bold text-zinc-100">
                {formatRupiah(s.totalPrice)}
              </TableCell>
              <TableCell className="text-right">
                {s.status === "ACTIVE" ? (
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleOpenAddTime(s)}
                      className="px-2 py-0.5 text-xs bg-[#161821] hover:bg-[#202432] text-zinc-300 rounded border border-[#262b38]"
                    >
                      +Time
                    </button>
                    <button
                      onClick={() => handleOpenEnd(s)}
                      className="px-2 py-0.5 text-xs bg-[#dc2626] hover:bg-[#b91c1c] text-white font-medium rounded"
                    >
                      Checkout
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] font-mono text-zinc-500">PAID (CASH)</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>

      <EndSessionPaymentModal
        isOpen={activeModal === "end"}
        onClose={() => {
          setActiveModal(null);
          setCheckoutData(null);
        }}
        sessionData={checkoutData}
        onConfirmCheckout={handleConfirmCheckout}
      />

      <AddSessionTimeModal
        isOpen={activeModal === "addTime"}
        onClose={() => {
          setActiveModal(null);
          setAddTimeData(null);
        }}
        session={addTimeData}
        onConfirmAddTime={handleConfirmAddTime}
      />
    </div>
  );
}
