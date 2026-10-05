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
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-[#EDEDEE] uppercase tracking-wider font-mono">
          Store & POS (Cash Only)
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* Left: Product Catalog */}
        <div className="lg:col-span-2 space-y-2.5">
          {/* Filter Bar */}
          <div className="bg-[#15171A] border border-[#22252A] rounded-[4px] px-3 py-2 flex flex-col sm:flex-row gap-2 items-center justify-between">
            <div className="relative w-full sm:w-64">
              <Search className="w-3 h-3 text-[#585C66] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search product / barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111317] border border-[#22252A] rounded-[4px] pl-7 pr-2.5 py-1 text-xs text-[#EDEDEE] placeholder-[#585C66] focus:outline-none focus:border-[#B4232A]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`px-2 py-0.5 rounded-[3px] text-[11px] font-mono transition-colors cursor-pointer ${
                  selectedCategory === "ALL"
                    ? "bg-[#B4232A] text-[#EDEDEE] font-medium"
                    : "text-[#8A909A] hover:text-[#EDEDEE]"
                }`}
              >
                ALL
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-2 py-0.5 rounded-[3px] text-[11px] font-mono transition-colors cursor-pointer ${
                    selectedCategory === c.id
                      ? "bg-[#B4232A] text-[#EDEDEE] font-medium"
                      : "text-[#8A909A] hover:text-[#EDEDEE]"
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
                  className={`p-2.5 rounded-[4px] border bg-[#15171A] flex flex-col justify-between transition-colors select-none ${
                    isOut
                      ? "opacity-40 border-[#1C1F24] cursor-not-allowed"
                      : "border-[#22252A] hover:border-[#31363F] cursor-pointer"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#8A909A] mb-1">
                      <span className="truncate">{p.categoryName}</span>
                      <span className={isOut ? "text-[#D15E65]" : isLow ? "text-[#BFA779]" : "text-[#8A909A]"}>
                        {isOut ? "0" : p.stock}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-[#EDEDEE] line-clamp-1">
                      {p.name}
                    </div>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-[#1E2126] flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-[#EDEDEE]">{formatRupiah(p.price)}</span>
                    <button
                      type="button"
                      disabled={isOut}
                      className="p-1 rounded-[3px] bg-[#111317] hover:bg-[#B4232A] text-[#8A909A] hover:text-[#EDEDEE] border border-[#22252A] transition-colors cursor-pointer"
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
        <div className="bg-[#15171A] border border-[#22252A] rounded-[4px] p-3 h-fit flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#1E2126]">
              <span className="text-xs font-bold text-[#EDEDEE] uppercase tracking-wider font-mono">
                Cart ({cart.reduce((a, b) => a + b.quantity, 0)})
              </span>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-[11px] text-[#8A909A] hover:text-[#D15E65] cursor-pointer font-mono"
                >
                  Clear
                </button>
              )}
            </div>

            {errorMsg && (
              <div className="my-2 p-1.5 bg-[#1E1214] border border-[#3B1C20] rounded-[4px] text-[11px] text-[#D15E65] font-mono">
                {errorMsg}
              </div>
            )}

            <div className="py-2 space-y-1.5 max-h-48 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-6 text-[11px] text-[#585C66] font-mono">
                  Cart is empty
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-1.5 bg-[#111317] border border-[#22252A] rounded-[4px] flex items-center justify-between text-xs"
                  >
                    <div className="truncate min-w-0 flex-1">
                      <div className="text-[#EDEDEE] truncate">{item.product.name}</div>
                      <div className="text-[10px] font-mono text-[#8A909A]">
                        {formatRupiah(item.product.price)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="p-1 rounded-[3px] bg-[#15171A] text-[#8A909A] hover:text-[#EDEDEE] border border-[#22252A] cursor-pointer"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="text-[11px] font-mono font-bold w-4 text-center text-[#EDEDEE]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="p-1 rounded-[3px] bg-[#15171A] text-[#8A909A] hover:text-[#EDEDEE] border border-[#22252A] cursor-pointer"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 text-[#585C66] hover:text-[#D15E65] ml-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Member selector */}
            <div className="pt-2 border-t border-[#1E2126]">
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full bg-[#111317] border border-[#22252A] rounded-[4px] px-2 py-1 text-xs text-[#EDEDEE] focus:outline-none font-mono"
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
          <form onSubmit={handleCheckout} className="pt-2.5 border-t border-[#1E2126] mt-2 space-y-2">
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-xs text-[#8A909A]">Total:</span>
              <span className="text-base font-bold text-[#EDEDEE]">
                {formatRupiah(cartSubtotal)}
              </span>
            </div>

            <div>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#585C66]">
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  placeholder="Cash Received"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-full bg-[#111317] border border-[#22252A] rounded-[4px] pl-8 pr-2.5 py-1 text-xs font-mono font-bold text-[#EDEDEE] focus:outline-none focus:border-[#B4232A]"
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
                    className="py-0.5 bg-[#111317] hover:bg-[#1A1D22] border border-[#22252A] text-[10px] text-[#8A909A] hover:text-[#EDEDEE] rounded-[4px] text-center cursor-pointer"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`p-2 rounded-[4px] border flex items-center justify-between font-mono text-xs ${
                cashNum === 0
                  ? "bg-[#111317] border-[#22252A] text-[#8A909A]"
                  : isInsufficient
                  ? "bg-[#1E1214] border-[#3B1C20] text-[#D15E65]"
                  : "bg-[#141715] border-[#232B25] text-[#9CB1A3] font-bold"
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
            <div className="p-2.5 bg-[#111317] rounded-[4px] border border-[#22252A] space-y-1.5">
              <div className="flex justify-between text-[#8A909A]">
                <span>Date:</span>
                <span className="text-[#EDEDEE]">{formatDateTime(completedTrx.createdAt)}</span>
              </div>
              <div className="flex justify-between text-[#8A909A]">
                <span>User:</span>
                <span className="text-[#EDEDEE]">{completedTrx.memberName}</span>
              </div>
              <div className="flex justify-between text-[#8A909A]">
                <span>Method:</span>
                <span className="text-[#EDEDEE]">CASH ONLY</span>
              </div>

              <div className="pt-2 border-t border-[#1E2126] space-y-1">
                {completedTrx.items.map((it) => (
                  <div key={it.id} className="flex justify-between text-[#8A909A]">
                    <span>{it.quantity}x {it.description}</span>
                    <span className="text-[#EDEDEE]">{formatRupiah(it.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#1E2126] space-y-1">
                <div className="flex justify-between font-bold text-[#EDEDEE]">
                  <span>Total:</span>
                  <span>{formatRupiah(completedTrx.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-[#8A909A]">
                  <span>Cash:</span>
                  <span className="text-[#EDEDEE]">{formatRupiah(completedTrx.cashReceived)}</span>
                </div>
                <div className="flex justify-between text-[#9CB1A3] font-bold">
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
