import { prisma } from "@/lib/prisma";
import { InventoryAction } from "@prisma/client";

export interface StockAdjustmentInput {
  productId: string;
  action: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT";
  quantity: number;
  reason: string;
  recordedBy?: string;
}

export async function listInventoryLogs(filters: {
  productId?: string | null;
  limit?: number;
} = {}) {
  const where: any = {};
  if (filters.productId) {
    where.productId = filters.productId;
  }

  const logs = await prisma.inventoryLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: filters.limit || 50,
    include: {
      product: {
        include: { category: true },
      },
    },
  });

  return logs.map((l) => ({
    id: l.id,
    productId: l.productId,
    productName: l.product.name,
    categoryName: l.product.category.name,
    action: l.action,
    quantity: l.quantity,
    previousStock: l.previousStock,
    newStock: l.newStock,
    reason: l.reason,
    recordedBy: l.recordedBy,
    createdAt: l.createdAt.toISOString(),
  }));
}

export async function adjustStock(data: StockAdjustmentInput) {
  const product = await prisma.product.findUnique({
    where: { id: data.productId },
  });

  if (!product) {
    throw new Error("Produk tidak ditemukan");
  }

  const previousStock = product.stock;
  let newStock = previousStock;

  if (data.action === "STOCK_IN") {
    if (data.quantity <= 0) throw new Error("Jumlah penambahan stok harus lebih dari 0");
    newStock = previousStock + data.quantity;
  } else if (data.action === "STOCK_OUT") {
    if (data.quantity <= 0) throw new Error("Jumlah pengurangan stok harus lebih dari 0");
    if (previousStock - data.quantity < 0) {
      throw new Error(
        `Stok tidak mencukupi! Tersedia: ${previousStock}, Diminta kurangi: ${data.quantity}. Stok produk tidak boleh negatif.`
      );
    }
    newStock = previousStock - data.quantity;
  } else if (data.action === "ADJUSTMENT") {
    if (data.quantity < 0) {
      throw new Error("Stok fisik hasil opname tidak boleh negatif");
    }
    newStock = data.quantity;
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Update Product stock
    const updatedProduct = await tx.product.update({
      where: { id: data.productId },
      data: { stock: newStock },
    });

    // 2. Create Audit Log
    const log = await tx.inventoryLog.create({
      data: {
        productId: data.productId,
        action: data.action as InventoryAction,
        quantity: data.quantity,
        previousStock,
        newStock,
        reason: data.reason,
        recordedBy: data.recordedBy || "Admin",
      },
    });

    return {
      product: updatedProduct,
      log,
      previousStock,
      newStock,
    };
  });
}
