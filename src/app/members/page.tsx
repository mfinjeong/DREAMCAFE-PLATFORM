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
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-[#EDEDEE] uppercase tracking-wider font-mono">
          Members Directory
        </h2>
        <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Member
        </Button>
      </div>

      {/* Filter Row */}
      <div className="bg-[#15171A] border border-[#22252A] rounded-[4px] px-3 py-2 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="w-3 h-3 text-[#585C66] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search code, username, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111317] border border-[#22252A] rounded-[4px] pl-7 pr-2.5 py-1 text-xs text-[#EDEDEE] placeholder-[#585C66] focus:outline-none focus:border-[#B4232A]"
          />
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs">
          {["ALL", "REGULAR", "VIP", "PRO"].map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-2 py-0.5 rounded-[3px] text-[11px] transition-colors cursor-pointer ${
                selectedTier === tier
                  ? "bg-[#B4232A] text-[#EDEDEE] font-medium"
                  : "text-[#8A909A] hover:text-[#EDEDEE]"
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
              <TableCell className="font-mono text-[11px] text-[#8A909A]">
                {m.memberCode}
              </TableCell>
              <TableCell className="text-xs">
                <span className="font-bold text-[#EDEDEE] block">@{m.username}</span>
                <span className="text-[11px] text-[#8A909A]">{m.fullName}</span>
              </TableCell>
              <TableCell className="font-mono text-[11px] text-[#8A909A]">
                {m.phoneNumber}
              </TableCell>
              <TableCell>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[3px] bg-[#111317] border border-[#22252A] text-[#8A909A]">
                  {m.tier}
                </span>
              </TableCell>
              <TableCell className="font-mono text-xs font-semibold text-[#EDEDEE]">
                {m.dreamRank}
              </TableCell>
              <TableCell className="font-mono text-xs text-[#8A909A]">
                Lv. {m.level}
              </TableCell>
              <TableCell className="font-mono text-xs text-[#8A909A]">
                {m.dreamCoins}
              </TableCell>
              <TableCell className="text-right">
                <button
                  onClick={() => {
                    setSelectedMember(m);
                    setDetailModalOpen(true);
                  }}
                  className="p-1 rounded-[4px] bg-[#111317] hover:bg-[#1A1D22] text-[#8A909A] hover:text-[#EDEDEE] border border-[#22252A] cursor-pointer"
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
            <div className="p-2 bg-[#1E1214] border border-[#3B1C20] rounded-[4px] text-[11px] text-[#D15E65] font-mono">
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

          <div className="flex justify-end gap-2 pt-2 border-t border-[#22252A]">
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
            <div className="p-2.5 bg-[#111317] border border-[#22252A] rounded-[4px] space-y-1">
              <div className="flex justify-between text-[#8A909A]">
                <span>Code:</span>
                <span className="text-[#EDEDEE]">{selectedMember.memberCode}</span>
              </div>
              <div className="flex justify-between text-[#8A909A]">
                <span>Tier:</span>
                <span className="text-[#EDEDEE]">{selectedMember.tier}</span>
              </div>
              <div className="flex justify-between text-[#8A909A]">
                <span>Rank:</span>
                <span className="text-[#B4232A] font-bold">{selectedMember.dreamRank}</span>
              </div>
              <div className="flex justify-between text-[#8A909A]">
                <span>Level:</span>
                <span className="text-[#EDEDEE]">Lv. {selectedMember.level} ({selectedMember.xp} XP)</span>
              </div>
              <div className="flex justify-between text-[#8A909A]">
                <span>Coins:</span>
                <span className="text-[#EDEDEE]">{selectedMember.dreamCoins}</span>
              </div>
              <div className="flex justify-between text-[#8A909A]">
                <span>Balance:</span>
                <span className="text-[#EDEDEE] font-bold">{formatRupiah(selectedMember.balance)}</span>
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
