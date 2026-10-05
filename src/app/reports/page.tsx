"use client";

import React, { useState } from "react";
import { store } from "@/lib/data-store";
import { TransactionRecord } from "@/lib/types";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { formatRupiah, formatDateTime } from "@/lib/formatters";

export default function ReportsPage() {
  const [transactions] = useState<TransactionRecord[]>(store.transactions);

  const totalRevenue = transactions.reduce((acc, t) => acc + t.totalAmount, 0);
  const sessionRevenue = transactions
    .filter((t) => t.type === "SESSION")
    .reduce((acc, t) => acc + t.totalAmount, 0);
  const storeRevenue = transactions
    .filter((t) => t.type === "STORE" || t.type === "MIXED")
    .reduce((acc, t) => acc + t.totalAmount, 0);

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-[#EDEDEE] uppercase tracking-wider font-mono">
          Financial Reports (Cash Only)
        </h2>
      </div>

      {/* Metric Cards: Uniform neutral surfaces */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="p-3 bg-[#15171A] border border-[#22252A] rounded-[4px]">
          <span className="text-[10px] font-mono uppercase text-[#8A909A] font-semibold block tracking-wider">
            Total Revenue (Cash)
          </span>
          <span className="text-xl font-bold font-mono text-[#EDEDEE] mt-1 block">
            {formatRupiah(totalRevenue)}
          </span>
        </div>

        <div className="p-3 bg-[#15171A] border border-[#22252A] rounded-[4px]">
          <span className="text-[10px] font-mono uppercase text-[#8A909A] font-semibold block tracking-wider">
            Station Sessions
          </span>
          <span className="text-xl font-bold font-mono text-[#EDEDEE] mt-1 block">
            {formatRupiah(sessionRevenue)}
          </span>
        </div>

        <div className="p-3 bg-[#15171A] border border-[#22252A] rounded-[4px]">
          <span className="text-[10px] font-mono uppercase text-[#8A909A] font-semibold block tracking-wider">
            Store & POS
          </span>
          <span className="text-xl font-bold font-mono text-[#EDEDEE] mt-1 block">
            {formatRupiah(storeRevenue)}
          </span>
        </div>
      </div>

      {/* Transaction History */}
      <div className="space-y-2">
        <span className="text-xs font-mono uppercase tracking-wider text-[#8A909A] block font-semibold">
          Transaction Records
        </span>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Cash</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>Cashier</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {transactions.map((trx) => (
              <TableRow key={trx.id}>
                <TableCell className="font-mono text-xs font-semibold text-[#EDEDEE]">
                  {trx.invoiceNumber}
                </TableCell>
                <TableCell className="text-[11px] font-mono text-[#8A909A]">
                  {formatDateTime(trx.createdAt)}
                </TableCell>
                <TableCell className="text-xs text-[#EDEDEE]">
                  {trx.memberName || "Guest"}
                </TableCell>
                <TableCell className="font-mono text-[10px] text-[#8A909A]">
                  {trx.type}
                </TableCell>
                <TableCell className="font-mono text-xs font-bold text-[#EDEDEE]">
                  {formatRupiah(trx.totalAmount)}
                </TableCell>
                <TableCell className="font-mono text-xs text-[#8A909A]">
                  {formatRupiah(trx.cashReceived)}
                </TableCell>
                <TableCell className="font-mono text-xs text-[#9CB1A3] font-medium">
                  {formatRupiah(trx.cashChange)}
                </TableCell>
                <TableCell className="text-xs text-[#585C66]">{trx.cashierName}</TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
