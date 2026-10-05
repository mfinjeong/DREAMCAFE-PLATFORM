"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PCStation, StationZone, PCStatus } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PCDetailModal } from "@/components/modals/PCDetailModal";
import { formatRupiah } from "@/lib/formatters";
import { Plus, Search, Edit2, Trash2, Eye } from "lucide-react";

export default function PCManagementPage() {
  const [pcs, setPcs] = useState<PCStation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [zoneFilter, setZoneFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedPC, setSelectedPC] = useState<PCStation | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    id: "",
    stationNumber: "",
    name: "",
    zone: "REGULAR" as StationZone,
    status: "AVAILABLE" as PCStatus,
    hourlyRate: 10000,
    specsCpu: "Intel Core i5-13400F",
    specsGpu: "NVIDIA GeForce RTX 4060 8GB",
    specsRam: "16GB DDR5 5200MHz",
    specsMonitor: "24\" 165Hz IPS",
    specsStorage: "1TB NVMe SSD",
    specsPeripherals: "Mechanical Keyboard + Mouse",
    ipAddress: "192.168.1.100",
    macAddress: "70:85:C2:55:01:00",
  });

  const fetchPCs = useCallback(async () => {
    try {
      const res = await fetch("/api/pc");
      const json = await res.json();
      if (json.success) setPcs(json.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchPCs();
  }, [fetchPCs]);

  const filteredPCs = pcs.filter((pc) => {
    const matchesSearch =
      pc.stationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pc.zone.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesZone = zoneFilter === "ALL" || pc.zone === zoneFilter;
    const matchesStatus = statusFilter === "ALL" || pc.status === statusFilter;
    return matchesSearch && matchesZone && matchesStatus;
  });

  const handleOpenCreate = () => {
    setIsEditing(false);
    setActionError(null);
    setFormData({
      id: "",
      stationNumber: `PC ${(pcs.length + 1).toString().padStart(2, "0")}`,
      name: `Station ${(pcs.length + 1).toString().padStart(2, "0")}`,
      zone: "REGULAR",
      status: "AVAILABLE",
      hourlyRate: 10000,
      specsCpu: "Intel Core i5-13400F",
      specsGpu: "NVIDIA GeForce RTX 4060 8GB",
      specsRam: "16GB DDR5 5200MHz",
      specsMonitor: "24\" 165Hz IPS",
      specsStorage: "1TB NVMe SSD",
      specsPeripherals: "Mechanical Keyboard + Mouse",
      ipAddress: `192.168.1.${110 + pcs.length}`,
      macAddress: `70:85:C2:55:01:${(10 + pcs.length).toString(16)}`,
    });
    setEditModalOpen(true);
  };

  const handleOpenEdit = (pc: PCStation) => {
    setIsEditing(true);
    setActionError(null);
    setFormData({
      id: pc.id,
      stationNumber: pc.stationNumber,
      name: pc.name,
      zone: pc.zone,
      status: pc.status,
      hourlyRate: pc.hourlyRate,
      specsCpu: pc.specsCpu,
      specsGpu: pc.specsGpu,
      specsRam: pc.specsRam,
      specsMonitor: pc.specsMonitor,
      specsStorage: pc.specsStorage,
      specsPeripherals: pc.specsPeripherals,
      ipAddress: pc.ipAddress || "",
      macAddress: pc.macAddress || "",
    });
    setEditModalOpen(true);
  };

  const handleSavePC = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    const payload = {
      stationNumber: formData.stationNumber,
      name: formData.name,
      zone: formData.zone,
      status: formData.status,
      hourlyRate: Number(formData.hourlyRate),
      specsCpu: formData.specsCpu,
      specsGpu: formData.specsGpu,
      specsRam: formData.specsRam,
      specsMonitor: formData.specsMonitor,
      specsStorage: formData.specsStorage,
      specsPeripherals: formData.specsPeripherals,
      ipAddress: formData.ipAddress,
      macAddress: formData.macAddress,
    };

    try {
      const url = isEditing ? `/api/pc/${formData.id}` : "/api/pc";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) {
        setActionError(json.message);
        return;
      }

      setEditModalOpen(false);
      await fetchPCs();
    } catch {
      setActionError("Failed to save PC station.");
    }
  };

  const handleDeletePC = async (id: string, stationNumber: string) => {
    if (!confirm(`Delete ${stationNumber}?`)) return;

    try {
      const res = await fetch(`/api/pc/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        alert(json.message);
        return;
      }
      await fetchPCs();
    } catch {
      alert("Failed to delete PC.");
    }
  };

  const handleStatusChange = async (pcId: string, newStatus: PCStatus) => {
    const res = await fetch(`/api/pc/${pcId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    await fetchPCs();
    setDetailModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-mono">
          PC Stations
        </h2>
        <Button variant="primary" size="sm" onClick={handleOpenCreate}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add PC
        </Button>
      </div>

      {/* Filter Row */}
      <div className="bg-[#0e1017] border border-[#1a1d27] rounded px-3 py-2 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="w-3 h-3 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search station or specs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#12141c] border border-[#202431] rounded pl-7 pr-2.5 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="bg-[#12141c] border border-[#202431] rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none"
          >
            <option value="ALL">All Zones</option>
            <option value="REGULAR">REGULAR</option>
            <option value="VIP">VIP</option>
            <option value="ARENA">ARENA</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#12141c] border border-[#202431] rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="IN_USE">IN USE</option>
            <option value="MAINTENANCE">MAINTENANCE</option>
            <option value="OFFLINE">OFFLINE</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Station</TableHead>
            <TableHead>Zone</TableHead>
            <TableHead>Rate / Hr</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Specifications</TableHead>
            <TableHead>Active Session</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <tbody>
          {filteredPCs.map((pc) => (
            <TableRow key={pc.id}>
              <TableCell className="font-bold text-zinc-100 font-mono">
                {pc.stationNumber}
              </TableCell>
              <TableCell className="font-mono text-[11px] text-zinc-400">
                {pc.zone}
              </TableCell>
              <TableCell className="font-mono text-zinc-200">
                {formatRupiah(pc.hourlyRate)}
              </TableCell>
              <TableCell>
                <StatusBadge status={pc.status} />
              </TableCell>
              <TableCell className="text-[11px] text-zinc-400 font-mono">
                {pc.specsGpu} • {pc.specsCpu}
              </TableCell>
              <TableCell className="text-xs">
                {pc.status === "IN_USE" ? (
                  <span className="text-red-400 font-medium">
                    {pc.activeSession?.memberName || "Guest"} ({pc.currentGame || "Game"})
                  </span>
                ) : (
                  <span className="text-zinc-600">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => {
                      setSelectedPC(pc);
                      setDetailModalOpen(true);
                    }}
                    className="p-1 text-zinc-400 hover:text-zinc-100 bg-[#161821] rounded border border-[#232734]"
                    title="Detail"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(pc)}
                    className="p-1 text-zinc-400 hover:text-zinc-100 bg-[#161821] rounded border border-[#232734]"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeletePC(pc.id, pc.stationNumber)}
                    className="p-1 text-red-400 hover:text-red-300 bg-[#251014] rounded border border-red-900/60"
                    title="Delete"
                    disabled={pc.status === "IN_USE"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>

      {/* Edit / Create Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={isEditing ? `Edit ${formData.stationNumber}` : "New PC Station"}
        maxWidth="md"
      >
        <form onSubmit={handleSavePC} className="space-y-3">
          {actionError && (
            <div className="p-2 bg-[#251014] border border-red-900/60 rounded text-[11px] text-red-400 font-mono">
              {actionError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Station Number"
              placeholder="e.g. PC 11"
              value={formData.stationNumber}
              onChange={(e) => setFormData({ ...formData, stationNumber: e.target.value })}
              required
            />
            <Input
              label="Station Name"
              placeholder="e.g. Station 11"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Select
              label="Zone"
              value={formData.zone}
              onChange={(e) => setFormData({ ...formData, zone: e.target.value as StationZone })}
              options={[
                { label: "REGULAR", value: "REGULAR" },
                { label: "VIP", value: "VIP" },
                { label: "ARENA", value: "ARENA" },
              ]}
            />
            <Input
              label="Rate / Hr (Rp)"
              type="number"
              step="1000"
              value={formData.hourlyRate}
              onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
              required
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as PCStatus })}
              options={[
                { label: "AVAILABLE", value: "AVAILABLE" },
                { label: "MAINTENANCE", value: "MAINTENANCE" },
                { label: "OFFLINE", value: "OFFLINE" },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="CPU"
              value={formData.specsCpu}
              onChange={(e) => setFormData({ ...formData, specsCpu: e.target.value })}
              required
            />
            <Input
              label="GPU"
              value={formData.specsGpu}
              onChange={(e) => setFormData({ ...formData, specsGpu: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="RAM"
              value={formData.specsRam}
              onChange={(e) => setFormData({ ...formData, specsRam: e.target.value })}
              required
            />
            <Input
              label="Monitor"
              value={formData.specsMonitor}
              onChange={(e) => setFormData({ ...formData, specsMonitor: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#1b1e28]">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <PCDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedPC(null);
        }}
        pc={selectedPC}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
