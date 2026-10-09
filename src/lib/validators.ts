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
  gameId: z.string().optional().nullable(),
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
  totalAmount: z.number().min(0).optional(),
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
      productId: z.string().min(1, "Produk wajib dipilih"),
      quantity: z.number().int().min(1, "Kuantitas minimal 1"),
      unitPrice: z.number().min(0).optional(),
    })
  ).min(1, "Keranjang belanja tidak boleh kosong"),
  cashReceived: z.number().min(0, "Uang tunai tidak valid"),
  cashierName: z.string().optional().default("Admin"),
  notes: z.string().optional().nullable(),
});

export const inventoryAdjustmentSchema = z
  .object({
    productId: z.string().min(1, "Produk wajib dipilih"),
    action: z.enum(["STOCK_IN", "STOCK_OUT", "ADJUSTMENT"]),
    quantity: z.number().int("Jumlah harus berupa bilangan bulat"),
    reason: z.string().trim().min(3, "Alasan penyesuaian stok minimal 3 karakter"),
    recordedBy: z.string().optional().default("Admin"),
  })
  .superRefine((data, ctx) => {
    if (data.action === "STOCK_IN" && data.quantity <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Jumlah penambahan stok harus lebih dari 0",
        path: ["quantity"],
      });
    }
    if (data.action === "STOCK_OUT" && data.quantity <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Jumlah pengurangan stok harus lebih dari 0",
        path: ["quantity"],
      });
    }
    if (data.action === "ADJUSTMENT" && data.quantity < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Stok fisik hasil opname tidak boleh negatif",
        path: ["quantity"],
      });
    }
  });

export const bookingSchema = z.object({
  memberId: z.string().min(1, "Member wajib dipilih"),
  type: z.enum(["PC", "CONSOLE"]),
  stationId: z.string().min(1, "Station PC/Konsol wajib dipilih"),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam mulai harus HH:mm"),
  durationHours: z.number().int().min(1, "Durasi booking minimal 1 jam").max(12, "Durasi maksimal 12 jam"),
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional(),
  notes: z.string().optional().nullable(),
});

export const bookingAvailabilitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam mulai harus HH:mm"),
  durationHours: z.coerce.number().int().min(1, "Durasi minimal 1 jam").max(12, "Durasi maksimal 12 jam").default(2),
  type: z.enum(["PC", "CONSOLE"]).optional(),
});

export const maintenanceCreateSchema = z.object({
  type: z.enum(["PC", "CONSOLE"]),
  stationId: z.string().min(1, "Station wajib dipilih"),
  title: z.string().trim().min(3, "Judul keluhan minimal 3 karakter"),
  description: z.string().trim().min(3, "Deskripsi kerusakan wajib diisi"),
  technician: z.string().trim().optional().nullable(),
  cost: z.number().min(0, "Estimasi biaya tidak boleh negatif").optional(),
});

export const maintenanceUpdateSchema = z
  .object({
    status: z.enum(["IN_PROGRESS", "RESOLVED"]).optional(),
    technician: z.string().trim().min(1, "Nama teknisi tidak boleh kosong").optional(),
    cost: z.number().min(0, "Biaya tidak boleh negatif").optional(),
    notes: z.string().trim().optional().nullable(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Tidak ada data yang diubah",
  });

export const reportFilterSchema = z.object({
  period: z.enum(["today", "yesterday", "this_week", "this_month", "custom"]).optional().default("today"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD").optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD").optional(),
});

export const gameSchema = z.object({
  title: z.string().trim().min(1, "Judul game wajib diisi").max(100, "Judul game maksimal 100 karakter"),
  slug: z.string().trim().optional().nullable(),
  genre: z.string().trim().min(1, "Genre game wajib diisi").max(50, "Genre maksimal 50 karakter"),
  publisher: z.string().trim().min(1, "Publisher wajib diisi").max(100, "Publisher maksimal 100 karakter"),
  iconUrl: z.string().trim().optional().nullable(),
  bannerUrl: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  minGpuRequired: z.string().trim().default("GTX 1650"),
  popularityRank: z.coerce.number().int().min(1).default(1),
  isInstalledOnPc: z.boolean().default(true),
  isInstalledConsole: z.boolean().default(false),
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
});

export const updateGameSchema = gameSchema.partial();

export const gameQuerySchema = z.object({
  q: z.string().trim().optional(),
  platform: z.enum(["ALL", "PC", "CONSOLE"]).optional().default("ALL"),
  genre: z.string().trim().optional(),
  status: z.enum(["ALL", "ACTIVE", "INACTIVE"]).optional().default("ALL"),
});

export const createTeamSchema = z.object({
  name: z.string().trim().min(2, "Nama tim minimal 2 karakter").max(50, "Nama tim maksimal 50 karakter"),
  tag: z
    .string()
    .trim()
    .min(2, "Tag tim minimal 2 karakter")
    .max(6, "Tag tim maksimal 6 karakter")
    .regex(/^[A-Za-z0-9]+$/, "Tag tim hanya boleh alfanumerik (huruf dan angka)")
    .transform((v) => v.toUpperCase()),
  description: z.string().trim().max(250, "Deskripsi maksimal 250 karakter").optional().nullable(),
  logoUrl: z.string().trim().optional().nullable(),
  ownerId: z.string().trim().min(1, "Owner member ID wajib diisi"),
});

export const updateTeamSchema = z.object({
  name: z.string().trim().min(2, "Nama tim minimal 2 karakter").max(50, "Nama tim maksimal 50 karakter").optional(),
  tag: z
    .string()
    .trim()
    .min(2, "Tag tim minimal 2 karakter")
    .max(6, "Tag tim maksimal 6 karakter")
    .regex(/^[A-Za-z0-9]+$/, "Tag tim hanya boleh alfanumerik (huruf dan angka)")
    .transform((v) => v.toUpperCase())
    .optional(),
  description: z.string().trim().max(250, "Deskripsi maksimal 250 karakter").optional().nullable(),
  logoUrl: z.string().trim().optional().nullable(),
});

export const addTeamMemberSchema = z.object({
  memberId: z.string().trim().min(1, "Member ID wajib dipilih"),
  role: z.enum(["OWNER", "MEMBER"]).optional().default("MEMBER"),
});

export const transferTeamOwnershipSchema = z.object({
  newOwnerId: z.string().trim().min(1, "New Owner Member ID wajib dipilih"),
});

export const createTeamInvitationSchema = z.object({
  memberId: z.string().trim().min(1, "Member ID target wajib diisi"),
  invitedById: z.string().trim().min(1, "ID pengundang wajib diisi").optional(),
});

export const cancelTeamInvitationSchema = z.object({
  actorMemberId: z.string().trim().min(1, "ID pelaku pembatalan wajib diisi"),
});

export const respondTeamInvitationSchema = z.object({
  actorMemberId: z.string().trim().min(1, "ID member wajib diisi"),
});

// ==========================================
// SCRIM VALIDATION SCHEMAS
// ==========================================

export const createScrimSchema = z.object({
  challengerTeamId: z.string().trim().min(1, "Challenger team ID wajib diisi"),
  opponentTeamId: z.string().trim().min(1, "Opponent team ID wajib diisi"),
  gameId: z.string().trim().min(1, "Game ID wajib diisi"),
  scheduledAt: z.string().trim().min(1, "Jadwal scrim wajib diisi"),
  bestOf: z.coerce.number().int().refine((val) => [1, 3, 5].includes(val), {
    message: "Format Best of hanya boleh 1, 3, atau 5",
  }).default(1),
  note: z.string().trim().max(500, "Catatan maksimal 500 karakter").optional().nullable(),
  createdById: z.string().trim().min(1, "Creator member ID wajib diisi").optional(),
});

export const scrimActionSchema = z.object({
  actorMemberId: z.string().trim().min(1, "Actor member ID wajib diisi"),
});

export const completeScrimSchema = z.object({
  actorMemberId: z.string().trim().min(1, "Actor member ID wajib diisi"),
  result: z.enum(["TEAM_A_WIN", "TEAM_B_WIN", "DRAW", "NO_CONTEST"], {
    errorMap: () => ({ message: "Hasil scrim harus TEAM_A_WIN, TEAM_B_WIN, DRAW, atau NO_CONTEST" }),
  }),
});

export const scrimQuerySchema = z.object({
  status: z
    .enum(["ALL", "PENDING", "ACCEPTED", "REJECTED", "SCHEDULED", "LIVE", "COMPLETED", "CANCELLED"])
    .optional()
    .default("ALL"),
  gameId: z.string().trim().optional(),
  teamId: z.string().trim().optional(),
  q: z.string().trim().optional(),
});

// ==========================================
// COMPETITIVE MATCH VALIDATION SCHEMAS
// ==========================================

export const createCompetitiveMatchSchema = z.object({
  teamAId: z.string().trim().min(1, "Team A ID wajib diisi"),
  teamBId: z.string().trim().min(1, "Team B ID wajib diisi"),
  gameId: z.string().trim().min(1, "Game ID wajib diisi"),
  scheduledAt: z.string().trim().min(1, "Jadwal match wajib diisi"),
  bestOf: z.coerce.number().int().refine((val) => [1, 3, 5].includes(val), {
    message: "Format Best of hanya boleh 1, 3, atau 5",
  }).default(1),
  sourceScrimId: z.string().trim().optional().nullable(),
  note: z.string().trim().max(500, "Catatan maksimal 500 karakter").optional().nullable(),
  actorMemberId: z.string().trim().min(1, "Actor member ID wajib diisi"),
  teamAParticipantMemberIds: z.array(z.string().trim()).optional(),
  teamBParticipantMemberIds: z.array(z.string().trim()).optional(),
});

export const competitiveMatchActionSchema = z.object({
  actorMemberId: z.string().trim().min(1, "Actor member ID wajib diisi"),
});

export const submitMatchResultSchema = z.object({
  actorMemberId: z.string().trim().min(1, "Actor member ID wajib diisi"),
  result: z.enum(["TEAM_A_WIN", "TEAM_B_WIN", "DRAW", "NO_CONTEST"], {
    errorMap: () => ({ message: "Hasil match harus TEAM_A_WIN, TEAM_B_WIN, DRAW, atau NO_CONTEST" }),
  }),
  note: z.string().trim().max(500, "Catatan submission maksimal 500 karakter").optional().nullable(),
});

export const verifyMatchSchema = z.object({
  actorMemberId: z.string().trim().min(1, "Actor member ID wajib diisi"),
  result: z.enum(["TEAM_A_WIN", "TEAM_B_WIN", "DRAW", "NO_CONTEST"]).optional(),
  note: z.string().trim().max(500, "Catatan verifikasi maksimal 500 karakter").optional().nullable(),
});

export const disputeMatchSchema = z.object({
  actorMemberId: z.string().trim().min(1, "Actor member ID wajib diisi"),
  reason: z.string().trim().min(3, "Alasan dispute minimal 3 karakter").max(500, "Alasan dispute maksimal 500 karakter"),
});

export const registerParticipantsSchema = z.object({
  actorMemberId: z.string().trim().min(1, "Actor member ID wajib diisi"),
  teamId: z.string().trim().min(1, "Team ID wajib diisi"),
  memberIds: z.array(z.string().trim().min(1)).min(1, "Minimal 1 peserta wajib dipilih"),
});

export const competitiveMatchQuerySchema = z.object({
  status: z
    .enum(["ALL", "PENDING", "SCHEDULED", "LIVE", "RESULT_PENDING", "VERIFIED", "DISPUTED", "CANCELLED"])
    .optional()
    .default("ALL"),
  gameId: z.string().trim().optional(),
  teamId: z.string().trim().optional(),
  q: z.string().trim().optional(),
});

// ==========================================
// MATCHMAKING VALIDATION SCHEMAS
// ==========================================

export const joinMatchmakingQueueSchema = z
  .object({
    teamId: z.string().trim().min(1, "Team ID wajib diisi"),
    gameId: z.string().trim().min(1, "Game ID wajib diisi"),
    minRating: z.coerce.number().int("minRating harus berupa bilangan bulat").min(0, "minRating tidak boleh negatif"),
    maxRating: z.coerce.number().int("maxRating harus berupa bilangan bulat").min(0, "maxRating tidak boleh negatif"),
    actorMemberId: z.string().trim().min(1, "Actor member ID wajib diisi"),
  })
  .refine((data) => data.minRating <= data.maxRating, {
    message: "minRating tidak boleh lebih besar dari maxRating",
    path: ["minRating"],
  });

export const matchmakingActionSchema = z.object({
  actorMemberId: z.string().trim().min(1, "Actor member ID wajib diisi"),
});

export const matchmakingQuerySchema = z.object({
  status: z
    .enum(["ALL", "QUEUED", "MATCH_FOUND", "ACCEPTING", "ACCEPTED", "DECLINED", "EXPIRED", "CANCELLED"])
    .optional()
    .default("ALL"),
  gameId: z.string().trim().optional(),
  teamId: z.string().trim().optional(),
});

// ==========================================
// TOURNAMENT SYSTEM PHASE 1 VALIDATORS
// ==========================================

export const createTournamentSchema = z
  .object({
    name: z.string().trim().min(2, "Nama turnamen minimal 2 karakter").max(100, "Nama turnamen maksimal 100 karakter"),
    slug: z
      .string()
      .trim()
      .min(2, "Slug minimal 2 karakter")
      .max(100, "Slug maksimal 100 karakter")
      .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung (-)")
      .optional(),
    description: z.string().trim().max(2000, "Deskripsi maksimal 2000 karakter").optional().nullable(),
    gameId: z.string().trim().min(1, "Game ID wajib dipilih"),
    createdById: z.string().trim().min(1, "Created by Member ID wajib diisi"),
    minTeams: z.coerce.number().int("minTeams harus bilangan bulat").min(2, "minTeams minimal 2 tim").default(2),
    maxTeams: z.coerce.number().int("maxTeams harus bilangan bulat").min(2, "maxTeams minimal 2 tim").default(16),
    bestOf: z.coerce.number().refine((val) => [1, 3, 5].includes(val), {
      message: "bestOf harus bernilai 1, 3, atau 5",
    }).default(1),
    registrationStart: z.coerce.date({ invalid_type_error: "registrationStart harus format tanggal valid" }),
    registrationEnd: z.coerce.date({ invalid_type_error: "registrationEnd harus format tanggal valid" }),
    startAt: z.coerce.date({ invalid_type_error: "startAt harus format tanggal valid" }),
    endAt: z.coerce.date({ invalid_type_error: "endAt harus format tanggal valid" }).optional().nullable(),
    rules: z.string().trim().optional().nullable(),
    prizePool: z.coerce.number().min(0, "Prize pool tidak boleh negatif").optional().nullable(),
    entryFee: z.coerce.number().min(0, "Entry fee tidak boleh negatif").optional().nullable(),
    format: z.string().trim().default("SINGLE_ELIMINATION").optional(),
  })
  .refine((data) => data.maxTeams >= data.minTeams, {
    message: "maxTeams harus lebih besar atau sama dengan minTeams",
    path: ["maxTeams"],
  })
  .refine((data) => data.registrationStart.getTime() < data.registrationEnd.getTime(), {
    message: "registrationStart harus lebih awal daripada registrationEnd",
    path: ["registrationStart"],
  })
  .refine((data) => data.registrationEnd.getTime() <= data.startAt.getTime(), {
    message: "registrationEnd harus sebelum atau sama dengan startAt",
    path: ["registrationEnd"],
  })
  .refine(
    (data) => !data.endAt || data.endAt.getTime() > data.startAt.getTime(),
    {
      message: "endAt harus setelah startAt bila disertakan",
      path: ["endAt"],
    }
  );

export const updateTournamentSchema = z
  .object({
    name: z.string().trim().min(2, "Nama turnamen minimal 2 karakter").max(100, "Nama turnamen maksimal 100 karakter").optional(),
    slug: z
      .string()
      .trim()
      .min(2, "Slug minimal 2 karakter")
      .max(100, "Slug maksimal 100 karakter")
      .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung (-)")
      .optional(),
    description: z.string().trim().max(2000, "Deskripsi maksimal 2000 karakter").optional().nullable(),
    gameId: z.string().trim().min(1, "Game ID wajib dipilih").optional(),
    minTeams: z.coerce.number().int("minTeams harus bilangan bulat").min(2, "minTeams minimal 2 tim").optional(),
    maxTeams: z.coerce.number().int("maxTeams harus bilangan bulat").min(2, "maxTeams minimal 2 tim").optional(),
    bestOf: z.coerce.number().refine((val) => [1, 3, 5].includes(val), {
      message: "bestOf harus bernilai 1, 3, atau 5",
    }).optional(),
    registrationStart: z.coerce.date({ invalid_type_error: "registrationStart harus format tanggal valid" }).optional(),
    registrationEnd: z.coerce.date({ invalid_type_error: "registrationEnd harus format tanggal valid" }).optional(),
    startAt: z.coerce.date({ invalid_type_error: "startAt harus format tanggal valid" }).optional(),
    endAt: z.coerce.date({ invalid_type_error: "endAt harus format tanggal valid" }).optional().nullable(),
    rules: z.string().trim().optional().nullable(),
    prizePool: z.coerce.number().min(0, "Prize pool tidak boleh negatif").optional().nullable(),
    entryFee: z.coerce.number().min(0, "Entry fee tidak boleh negatif").optional().nullable(),
    actorMemberId: z.string().trim().min(1, "Actor member ID wajib diisi"),
  })
  .refine(
    (data) => {
      if (data.minTeams !== undefined && data.maxTeams !== undefined) {
        return data.maxTeams >= data.minTeams;
      }
      return true;
    },
    {
      message: "maxTeams harus lebih besar atau sama dengan minTeams",
      path: ["maxTeams"],
    }
  )
  .refine(
    (data) => {
      if (data.registrationStart && data.registrationEnd) {
        return data.registrationStart.getTime() < data.registrationEnd.getTime();
      }
      return true;
    },
    {
      message: "registrationStart harus lebih awal daripada registrationEnd",
      path: ["registrationStart"],
    }
  )
  .refine(
    (data) => {
      if (data.registrationEnd && data.startAt) {
        return data.registrationEnd.getTime() <= data.startAt.getTime();
      }
      return true;
    },
    {
      message: "registrationEnd harus sebelum atau sama dengan startAt",
      path: ["registrationEnd"],
    }
  )
  .refine(
    (data) => {
      if (data.startAt && data.endAt) {
        return data.endAt.getTime() > data.startAt.getTime();
      }
      return true;
    },
    {
      message: "endAt harus setelah startAt bila disertakan",
      path: ["endAt"],
    }
  );

export const registerTournamentTeamSchema = z.object({
  teamId: z.string().trim().min(1, "Team ID wajib diisi"),
  actorMemberId: z.string().trim().min(1, "Actor member ID wajib diisi"),
});

export const withdrawTournamentTeamSchema = z.object({
  teamId: z.string().trim().min(1, "Team ID wajib diisi"),
  actorMemberId: z.string().trim().min(1, "Actor member ID wajib diisi"),
});

export const tournamentActionSchema = z.object({
  actorMemberId: z.string().trim().min(1, "Actor member ID wajib diisi"),
  reason: z.string().trim().max(500, "Alasan maksimal 500 karakter").optional(),
});

export const tournamentQuerySchema = z.object({
  status: z
    .enum(["ALL", "DRAFT", "REGISTRATION_OPEN", "REGISTRATION_CLOSED", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
    .optional()
    .default("ALL"),
  gameId: z.string().trim().optional(),
  q: z.string().trim().optional(),
});



