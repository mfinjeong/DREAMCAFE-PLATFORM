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
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-3.5 bg-persona-red persona-slash rounded-[1px]"></span>
          <h2 className="text-xs font-bold text-[#F2F3F5] uppercase tracking-wider font-sans">
            Members Directory & Rankings
          </h2>
        </div>
        <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Member
        </Button>
      </div>

      {/* Filter Row */}
      <div className="bg-surface border border-surface-border rounded-[8px] px-3.5 py-2.5 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search code, username, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-muted border border-surface-border rounded-[6px] pl-8 pr-2.5 py-1 text-xs text-[#F2F3F5] placeholder-text-muted focus:outline-none focus:border-persona-red"
          />
        </div>

        <div className="flex items-center gap-1.5 font-sans text-xs">
          {["ALL", "REGULAR", "VIP", "PRO"].map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer ${
                selectedTier === tier
                  ? "bg-persona-red text-white"
                  : "text-text-secondary hover:text-[#F2F3F5] hover:bg-surface-hover"
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
              <TableCell className="font-mono text-[11px] text-text-secondary font-semibold">
                {m.memberCode}
              </TableCell>
              <TableCell className="text-xs">
                <span className="font-bold text-[#F2F3F5] block font-sans">@{m.username}</span>
                <span className="text-[11px] text-text-secondary">{m.fullName}</span>
              </TableCell>
              <TableCell className="font-mono text-[11px] text-text-secondary">
                {m.phoneNumber}
              </TableCell>
              <TableCell>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-surface-muted border border-surface-border text-text-secondary font-bold">
                  {m.tier}
                </span>
              </TableCell>
              <TableCell className="font-sans text-xs font-bold text-persona-red">
                {m.dreamRank}
              </TableCell>
              <TableCell className="font-mono text-xs text-text-secondary font-medium">
                Lv. {m.level}
              </TableCell>
              <TableCell className="font-mono text-xs text-[#F2F3F5] font-semibold">
                {m.dreamCoins}
              </TableCell>
              <TableCell className="text-right">
                <button
                  onClick={() => {
                    setSelectedMember(m);
                    setDetailModalOpen(true);
                  }}
                  className="p-1.5 rounded-[4px] bg-surface-muted hover:bg-surface-hover text-text-secondary hover:text-[#F2F3F5] border border-surface-border cursor-pointer transition-colors"
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
        <form onSubmit={handleCreateMember} className="space-y-3.5">
          {errorMsg && (
            <div className="p-2.5 bg-persona-red-subtle border border-persona-red-border rounded-[6px] text-xs text-persona-red font-medium">
              {errorMsg}
            </div>
          )}

          <Input
            label="Full Name"
            value={newMember.fullName}
            onChange={(e) => setNewMember({ ...newMember, fullName: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-2.5">
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

          <div className="grid grid-cols-2 gap-2.5">
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

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
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
        title={selectedMember ? `@${selectedMember.username}` : "Member Profile"}
        subtitle={selectedMember?.fullName}
        maxWidth="sm"
      >
        {selectedMember && (
          <div className="space-y-3.5 text-xs">
            <div className="p-3 bg-surface-muted border border-surface-border rounded-[8px] space-y-1.5 font-mono">
              <div className="flex justify-between text-text-secondary">
                <span>Code:</span>
                <span className="text-[#F2F3F5] font-bold">{selectedMember.memberCode}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Tier:</span>
                <span className="text-[#F2F3F5]">{selectedMember.tier}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Rank:</span>
                <span className="text-persona-red font-bold font-sans">{selectedMember.dreamRank}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Level:</span>
                <span className="text-[#F2F3F5]">Lv. {selectedMember.level} ({selectedMember.xp} XP)</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Coins:</span>
                <span className="text-[#F2F3F5]">{selectedMember.dreamCoins}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Balance:</span>
                <span className="text-p3r-blue font-bold">{formatRupiah(selectedMember.balance)}</span>
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
