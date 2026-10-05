"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ProductItem, ProductCategoryItem, MemberItem, POSCartItem, TransactionRecord } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatRupiah, formatDateTime } from "@/lib/formatters";
import { Search, Plus, Minus, Trash2 } from "lucide-react";

export default function StorePOSPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<ProductCategoryItem[]>([]);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [cashReceived, setCashReceived] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [completedTrx, setCompletedTrx] = useState<TransactionRecord | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [prodRes, memRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/members"),
      ]);
      const prodJson = await prodRes.json();
      const memJson = await memRes.json();

      if (prodJson.success) {
        setProducts(prodJson.data);
        setCategories(prodJson.categories);
      }
      if (memJson.success) {
        setMembers(memJson.data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addToCart = (product: ProductItem) => {
    setErrorMsg(null);
    if (product.stock <= 0) {
      setErrorMsg(`Out of stock: ${product.name}`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          setErrorMsg(`Max stock available: ${product.stock}`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setErrorMsg(null);
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock) {
              setErrorMsg(`Stock exceeded: ${item.product.stock}`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCashReceived("");
    setErrorMsg(null);
  };

  const cartSubtotal = cart.reduce((acc, curr) => acc + curr.product.price * curr.quantity, 0);
  const cashNum = parseFloat(cashReceived) || 0;
  const change = cashNum - cartSubtotal;
  const isInsufficient = cashNum < cartSubtotal;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (cart.length === 0) {
      setErrorMsg("Cart is empty.");
      return;
    }

    if (isInsufficient) {
      setErrorMsg(`Insufficient cash! Received: ${formatRupiah(cashNum)}, Total: ${formatRupiah(cartSubtotal)}`);
      return;
    }

    const payload = {
      memberId: selectedMemberId || null,
      items: cart.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
        unitPrice: i.product.price,
      })),
      cashReceived: cashNum,
      cashierName: "Admin",
    };

    try {
      setIsProcessing(true);
      const res = await fetch("/api/pos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) {
        setErrorMsg(json.message);
        return;
      }

      setCompletedTrx(json.data);
      clearCart();
      await fetchData();
    } catch {
      setErrorMsg("Checkout processing error.");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "ALL" || p.categoryId === selectedCategory;
    const matchesQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-mono">
          Store & POS (Cash Only)
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Product Catalog */}
        <div className="lg:col-span-2 space-y-3">
          {/* Filter Bar */}
          <div className="bg-[#0e1017] border border-[#1a1d27] rounded px-3 py-2 flex flex-col sm:flex-row gap-2 items-center justify-between">
            <div className="relative w-full sm:w-64">
              <Search className="w-3 h-3 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search product / barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#12141c] border border-[#202431] rounded pl-7 pr-2.5 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  selectedCategory === "ALL" ? "bg-red-600 text-white font-medium" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                ALL
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    selectedCategory === c.id ? "bg-red-600 text-white font-medium" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {filteredProducts.map((p) => {
              const isLow = p.stock <= p.minStockAlert;
              const isOut = p.stock <= 0;

              return (
                <div
                  key={p.id}
                  onClick={() => !isOut && addToCart(p)}
                  className={`p-2.5 rounded border bg-[#10121a] flex flex-col justify-between transition-colors select-none ${
                    isOut
                      ? "opacity-40 border-[#1a1c24] cursor-not-allowed"
                      : "border-[#1e222e] hover:border-[#2a2f3f] cursor-pointer"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-1">
                      <span className="truncate">{p.categoryName}</span>
                      <span className={isOut ? "text-red-400" : isLow ? "text-amber-400" : "text-zinc-400"}>
                        {isOut ? "0" : p.stock}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-zinc-200 line-clamp-1">
                      {p.name}
                    </div>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-[#181a24] flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-white">{formatRupiah(p.price)}</span>
                    <button
                      type="button"
                      disabled={isOut}
                      className="p-1 rounded bg-[#161822] hover:bg-red-600 text-zinc-300 hover:text-white"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: POS Cart */}
        <div className="bg-[#10121a] border border-[#1e222e] rounded p-3 h-fit flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#1b1e28]">
              <span className="text-xs font-bold text-zinc-100 uppercase tracking-wider font-mono">
                Cart ({cart.reduce((a, b) => a + b.quantity, 0)})
              </span>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-[11px] text-zinc-500 hover:text-red-400"
                >
                  Clear
                </button>
              )}
            </div>

            {errorMsg && (
              <div className="my-2 p-1.5 bg-[#251014] border border-red-900/60 rounded text-[11px] text-red-400 font-mono">
                {errorMsg}
              </div>
            )}

            <div className="py-2 space-y-1.5 max-h-48 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-6 text-[11px] text-zinc-600">
                  Cart is empty
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-1.5 bg-[#0a0b10] border border-[#181a24] rounded flex items-center justify-between text-xs"
                  >
                    <div className="truncate min-w-0 flex-1">
                      <div className="text-zinc-200 truncate">{item.product.name}</div>
                      <div className="text-[10px] font-mono text-zinc-500">
                        {formatRupiah(item.product.price)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="p-1 rounded bg-[#161822] text-zinc-400 hover:text-white"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="text-[11px] font-mono font-bold w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="p-1 rounded bg-[#161822] text-zinc-400 hover:text-white"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 text-zinc-600 hover:text-red-400 ml-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Member selector */}
            <div className="pt-2 border-t border-[#1b1e28]">
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full bg-[#12141c] border border-[#202431] rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none"
              >
                <option value="">Guest (Non-Member)</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} (@{m.username})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Checkout Section */}
          <form onSubmit={handleCheckout} className="pt-2.5 border-t border-[#1b1e28] mt-2 space-y-2">
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-xs text-zinc-400">Total:</span>
              <span className="text-base font-bold text-white">
                {formatRupiah(cartSubtotal)}
              </span>
            </div>

            <div>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500">
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  placeholder="Cash Received"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-full bg-[#12141c] border border-[#212635] rounded pl-8 pr-2.5 py-1 text-xs font-mono font-bold text-white focus:outline-none focus:border-red-600"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-1 mt-1 font-mono">
                {[
                  { label: "Exact", val: cartSubtotal },
                  { label: "50k", val: 50000 },
                  { label: "100k", val: 100000 },
                ].map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCashReceived(q.val.toString())}
                    className="py-0.5 bg-[#151722] hover:bg-[#1f2330] border border-[#222634] text-[10px] text-zinc-400 rounded text-center"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`p-2 rounded border flex items-center justify-between font-mono text-xs ${
                cashNum === 0
                  ? "bg-[#0a0b10] border-[#1b1e28] text-zinc-500"
                  : isInsufficient
                  ? "bg-[#251014] border-red-900/60 text-red-400"
                  : "bg-[#0d1f17] border-emerald-900/60 text-emerald-400 font-bold"
              }`}
            >
              <span>Change:</span>
              <span>{isInsufficient ? "Insufficient" : formatRupiah(change)}</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="w-full"
              disabled={cart.length === 0 || isInsufficient || isProcessing}
              isLoading={isProcessing}
            >
              Confirm Cash Payment
            </Button>
          </form>
        </div>
      </div>

      {/* Invoice Modal */}
      <Modal
        isOpen={!!completedTrx}
        onClose={() => setCompletedTrx(null)}
        title="Payment Receipt"
        subtitle={completedTrx?.invoiceNumber}
        maxWidth="sm"
      >
        {completedTrx && (
          <div className="space-y-3 font-mono text-xs">
            <div className="p-2.5 bg-[#0a0b10] rounded border border-[#1b1e28] space-y-1.5">
              <div className="flex justify-between text-zinc-400">
                <span>Date:</span>
                <span className="text-zinc-200">{formatDateTime(completedTrx.createdAt)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>User:</span>
                <span className="text-zinc-200">{completedTrx.memberName}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Method:</span>
                <span className="text-zinc-200">CASH ONLY</span>
              </div>

              <div className="pt-2 border-t border-[#181a24] space-y-1">
                {completedTrx.items.map((it) => (
                  <div key={it.id} className="flex justify-between text-zinc-300">
                    <span>{it.quantity}x {it.description}</span>
                    <span>{formatRupiah(it.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#181a24] space-y-1">
                <div className="flex justify-between font-bold text-white">
                  <span>Total:</span>
                  <span>{formatRupiah(completedTrx.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Cash:</span>
                  <span>{formatRupiah(completedTrx.cashReceived)}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Change:</span>
                  <span>{formatRupiah(completedTrx.cashChange)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setCompletedTrx(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
