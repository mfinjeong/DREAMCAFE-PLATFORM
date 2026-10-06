import { z } from "zod";

export const pcSchema = z.object({
  stationNumber: z.string().min(1, "Nomor station wajib diisi"),
  name: z.string().min(2, "Nama station minimal 2 karakter"),
  zone: z.enum(["REGULAR", "VIP", "ARENA"]),
  status: z.enum(["AVAILABLE", "IN_USE", "MAINTENANCE", "OFFLINE"]).default("AVAILABLE"),
  hourlyRate: z.number().min(1000, "Tarif per jam minimal Rp1.000"),
  specsCpu: z.string().min(2, "Spesifikasi CPU wajib diisi"),
  specsGpu: z.string().min(2, "Spesifikasi GPU wajib diisi"),
  specsRam: z.string().min(2, "Spesifikasi RAM wajib diisi"),
  specsMonitor: z.string().min(2, "Spesifikasi Monitor wajib diisi"),
  specsStorage: z.string().default("1TB NVMe SSD"),
  specsPeripherals: z.string().default("Mechanical Keyboard + Mouse"),
  ipAddress: z.string().optional().nullable(),
  macAddress: z.string().optional().nullable(),
});

export const consoleSchema = z.object({
  stationNumber: z.string().min(1, "Nomor station konsol wajib diisi"),
  name: z.string().min(2, "Nama station konsol minimal 2 karakter"),
  consoleType: z.enum(["PS5", "PS4", "SWITCH"]),
  status: z.enum(["AVAILABLE", "IN_USE", "MAINTENANCE", "OFFLINE"]).default("AVAILABLE"),
  hourlyRate: z.number().min(1000, "Tarif per jam minimal Rp1.000"),
  controllersCount: z.number().int().min(1).max(8).default(2),
  specsDisplay: z.string().min(2, "Spesifikasi TV/Display wajib diisi"),
  installedGames: z.array(z.string()).optional().default([]),
});

export const memberSchema = z.object({
  fullName: z.string().min(2, "Nama lengkap minimal 2 karakter"),
  username: z.string().min(3, "Username minimal 3 karakter").regex(/^[a-zA-Z0-9_-]+$/, "Username hanya boleh huruf, angka, underscore, dan dash").optional(),
  phoneNumber: z.string().regex(/^[0-9+]+$/, "Nomor telepon harus angka").min(8, "Nomor telepon minimal 8 digit").optional().nullable().or(z.literal("")),
  email: z.string().email("Format email tidak valid").optional().nullable().or(z.literal("")),
  tier: z.enum(["REGULAR", "VIP", "PRO"]).default("REGULAR").optional(),
  balance: z.number().min(0, "Saldo tidak boleh negatif").default(0).optional(),
  notes: z.string().optional().nullable(),
});

export const updateMemberSchema = z.object({
  fullName: z.string().min(2, "Nama lengkap minimal 2 karakter").optional(),
  username: z.string().min(3, "Username minimal 3 karakter").regex(/^[a-zA-Z0-9_-]+$/, "Username hanya boleh huruf, angka, underscore, dan dash").optional(),
  phoneNumber: z.string().regex(/^[0-9+]+$/, "Nomor telepon harus angka").min(8, "Nomor telepon minimal 8 digit").optional().nullable().or(z.literal("")),
  email: z.string().email("Format email tidak valid").optional().nullable().or(z.literal("")),
  tier: z.enum(["REGULAR", "VIP", "PRO"]).optional(),
  balance: z.number().min(0, "Saldo tidak boleh negatif").optional(),
  notes: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
});

export const startSessionSchema = z.object({
  stationId: z.string().min(1, "Station ID wajib dipilih"),
  type: z.enum(["PC", "CONSOLE"]).default("PC"),
  memberId: z.string().optional().nullable(),
  guestName: z.string().optional().nullable(),
  durationMinutes: z.number().int().min(15, "Durasi minimal 15 menit"),
  currentGame: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
}).refine((data) => data.memberId || (data.guestName && data.guestName.trim().length > 0), {
  message: "Pilih member terdaftar atau masukkan nama tamu (Guest)",
  path: ["memberId"],
});

export const addSessionTimeSchema = z.object({
  sessionId: z.string().min(1, "Session ID wajib diisi"),
  additionalMinutes: z.number().int().min(15, "Penambahan waktu minimal 15 menit"),
});

export const cashPaymentSchema = z.object({
  totalAmount: z.number().min(0, "Total tagihan tidak valid"),
  cashReceived: z.number().min(0, "Jumlah uang tunai tidak boleh negatif"),
}).refine((data) => data.cashReceived >= data.totalAmount, {
  message: "Uang tunai yang diterima kurang dari total tagihan!",
  path: ["cashReceived"],
});

export const endSessionCheckoutSchema = z.object({
  sessionId: z.string().min(1, "Session ID wajib diisi"),
  totalAmount: z.number().min(0),
  cashReceived: z.number().min(0),
  notes: z.string().optional().nullable(),
}).refine((data) => data.cashReceived >= data.totalAmount, {
  message: "Uang tunai yang diterima kurang dari total tagihan!",
  path: ["cashReceived"],
});

export const sessionCheckoutWithProductsSchema = z.object({
  sessionId: z.string().min(1, "Session ID wajib diisi"),
  products: z.array(
    z.object({
      productId: z.string().min(1, "Product ID wajib diisi"),
      quantity: z.number().int().min(1, "Kuantitas minimal 1"),
    })
  ).optional().default([]),
  cashReceived: z.number().min(0, "Jumlah uang tunai tidak boleh negatif"),
  cashierName: z.string().optional().default("Admin"),
  notes: z.string().optional().nullable(),
});

export const posCheckoutSchema = z.object({
  memberId: z.string().optional().nullable(),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().min(1, "Kuantitas minimal 1"),
      unitPrice: z.number().min(0),
    })
  ).min(1, "Keranjang belanja tidak boleh kosong"),
  cashReceived: z.number().min(0, "Uang tunai tidak valid"),
  notes: z.string().optional().nullable(),
});

export const inventoryAdjustmentSchema = z.object({
  productId: z.string().min(1, "Produk wajib dipilih"),
  action: z.enum(["STOCK_IN", "STOCK_OUT", "ADJUSTMENT"]),
  quantity: z.number().int().min(1, "Jumlah minimal 1"),
  reason: z.string().min(3, "Alasan penyesuaian stok wajib diisi"),
});

export const bookingSchema = z.object({
  memberId: z.string().min(1, "Member wajib dipilih"),
  type: z.enum(["PC", "CONSOLE"]),
  stationId: z.string().min(1, "Station PC/Konsol wajib dipilih"),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Format jam mulai harus HH:mm"),
  durationHours: z.number().int().min(1, "Durasi booking minimal 1 jam").max(12, "Durasi maksimal 12 jam"),
  notes: z.string().optional().nullable(),
});
