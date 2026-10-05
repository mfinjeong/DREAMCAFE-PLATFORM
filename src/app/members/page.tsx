"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MemberItem, MemberTier } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { formatRupiah } from "@/lib/formatters";
import { Plus, Search, Eye } from "lucide-react";

export default function MembersPage() {
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState("ALL");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [newMember, setNewMember] = useState({
    fullName: "",
    username: "",
    phoneNumber: "",
    email: "",
    tier: "REGULAR" as MemberTier,
    balance: 0,
  });

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/members");
      const json = await res.json();
      if (json.success) setMembers(json.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMember),
      });

      const json = await res.json();
      if (!json.success) {
        setErrorMsg(json.message);
        return;
      }

      setCreateModalOpen(false);
      setNewMember({
        fullName: "",
        username: "",
        phoneNumber: "",
        email: "",
        tier: "REGULAR",
        balance: 0,
      });
      await fetchMembers();
    } catch {
      setErrorMsg("Failed to register member.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phoneNumber.includes(searchQuery) ||
      m.memberCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = selectedTier === "ALL" || m.tier === selectedTier;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-mono">
          Members Directory
        </h2>
        <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Member
        </Button>
      </div>

      {/* Filter Row */}
      <div className="bg-[#0e1017] border border-[#1a1d27] rounded px-3 py-2 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="w-3 h-3 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search code, username, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#12141c] border border-[#202431] rounded pl-7 pr-2.5 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-600"
          />
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs">
          {["ALL", "REGULAR", "VIP", "PRO"].map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                selectedTier === tier
                  ? "bg-red-600 text-white font-medium"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Username / Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Tier</TableHead>
            <TableHead>DREAMRANK</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Coins</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <tbody>
          {filteredMembers.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="font-mono text-[11px] text-zinc-400">
                {m.memberCode}
              </TableCell>
              <TableCell className="text-xs">
                <span className="font-bold text-zinc-100 block">@{m.username}</span>
                <span className="text-[11px] text-zinc-400">{m.fullName}</span>
              </TableCell>
              <TableCell className="font-mono text-[11px] text-zinc-400">
                {m.phoneNumber}
              </TableCell>
              <TableCell>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#161821] border border-[#232734] text-zinc-300">
                  {m.tier}
                </span>
              </TableCell>
              <TableCell className="font-mono text-xs font-semibold text-zinc-300">
                {m.dreamRank}
              </TableCell>
              <TableCell className="font-mono text-xs text-zinc-300">
                Lv. {m.level}
              </TableCell>
              <TableCell className="font-mono text-xs text-zinc-300">
                {m.dreamCoins}
              </TableCell>
              <TableCell className="text-right">
                <button
                  onClick={() => {
                    setSelectedMember(m);
                    setDetailModalOpen(true);
                  }}
                  className="p-1 rounded bg-[#161821] hover:bg-[#202432] text-zinc-300 border border-[#232734]"
                  title="Profile"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>

      {/* Add Member Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Register Member"
        maxWidth="sm"
      >
        <form onSubmit={handleCreateMember} className="space-y-3">
          {errorMsg && (
            <div className="p-2 bg-[#251014] border border-red-900/60 rounded text-[11px] text-red-400 font-mono">
              {errorMsg}
            </div>
          )}

          <Input
            label="Full Name"
            value={newMember.fullName}
            onChange={(e) => setNewMember({ ...newMember, fullName: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Username"
              value={newMember.username}
              onChange={(e) => setNewMember({ ...newMember, username: e.target.value })}
              required
            />
            <Input
              label="Phone Number"
              value={newMember.phoneNumber}
              onChange={(e) => setNewMember({ ...newMember, phoneNumber: e.target.value })}
              required
            />
          </div>

          <Input
            label="Email (Optional)"
            type="email"
            value={newMember.email}
            onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-2">
            <Select
              label="Tier"
              value={newMember.tier}
              onChange={(e) => setNewMember({ ...newMember, tier: e.target.value as MemberTier })}
              options={[
                { label: "REGULAR", value: "REGULAR" },
                { label: "VIP", value: "VIP" },
                { label: "PRO", value: "PRO" },
              ]}
            />
            <Input
              label="Initial Deposit (Rp)"
              type="number"
              step="5000"
              value={newMember.balance}
              onChange={(e) => setNewMember({ ...newMember, balance: Number(e.target.value) })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#1b1e28]">
            <Button type="button" variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Register
            </Button>
          </div>
        </form>
      </Modal>

      {/* Profile Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={selectedMember ? `@${selectedMember.username}` : "Member"}
        subtitle={selectedMember?.fullName}
        maxWidth="sm"
      >
        {selectedMember && (
          <div className="space-y-3 font-mono text-xs">
            <div className="p-2.5 bg-[#0a0b10] border border-[#1b1e28] rounded space-y-1">
              <div className="flex justify-between text-zinc-400">
                <span>Code:</span>
                <span className="text-white">{selectedMember.memberCode}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Tier:</span>
                <span className="text-white">{selectedMember.tier}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Rank:</span>
                <span className="text-red-400 font-bold">{selectedMember.dreamRank}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Level:</span>
                <span className="text-white">Lv. {selectedMember.level} ({selectedMember.xp} XP)</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Coins:</span>
                <span className="text-white">{selectedMember.dreamCoins}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Balance:</span>
                <span className="text-emerald-400 font-bold">{formatRupiah(selectedMember.balance)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button variant="outline" size="sm" onClick={() => setDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
