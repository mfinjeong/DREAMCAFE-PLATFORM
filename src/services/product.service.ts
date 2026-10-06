import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface ProductCreateInput {
  name: string;
  barcode?: string | null;
  categoryId: string;
  price: number;
  costPrice?: number;
  stock?: number;
  minStockAlert?: number;
  unit?: string;
  imageUrl?: string | null;
  isActive?: boolean;
}

export interface ProductUpdateInput extends Partial<ProductCreateInput> {}

export async function listCategories() {
  return await prisma.productCategory.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });
}

export async function listProducts(filters: {
  categoryId?: string | null;
  search?: string | null;
  activeOnly?: boolean;
  lowStockOnly?: boolean;
} = {}) {
  const where: Prisma.ProductWhereInput = {};

  if (filters.categoryId && filters.categoryId !== "ALL") {
    where.categoryId = filters.categoryId;
  }
  if (filters.activeOnly !== false) {
    where.isActive = true;
  }
  if (filters.search) {
    const q = filters.search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { barcode: { contains: q } },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      category: true,
    },
  });

  let mapped = products.map((p) => ({
    id: p.id,
    name: p.name,
    barcode: p.barcode,
    categoryId: p.categoryId,
    categoryName: p.category.name,
    price: p.price,
    costPrice: p.costPrice,
    stock: p.stock,
    minStockAlert: p.minStockAlert,
    unit: p.unit,
    imageUrl: p.imageUrl,
    isActive: p.isActive,
    isLowStock: p.stock <= p.minStockAlert,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  if (filters.lowStockOnly) {
    mapped = mapped.filter((p) => p.isLowStock);
  }

  return mapped;
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      inventoryLogs: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!product) return null;

  return {
    ...product,
    categoryName: product.category.name,
    isLowStock: product.stock <= product.minStockAlert,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export async function createProduct(data: ProductCreateInput) {
  // Check barcode uniqueness if provided
  if (data.barcode) {
    const existing = await prisma.product.findUnique({
      where: { barcode: data.barcode },
    });
    if (existing) {
      throw new Error(`Barcode ${data.barcode} sudah digunakan oleh produk ${existing.name}`);
    }
  }

  return await prisma.product.create({
    data: {
      name: data.name,
      barcode: data.barcode || null,
      categoryId: data.categoryId,
      price: data.price,
      costPrice: data.costPrice || 0,
      stock: data.stock || 0,
      minStockAlert: data.minStockAlert || 5,
      unit: data.unit || "pcs",
      imageUrl: data.imageUrl || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
    include: { category: true },
  });
}

export async function updateProduct(id: string, data: ProductUpdateInput) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Produk tidak ditemukan");
  }

  if (data.barcode && data.barcode !== existing.barcode) {
    const duplicate = await prisma.product.findUnique({
      where: { barcode: data.barcode },
    });
    if (duplicate) {
      throw new Error(`Barcode ${data.barcode} sudah digunakan oleh produk lain`);
    }
  }

  return await prisma.product.update({
    where: { id },
    data,
    include: { category: true },
  });
}

export async function getLowStockProducts() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: { stock: "asc" },
  });

  return products
    .filter((p) => p.stock <= p.minStockAlert)
    .map((p) => ({
      id: p.id,
      name: p.name,
      barcode: p.barcode,
      categoryId: p.categoryId,
      categoryName: p.category.name,
      price: p.price,
      costPrice: p.costPrice,
      stock: p.stock,
      minStockAlert: p.minStockAlert,
      unit: p.unit,
      imageUrl: p.imageUrl,
      isActive: p.isActive,
      isLowStock: true,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
}
