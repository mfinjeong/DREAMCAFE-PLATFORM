"use client";

import React, { useState, useEffect, useCallback } from "react";
import { BookingItem, PCStation, ConsoleStation, MemberItem } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatRupiah } from "@/lib/formatters";
import { Plus, Search } from "lucide-react";

export default function BookingPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [pcs, setPcs] = useState<PCStation[]>([]);
  const [consoles, setConsoles] = useState<ConsoleStation[]>([]);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    memberId: "",
    type: "PC" as "PC" | "CONSOLE",
    stationId: "",
    bookingDate: new Date().toISOString().slice(0, 10),
    startTime: "14:00",
    durationHours: 2,
    notes: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const [bookRes, pcRes, conRes, memRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/pc"),
        fetch("/api/consoles"),
        fetch("/api/members"),
      ]);

      const [bookJson, pcJson, conJson, memJson] = await Promise.all([
        bookRes.json(),
        pcRes.json(),
        conRes.json(),
        memRes.json(),
      ]);

      if (bookJson.success) setBookings(bookJson.data);
      if (pcJson.success) setPcs(pcJson.data);
      if (conJson.success) setConsoles(conJson.data);
      if (memJson.success) {
        setMembers(memJson.data);
        if (!formData.memberId && memJson.data.length > 0) {
          setFormData((prev) => ({ ...prev, memberId: memJson.data[0].id }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [formData.memberId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (formData.type === "PC" && pcs.length > 0) {
      setFormData((prev) => ({ ...prev, stationId: pcs[0].id }));
    } else if (formData.type === "CONSOLE" && consoles.length > 0) {
      setFormData((prev) => ({ ...prev, stationId: consoles[0].id }));
    }
  }, [formData.type, pcs, consoles]);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!json.success) {
        setErrorMsg(json.message);
        return;
      }

      setCreateModalOpen(false);
      await fetchData();
    } catch {
      setErrorMsg("Failed to create reservation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const station = b.pcStationNumber || b.consoleStationNumber || "";
    return (
      station.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-[#EDEDEE] uppercase tracking-wider font-mono">
          Reservations
        </h2>
        <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          New Reservation
        </Button>
      </div>

      <div className="bg-[#15171A] border border-[#22252A] rounded-[4px] px-3 py-1.5 flex items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="w-3 h-3 text-[#585C66] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search code, station, user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111317] border border-[#22252A] rounded-[4px] pl-7 pr-2.5 py-1 text-xs text-[#EDEDEE] placeholder-[#585C66] focus:outline-none focus:border-[#B4232A]"
          />
        </div>
        <div className="text-[11px] font-mono text-[#8A909A]">
          Total: {bookings.length}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Station</TableHead>
            <TableHead>Member</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time Slot</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Estimated Bill</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <tbody>
          {filteredBookings.map((b) => (
            <TableRow key={b.id}>
              <TableCell className="font-mono text-xs font-semibold text-[#B4232A]">
                {b.bookingCode}
              </TableCell>
              <TableCell className="font-bold text-[#EDEDEE] font-mono">
                {b.pcStationNumber || b.consoleStationNumber}
              </TableCell>
              <TableCell className="text-xs text-[#EDEDEE]">
                {b.memberName}
              </TableCell>
              <TableCell className="text-xs text-[#8A909A] font-mono">
                {b.bookingDate}
              </TableCell>
              <TableCell className="text-xs font-mono font-medium text-[#EDEDEE]">
                {b.startTime} - {b.endTime}
              </TableCell>
              <TableCell className="text-xs text-[#8A909A] font-mono">
                {b.durationHours}h
              </TableCell>
              <TableCell className="font-mono text-xs font-bold text-[#EDEDEE]">
                {formatRupiah(b.totalPrice)}
              </TableCell>
              <TableCell>
                <StatusBadge status={b.status} />
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>

      {/* Booking Form Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="New Reservation"
        maxWidth="sm"
      >
        <form onSubmit={handleCreateBooking} className="space-y-3">
          {errorMsg && (
            <div className="p-2 bg-[#1E1214] border border-[#3B1C20] rounded-[4px] text-[11px] text-[#D15E65] font-mono">
              {errorMsg}
            </div>
          )}

          <Select
            label="Member"
            value={formData.memberId}
            onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
            options={members.map((m) => ({
              label: `${m.fullName} (@${m.username})`,
              value: m.id,
            }))}
          />

          <div className="grid grid-cols-2 gap-2">
            <Select
              label="Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as "PC" | "CONSOLE" })}
              options={[
                { label: "PC", value: "PC" },
                { label: "Console", value: "CONSOLE" },
              ]}
            />

            <Select
              label="Station"
              value={formData.stationId}
              onChange={(e) => setFormData({ ...formData, stationId: e.target.value })}
              options={
                formData.type === "PC"
                  ? pcs.map((p) => ({
                      label: `${p.stationNumber} (${p.zone})`,
                      value: p.id,
                    }))
                  : consoles.map((c) => ({
                      label: `${c.stationNumber} (${c.consoleType})`,
                      value: c.id,
                    }))
              }
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Input
              label="Date"
              type="date"
              value={formData.bookingDate}
              onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
              required
            />
            <Input
              label="Start"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              required
            />
            <Input
              label="Hours"
              type="number"
              min="1"
              max="12"
              value={formData.durationHours}
              onChange={(e) => setFormData({ ...formData, durationHours: Number(e.target.value) })}
              required
            />
          </div>

          <Input
            label="Notes (Optional)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-[#22252A]">
            <Button type="button" variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Confirm
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
