"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ProductItem, InventoryLogItem } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { formatRupiah, formatDateTime } from "@/lib/formatters";
import { Search } from "lucide-react";

export default function InventoryPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [logs, setLogs] = useState<InventoryLogItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"stock" | "history">("stock");

  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [actionType, setActionType] = useState<"STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT">("STOCK_IN");
  const [adjustQuantity, setAdjustQuantity] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>("Restock");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    try {
      const [prodRes, logRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/inventory/logs").catch(() => null),
      ]);

      const prodJson = await prodRes.json();
      if (prodJson.success) {
        setProducts(prodJson.data);
        if (!selectedProductId && prodJson.data.length > 0) {
          setSelectedProductId(prodJson.data[0].id);
        }
      }

      if (logRes) {
        const logJson = await logRes.json();
        if (logJson.success) setLogs(logJson.data);
      }
    } catch (e) {
      console.error(e);
    }
  }, [selectedProductId]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleOpenAdjust = (prod?: ProductItem, defaultAction: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT" = "STOCK_IN") => {
    if (prod) setSelectedProductId(prod.id);
    setActionType(defaultAction);
    setAdjustReason(defaultAction === "STOCK_IN" ? "Restock" : defaultAction === "STOCK_OUT" ? "Damaged / Expired" : "Stock Count");
    setErrorMsg(null);
    setAdjustModalOpen(true);
  };

  const handleConfirmAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductId,
          action: actionType,
          quantity: Number(adjustQuantity),
          reason: adjustReason,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setErrorMsg(json.message);
        return;
      }

      setAdjustModalOpen(false);
      await fetchInventory();
    } catch {
      setErrorMsg("Failed to adjust inventory.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-3.5 bg-persona-red persona-slash rounded-[1px]"></span>
          <h2 className="text-xs font-bold text-[#F2F3F5] uppercase tracking-wider font-sans">
            Inventory & Supply Control
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenAdjust(undefined, "STOCK_IN")}
          >
            Stock In
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenAdjust(undefined, "STOCK_OUT")}
          >
            Stock Out
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenAdjust(undefined, "ADJUSTMENT")}
          >
            Stock Audit
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-surface-border pb-1.5 text-xs font-sans">
        <button
          onClick={() => setActiveTab("stock")}
          className={`px-3 py-1.5 rounded-[4px] font-semibold transition-colors cursor-pointer ${
            activeTab === "stock"
              ? "bg-persona-red-subtle text-white border-l-2 border-persona-red"
              : "text-text-secondary hover:text-[#F2F3F5] hover:bg-surface-hover"
          }`}
        >
          Stock Items ({products.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-3 py-1.5 rounded-[4px] font-semibold transition-colors cursor-pointer ${
            activeTab === "history"
              ? "bg-persona-red-subtle text-white border-l-2 border-persona-red"
              : "text-text-secondary hover:text-[#F2F3F5] hover:bg-surface-hover"
          }`}
        >
          Audit History Logs
        </button>
      </div>

      {activeTab === "stock" ? (
        <div className="space-y-3">
          <div className="bg-surface border border-surface-border rounded-[8px] px-3.5 py-2 flex items-center justify-between">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search stock..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-muted border border-surface-border rounded-[6px] pl-8 pr-2.5 py-1 text-xs text-[#F2F3F5] placeholder-text-muted focus:outline-none focus:border-persona-red"
              />
            </div>
            <div className="text-xs font-mono text-text-secondary hidden sm:block">
              Valuation:{" "}
              <span className="text-[#F2F3F5] font-bold">
                {formatRupiah(products.reduce((acc, p) => acc + p.costPrice * p.stock, 0))}
              </span>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {filteredProducts.map((p) => {
                const isLow = p.stock <= p.minStockAlert;
                const isOut = p.stock <= 0;

                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-semibold text-[#F2F3F5] font-sans">
                      <div>{p.name}</div>
                      <div className="text-[10px] font-mono text-text-muted">{p.barcode || "-"}</div>
                    </TableCell>
                    <TableCell className="text-xs text-text-secondary">
                      {p.categoryName}
                    </TableCell>
                    <TableCell className="font-mono text-text-secondary">
                      {formatRupiah(p.costPrice)}
                    </TableCell>
                    <TableCell className="font-mono text-[#F2F3F5] font-semibold">
                      {formatRupiah(p.price)}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-[#F2F3F5]">
                      {p.stock} <span className="text-[10px] text-text-muted font-normal">{p.unit}</span>
                    </TableCell>
                    <TableCell>
                      {isOut ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-persona-red-subtle text-persona-red border border-persona-red-border font-bold">
                          <span className="w-1.5 h-1.5 rounded-[1px] bg-persona-red persona-slash"></span>
                          OUT OF STOCK
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-pamber-subtle text-pamber border border-pamber-border font-bold">
                          <span className="w-1.5 h-1.5 rounded-[1px] bg-pamber persona-slash"></span>
                          LOW STOCK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-p3r-blue-subtle text-p3r-blue border border-p3r-blue-border font-bold">
                          <span className="w-1.5 h-1.5 rounded-[1px] bg-p3r-blue persona-slash"></span>
                          IN STOCK
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => handleOpenAdjust(p, "STOCK_IN")}
                        className="px-2.5 py-1 text-xs bg-surface-muted hover:bg-surface-hover text-text-secondary hover:text-[#F2F3F5] rounded-[4px] border border-surface-border font-sans font-medium cursor-pointer transition-colors"
                      >
                        Adjust
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </tbody>
          </Table>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Stock (Before → After)</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Recorded By</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-[11px] font-mono text-text-secondary">
                  {formatDateTime(log.createdAt)}
                </TableCell>
                <TableCell className="font-semibold text-[#F2F3F5] font-sans">
                  {log.productName}
                </TableCell>
                <TableCell>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[4px] bg-surface-muted border border-surface-border text-text-secondary">
                    {log.action}
                  </span>
                </TableCell>
                <TableCell className="font-mono font-bold text-[#F2F3F5]">
                  {log.action === "STOCK_IN" ? "+" : log.action === "STOCK_OUT" ? "-" : ""}
                  {log.quantity}
                </TableCell>
                <TableCell className="font-mono text-text-secondary">
                  {log.previousStock} → <span className="font-bold text-[#F2F3F5]">{log.newStock}</span>
                </TableCell>
                <TableCell className="text-text-secondary text-xs">{log.reason}</TableCell>
                <TableCell className="text-text-secondary text-xs font-semibold">{log.recordedBy}</TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      )}

      {/* Adjust Modal */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title="Adjust Stock Level"
        maxWidth="sm"
      >
        <form onSubmit={handleConfirmAdjust} className="space-y-3.5">
          {errorMsg && (
            <div className="p-2.5 bg-persona-red-subtle border border-persona-red-border rounded-[6px] text-xs text-persona-red font-medium">
              {errorMsg}
            </div>
          )}

          <Select
            label="Product"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            options={products.map((p) => ({
              label: `${p.name} (Stock: ${p.stock})`,
              value: p.id,
            }))}
          />

          <Select
            label="Adjustment Type"
            value={actionType}
            onChange={(e) => setActionType(e.target.value as "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT")}
            options={[
              { label: "STOCK_IN (Restock)", value: "STOCK_IN" },
              { label: "STOCK_OUT (Loss / Damaged)", value: "STOCK_OUT" },
              { label: "ADJUSTMENT (Manual Count)", value: "ADJUSTMENT" },
            ]}
          />

          <Input
            label={actionType === "ADJUSTMENT" ? "New Count" : "Quantity"}
            type="number"
            min="1"
            value={adjustQuantity}
            onChange={(e) => setAdjustQuantity(Number(e.target.value))}
            required
          />

          <Input
            label="Reason / Reference"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            placeholder="e.g. Restock invoice #102"
            required
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Save Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
