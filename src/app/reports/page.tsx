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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-3.5 bg-persona-red persona-slash" />
        <h2 className="text-sm font-bold text-text-primary tracking-tight font-sans">
          Financial Reports (Cash Transactions)
        </h2>
      </div>

      {/* Metric Cards with subtle accent lines */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-surface border border-surface-border rounded-[6px] border-t-2 border-t-persona-red relative overflow-hidden">
          <span className="text-[10px] font-mono uppercase text-text-muted font-semibold block tracking-wider">
            Total Revenue (Cash)
          </span>
          <span className="text-xl font-bold font-mono text-text-primary mt-1 block">
            {formatRupiah(totalRevenue)}
          </span>
        </div>

        <div className="p-3.5 bg-surface border border-surface-border rounded-[6px] border-t-2 border-t-p3r-blue relative overflow-hidden">
          <span className="text-[10px] font-mono uppercase text-text-muted font-semibold block tracking-wider">
            Station Sessions
          </span>
          <span className="text-xl font-bold font-mono text-text-primary mt-1 block">
            {formatRupiah(sessionRevenue)}
          </span>
        </div>

        <div className="p-3.5 bg-surface border border-surface-border rounded-[6px] border-t-2 border-t-surface-border-light relative overflow-hidden">
          <span className="text-[10px] font-mono uppercase text-text-muted font-semibold block tracking-wider">
            Store & POS
          </span>
          <span className="text-xl font-bold font-mono text-text-primary mt-1 block">
            {formatRupiah(storeRevenue)}
          </span>
        </div>
      </div>

      {/* Transaction History */}
      <div className="space-y-2">
        <span className="text-xs uppercase tracking-wider text-text-muted block font-semibold">
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
                <TableCell className="font-mono text-xs font-semibold text-text-primary">
                  {trx.invoiceNumber}
                </TableCell>
                <TableCell className="text-[11px] font-mono text-text-muted">
                  {formatDateTime(trx.createdAt)}
                </TableCell>
                <TableCell className="text-xs text-text-primary font-medium">
                  {trx.memberName || "Guest"}
                </TableCell>
                <TableCell className="font-mono text-[10px] text-text-muted">
                  {trx.type}
                </TableCell>
                <TableCell className="font-mono text-xs font-bold text-persona-red">
                  {formatRupiah(trx.totalAmount)}
                </TableCell>
                <TableCell className="font-mono text-xs text-text-muted">
                  {formatRupiah(trx.cashReceived)}
                </TableCell>
                <TableCell className="font-mono text-xs text-p3r-blue font-medium">
                  {formatRupiah(trx.cashChange)}
                </TableCell>
                <TableCell className="text-xs text-text-dim">{trx.cashierName}</TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
