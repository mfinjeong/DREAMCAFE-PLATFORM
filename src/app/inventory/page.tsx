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
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-[#EDEDEE] uppercase tracking-wider font-mono">
          Inventory
        </h2>
        <div className="flex items-center gap-1.5">
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
            Adjustment
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-[#22252A] pb-1.5 text-xs font-mono">
        <button
          onClick={() => setActiveTab("stock")}
          className={`px-2.5 py-1 rounded-[4px] transition-colors cursor-pointer ${
            activeTab === "stock"
              ? "bg-[#1E1214] text-[#EDEDEE] font-medium border-l-2 border-[#B4232A]"
              : "text-[#8A909A] hover:text-[#EDEDEE]"
          }`}
        >
          Stock Items ({products.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-2.5 py-1 rounded-[4px] transition-colors cursor-pointer ${
            activeTab === "history"
              ? "bg-[#1E1214] text-[#EDEDEE] font-medium border-l-2 border-[#B4232A]"
              : "text-[#8A909A] hover:text-[#EDEDEE]"
          }`}
        >
          History Logs
        </button>
      </div>

      {activeTab === "stock" ? (
        <div className="space-y-3">
          <div className="bg-[#15171A] border border-[#22252A] rounded-[4px] px-3 py-1.5 flex items-center justify-between">
            <div className="relative w-full sm:w-64">
              <Search className="w-3 h-3 text-[#585C66] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111317] border border-[#22252A] rounded-[4px] pl-7 pr-2.5 py-1 text-xs text-[#EDEDEE] placeholder-[#585C66] focus:outline-none focus:border-[#B4232A]"
              />
            </div>
            <div className="text-[11px] font-mono text-[#8A909A] hidden sm:block">
              Valuation:{" "}
              <span className="text-[#EDEDEE] font-bold">
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
                    <TableCell className="font-medium text-[#EDEDEE]">
                      <div>{p.name}</div>
                      <div className="text-[10px] font-mono text-[#585C66]">{p.barcode || "-"}</div>
                    </TableCell>
                    <TableCell className="text-[11px] text-[#8A909A] font-mono">
                      {p.categoryName}
                    </TableCell>
                    <TableCell className="font-mono text-[#8A909A]">
                      {formatRupiah(p.costPrice)}
                    </TableCell>
                    <TableCell className="font-mono text-[#EDEDEE]">
                      {formatRupiah(p.price)}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-[#EDEDEE]">
                      {p.stock} <span className="text-[10px] text-[#585C66] font-normal">{p.unit}</span>
                    </TableCell>
                    <TableCell>
                      {isOut ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] bg-[#1E1214] text-[#D15E65] border border-[#3B1C20]">
                          <span className="w-1 h-1 rounded-full bg-[#B4232A]"></span>
                          OUT
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] bg-[#1C1813] text-[#BFA779] border border-[#332A1C]">
                          <span className="w-1 h-1 rounded-full bg-[#8A6F3C]"></span>
                          LOW (&lt;{p.minStockAlert})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] bg-[#141715] text-[#9CB1A3] border border-[#232B25]">
                          <span className="w-1 h-1 rounded-full bg-[#3D7453]"></span>
                          OK
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => handleOpenAdjust(p, "STOCK_IN")}
                        className="px-2 py-0.5 text-xs bg-[#111317] hover:bg-[#1A1D22] text-[#8A909A] hover:text-[#EDEDEE] rounded-[4px] border border-[#22252A] font-mono cursor-pointer"
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
                <TableCell className="text-[11px] font-mono text-[#8A909A]">
                  {formatDateTime(log.createdAt)}
                </TableCell>
                <TableCell className="font-medium text-[#EDEDEE]">
                  {log.productName}
                </TableCell>
                <TableCell>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-[4px] bg-[#111317] border border-[#22252A] text-[#8A909A]">
                    {log.action}
                  </span>
                </TableCell>
                <TableCell className="font-mono font-bold text-[#EDEDEE]">
                  {log.action === "STOCK_IN" ? "+" : log.action === "STOCK_OUT" ? "-" : ""}
                  {log.quantity}
                </TableCell>
                <TableCell className="font-mono text-[#8A909A]">
                  {log.previousStock} → <span className="font-bold text-[#EDEDEE]">{log.newStock}</span>
                </TableCell>
                <TableCell className="text-[#8A909A] text-xs">{log.reason}</TableCell>
                <TableCell className="text-[#8A909A] text-xs">{log.recordedBy}</TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      )}

      {/* Adjust Modal */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title="Adjust Stock"
        maxWidth="sm"
      >
        <form onSubmit={handleConfirmAdjust} className="space-y-3">
          {errorMsg && (
            <div className="p-2 bg-[#1E1214] border border-[#3B1C20] rounded-[4px] text-[11px] text-[#D15E65] font-mono">
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
            label="Action"
            value={actionType}
            onChange={(e) => setActionType(e.target.value as "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT")}
            options={[
              { label: "STOCK_IN", value: "STOCK_IN" },
              { label: "STOCK_OUT", value: "STOCK_OUT" },
              { label: "ADJUSTMENT", value: "ADJUSTMENT" },
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
            label="Reason"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            placeholder="e.g. Restock invoice #102"
            required
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-[#22252A]">
            <Button type="button" variant="outline" size="sm" onClick={() => setAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
