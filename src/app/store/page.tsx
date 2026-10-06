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
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-3.5 bg-persona-red persona-slash rounded-[1px]"></span>
          <h2 className="text-xs font-bold text-[#F2F3F5] uppercase tracking-wider font-sans">
            Store & Cash Register
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Product Catalog */}
        <div className="lg:col-span-2 space-y-3">
          {/* Filter Bar */}
          <div className="bg-surface border border-surface-border rounded-[8px] px-3.5 py-2.5 flex flex-col sm:flex-row gap-2 items-center justify-between">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search product, drinks, snacks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-muted border border-surface-border rounded-[6px] pl-8 pr-2.5 py-1 text-xs text-[#F2F3F5] placeholder-text-muted focus:outline-none focus:border-persona-red"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer ${
                  selectedCategory === "ALL"
                    ? "bg-persona-red text-white"
                    : "text-text-secondary hover:text-[#F2F3F5] hover:bg-surface-hover"
                }`}
              >
                ALL
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-2.5 py-1 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer ${
                    selectedCategory === c.id
                      ? "bg-persona-red text-white"
                      : "text-text-secondary hover:text-[#F2F3F5] hover:bg-surface-hover"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredProducts.map((p) => {
              const isLow = p.stock <= p.minStockAlert;
              const isOut = p.stock <= 0;

              return (
                <div
                  key={p.id}
                  onClick={() => !isOut && addToCart(p)}
                  className={`p-3 rounded-[8px] border bg-surface flex flex-col justify-between transition-colors select-none ${
                    isOut
                      ? "opacity-40 border-surface-border cursor-not-allowed"
                      : "border-surface-border hover:border-surface-hover cursor-pointer"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-text-secondary mb-1">
                      <span className="truncate">{p.categoryName}</span>
                      <span className={isOut ? "text-persona-red font-bold" : isLow ? "text-pamber font-bold" : "text-text-secondary"}>
                        {isOut ? "0" : p.stock}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-[#F2F3F5] line-clamp-1 font-sans">
                      {p.name}
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-surface-border flex items-center justify-between text-xs font-mono">
                    <span className="font-extrabold text-[#F2F3F5]">{formatRupiah(p.price)}</span>
                    <button
                      type="button"
                      disabled={isOut}
                      className="p-1 rounded-[4px] bg-surface-muted hover:bg-persona-red text-text-secondary hover:text-white border border-surface-border transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: POS Cart */}
        <div className="bg-surface border border-surface-border rounded-[8px] p-3.5 h-fit flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-surface-border">
              <span className="text-xs font-bold text-[#F2F3F5] uppercase tracking-wider font-sans">
                Cart Items ({cart.reduce((a, b) => a + b.quantity, 0)})
              </span>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-text-secondary hover:text-persona-red cursor-pointer font-medium"
                >
                  Clear
                </button>
              )}
            </div>

            {errorMsg && (
              <div className="my-2 p-2 bg-persona-red-subtle border border-persona-red-border rounded-[6px] text-xs text-persona-red font-medium">
                {errorMsg}
              </div>
            )}

            <div className="py-2.5 space-y-1.5 max-h-52 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-xs text-text-muted">
                  No items in cart
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-2 bg-surface-muted border border-surface-border rounded-[6px] flex items-center justify-between text-xs"
                  >
                    <div className="truncate min-w-0 flex-1">
                      <div className="text-[#F2F3F5] font-semibold truncate font-sans">{item.product.name}</div>
                      <div className="text-[11px] font-mono text-text-secondary">
                        {formatRupiah(item.product.price)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="p-1 rounded-[3px] bg-surface text-text-secondary hover:text-[#F2F3F5] border border-surface-border cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-mono font-bold w-4 text-center text-[#F2F3F5]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="p-1 rounded-[3px] bg-surface text-text-secondary hover:text-[#F2F3F5] border border-surface-border cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 text-text-muted hover:text-persona-red ml-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Member selector */}
            <div className="pt-2.5 border-t border-surface-border">
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full bg-surface-muted border border-surface-border rounded-[6px] px-2.5 py-1.5 text-xs text-[#F2F3F5] focus:outline-none cursor-pointer"
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
          <form onSubmit={handleCheckout} className="pt-3 border-t border-surface-border mt-2 space-y-2.5">
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-xs text-text-secondary font-medium">Total Bill:</span>
              <span className="text-base font-extrabold text-[#F2F3F5]">
                {formatRupiah(cartSubtotal)}
              </span>
            </div>

            <div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-text-muted">
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  placeholder="Cash Received"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-full bg-surface-muted border border-surface-border rounded-[6px] pl-9 pr-2.5 py-1.5 text-xs font-mono font-bold text-[#F2F3F5] focus:outline-none focus:border-persona-red"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-1.5 mt-1.5 font-mono">
                {[
                  { label: "Exact", val: cartSubtotal },
                  { label: "50k", val: 50000 },
                  { label: "100k", val: 100000 },
                ].map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCashReceived(q.val.toString())}
                    className="py-1 bg-surface-muted hover:bg-surface-hover border border-surface-border text-xs text-text-secondary hover:text-[#F2F3F5] rounded-[4px] text-center cursor-pointer transition-colors"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`p-2.5 rounded-[6px] border flex items-center justify-between font-mono text-xs ${
                cashNum === 0
                  ? "bg-surface-muted border-surface-border text-text-secondary"
                  : isInsufficient
                  ? "bg-persona-red-subtle border-persona-red-border text-persona-red"
                  : "bg-p3r-blue-subtle border-p3r-blue-border text-p3r-blue font-bold"
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
            <div className="p-3 bg-surface-muted rounded-[6px] border border-surface-border space-y-1.5">
              <div className="flex justify-between text-text-secondary">
                <span>Date:</span>
                <span className="text-[#F2F3F5] font-semibold">{formatDateTime(completedTrx.createdAt)}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Customer:</span>
                <span className="text-[#F2F3F5] font-semibold">{completedTrx.memberName}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Method:</span>
                <span className="text-persona-red font-bold">CASH ONLY</span>
              </div>

              <div className="pt-2 border-t border-surface-border space-y-1">
                {completedTrx.items.map((it) => (
                  <div key={it.id} className="flex justify-between text-[#F2F3F5]">
                    <span>{it.quantity}x {it.description}</span>
                    <span>{formatRupiah(it.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-surface-border space-y-1">
                <div className="flex justify-between font-extrabold text-[#F2F3F5]">
                  <span>Total:</span>
                  <span>{formatRupiah(completedTrx.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Cash:</span>
                  <span>{formatRupiah(completedTrx.cashReceived)}</span>
                </div>
                <div className="flex justify-between text-p3r-blue font-bold">
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
