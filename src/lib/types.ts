export type PCStatus = "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "OFFLINE";
export type ConsoleType = "PS5" | "PS4" | "SWITCH";
export type ConsoleStatus = "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "OFFLINE";
export type StationZone = "REGULAR" | "VIP" | "ARENA";
export type SessionType = "PC" | "CONSOLE";
export type SessionStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "REFUNDED";
export type PaymentMethod = "CASH";
export type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
export type MemberTier = "REGULAR" | "VIP" | "PRO";
export type DreamRank = "UNRANKED" | "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND" | "MASTER" | "GRANDMASTER";
export type InventoryAction = "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT";
export type TournamentStatus = "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";
export type MaintenanceStatus = "SCHEDULED" | "IN_PROGRESS" | "RESOLVED";

export interface PCStation {
  id: string;
  stationNumber: string;
  name: string;
  zone: StationZone;
  status: PCStatus;
  hourlyRate: number;
  ipAddress?: string | null;
  macAddress?: string | null;
  specsCpu: string;
  specsGpu: string;
  specsRam: string;
  specsMonitor: string;
  specsStorage: string;
  specsPeripherals: string;
  currentGame?: string | null;
  activeSessionId?: string | null;
  activeSession?: SessionItem | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConsoleStation {
  id: string;
  stationNumber: string;
  name: string;
  consoleType: ConsoleType;
  status: ConsoleStatus;
  hourlyRate: number;
  controllersCount: number;
  installedGames: string[];
  specsDisplay: string;
  currentGame?: string | null;
  activeSessionId?: string | null;
  activeSession?: SessionItem | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SessionItem {
  id: string;
  sessionNumber: string;
  type: SessionType;
  pcId?: string | null;
  pcStationNumber?: string | null;
  consoleId?: string | null;
  consoleStationNumber?: string | null;
  memberId?: string | null;
  memberName?: string | null;
  guestName?: string | null;
  startTime: string; // ISO
  endTime?: string | null;
  durationMinutes: number;
  remainingMinutes: number;
  hourlyRate: number;
  totalPrice: number;
  status: SessionStatus;
  paymentStatus: PaymentStatus;
  currentGame?: string | null;
  notes?: string | null;
}

export interface MemberItem {
  id: string;
  memberCode: string;
  fullName: string;
  username: string;
  phoneNumber?: string | null;
  email?: string | null;
  tier: MemberTier;
  balance: number;
  dreamCoins: number;
  xp: number;
  level: number;
  dreamRank: DreamRank;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
  totalSessions?: number;
  totalTransactions?: number;
}

export interface ProductItem {
  id: string;
  name: string;
  barcode?: string | null;
  categoryId: string;
  categoryName?: string;
  price: number;
  costPrice: number;
  stock: number;
  minStockAlert: number;
  unit: string;
  isActive: boolean;
}

export interface ProductCategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface POSCartItem {
  product: ProductItem;
  quantity: number;
}

export interface InventoryLogItem {
  id: string;
  productId: string;
  productName: string;
  action: InventoryAction;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  recordedBy: string;
  createdAt: string;
}

export interface TransactionItemDTO {
  id: string;
  description: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface TransactionRecord {
  id: string;
  invoiceNumber: string;
  memberId?: string | null;
  memberName?: string | null;
  cashierName: string;
  type: "SESSION" | "STORE" | "MIXED";
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  cashReceived: number;
  cashChange: number;
  paymentMethod: "CASH";
  status: "PAID";
  items: TransactionItemDTO[];
  createdAt: string;
}

export interface BookingItem {
  id: string;
  bookingCode: string;
  type: SessionType;
  pcId?: string | null;
  pcStationNumber?: string | null;
  consoleId?: string | null;
  consoleStationNumber?: string | null;
  memberId: string;
  memberName: string;
  bookingDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationHours: number;
  totalPrice: number;
  status: BookingStatus;
  notes?: string | null;
}

export interface GameItem {
  id: string;
  title: string;
  genre: string;
  publisher: string;
  minGpuRequired: string;
  popularityRank: number;
  isInstalledOnPc: boolean;
  isInstalledConsole: boolean;
  tags: string[];
}

export interface TournamentItem {
  id: string;
  title: string;
  gameTitle: string;
  format: string;
  maxTeams: number;
  prizePool: number;
  entryFee: number;
  startDate: string;
  status: TournamentStatus;
  rules?: string | null;
}

export interface TeamItem {
  id: string;
  name: string;
  tag: string;
  leaderName: string;
  memberCount: number;
  wins: number;
  losses: number;
  eloRating: number;
}

export interface MaintenanceItem {
  id: string;
  type: SessionType;
  stationId: string | null;
  stationNumber: string;
  stationName: string;
  title: string;
  description: string;
  cost: number;
  technician: string;
  status: MaintenanceStatus;
  reportedAt: string;
  resolvedAt?: string | null;
}
