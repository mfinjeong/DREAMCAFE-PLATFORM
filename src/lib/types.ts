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
export type TeamMemberRole = "OWNER" | "MEMBER";
export type TeamInvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";

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
  dreamRating?: number;
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
  isLowStock?: boolean;
  isOutOfStock?: boolean;
  lastMovement?: {
    action: InventoryAction;
    quantity: number;
    createdAt: string;
    reason: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventorySummaryDTO {
  totalProducts: number;
  totalStock: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalValuation: number;
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
  categoryName?: string;
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
  stationId?: string;
  stationNumber?: string;
  stationName?: string;
  memberId: string;
  memberName: string;
  username?: string | null;
  phoneNumber?: string | null;
  bookingDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationHours: number;
  totalPrice: number;
  status: BookingStatus;
  notes?: string | null;
  createdAt?: string;
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
  description?: string | null;
  logoUrl?: string | null;
  ownerId: string;
  ownerName: string;
  ownerUsername: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
  leaderName?: string;
  wins?: number;
  losses?: number;
  eloRating?: number;
}

export interface TeamMemberDTO {
  id: string;
  teamId: string;
  memberId: string;
  memberName: string;
  username: string;
  memberCode: string;
  tier: MemberTier;
  level: number;
  role: TeamMemberRole;
  dreamRating: number;
  dreamRank: DreamRank;
  avatarUrl?: string | null;
  joinedAt: string;
}

export interface TeamMemberRatingInfo {
  memberId: string;
  memberName: string;
  username: string;
  rating: number;
  rank: DreamRank;
}

export interface TeamStatisticsDTO {
  teamId: string;
  totalMembers: number;
  averageRating: number;
  highestRating: number;
  lowestRating: number;
  highestRank: DreamRank;
  lowestRank: DreamRank;
  highestRatedMember: TeamMemberRatingInfo | null;
  lowestRatedMember: TeamMemberRatingInfo | null;
  totalCompletedSessions: number;
  totalPlayMinutes: number;
  totalPlayHours: number;
  uniqueGamesPlayed: number;
}

export interface TeamProfileDTO {
  team: TeamItem;
  owner: {
    id: string;
    fullName: string;
    username: string;
    memberCode: string;
  };
  memberCount: number;
  members: TeamMemberDTO[];
  summary: {
    averageRating: number;
    highestRating: number;
    lowestRating: number;
    highestRank: DreamRank;
    lowestRank: DreamRank;
    highestRatedMember: TeamMemberRatingInfo | null;
    lowestRatedMember: TeamMemberRatingInfo | null;
  };
  statistics: TeamStatisticsDTO;
}

export interface TeamSummaryDTO {
  team: TeamItem;
  owner: {
    id: string;
    fullName: string;
    username: string;
    memberCode: string;
  };
  memberCount: number;
  members: TeamMemberDTO[];
  averageRating: number;
  highestRating: number;
  lowestRating: number;
  highestRank: DreamRank;
  lowestRank: DreamRank;
  highestRatedMember?: TeamMemberRatingInfo | null;
  lowestRatedMember?: TeamMemberRatingInfo | null;
  statistics?: TeamStatisticsDTO;
}

export interface MemberTeamMembershipDTO {
  id: string;
  teamId: string;
  teamName: string;
  teamTag: string;
  role: TeamMemberRole;
  memberCount: number;
  joinedAt: string;
}

export interface TeamInvitationDTO {
  id: string;
  teamId: string;
  teamName: string;
  teamTag: string;
  memberId: string;
  memberName: string;
  memberUsername?: string;
  invitedById: string;
  invitedByName: string;
  invitedByUsername?: string;
  status: TeamInvitationStatus;
  createdAt: string;
  respondedAt?: string | null;
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

export interface DailyRevenueItem {
  date: string;
  revenue: number;
  transactionCount: number;
  sessionRevenue: number;
  storeRevenue: number;
}

export interface RevenueSummaryDTO {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  cashReceived: number;
  cashChange: number;
  sessionRevenue: number;
  sessionCount: number;
  storeRevenue: number;
  storeCount: number;
  mixedRevenue: number;
  mixedCount: number;
}

export interface SessionAnalyticsDTO {
  totalSessions: number;
  completedSessions: number;
  activeSessions: number;
  cancelledSessions: number;
  totalPlayHours: number;
  averageDurationMinutes: number;
  totalSessionRevenue: number;
  pcSessionsCount: number;
  pcPlayHours: number;
  pcRevenue: number;
  consoleSessionsCount: number;
  consolePlayHours: number;
  consoleRevenue: number;
}

export interface StationPerformanceItem {
  id: string;
  stationNumber: string;
  name: string;
  type: "PC" | "CONSOLE";
  sessionCount: number;
  totalPlayHours: number;
  revenue: number;
}

export interface StationUtilizationDTO {
  pcUsageHours: number;
  consoleUsageHours: number;
  totalSessions: number;
  mostUsedPC: string | null;
  mostUsedConsole: string | null;
  leastUsedStation: string | null;
  stations: StationPerformanceItem[];
}

export interface BookingAnalyticsDTO {
  totalBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  pendingBookings: number;
  totalBookingValue: number;
  completionRate: number;
}

export interface MemberAnalyticsDTO {
  totalMembers: number;
  newMembers: number;
  activeMembers: number;
  memberRevenue: number;
  memberTransactionCount: number;
  guestRevenue: number;
  guestTransactionCount: number;
}

export interface TopProductItem {
  productId: string;
  productName: string;
  categoryName?: string;
  unitsSold: number;
  revenue: number;
  averagePrice: number;
}

export interface ProductAnalyticsDTO {
  storeRevenue: number;
  totalUnitsSold: number;
  uniqueProductsSold: number;
  topProducts: TopProductItem[];
}

export interface InventoryAnalyticsDTO {
  stockInCount: number;
  stockInUnits: number;
  stockOutCount: number;
  stockOutUnits: number;
  adjustmentCount: number;
  totalStockMovement: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalValuation: number;
}

export interface ComprehensiveReportDTO {
  period: string;
  startDate: string;
  endDate: string;
  revenueSummary: RevenueSummaryDTO;
  dailyRevenue: DailyRevenueItem[];
  sessionAnalytics: SessionAnalyticsDTO;
  stationUtilization: StationUtilizationDTO;
  bookingAnalytics: BookingAnalyticsDTO;
  memberAnalytics: MemberAnalyticsDTO;
  productAnalytics: ProductAnalyticsDTO;
  inventoryAnalytics: InventoryAnalyticsDTO;
  recentTransactions: TransactionRecord[];
}

// ==========================================
// GAME LIBRARY & GAMING PROFILE TYPES
// ==========================================

export interface GameItem {
  id: string;
  title: string;
  slug?: string | null;
  genre: string;
  publisher: string;
  iconUrl?: string | null;
  bannerUrl?: string | null;
  description?: string | null;
  minGpuRequired: string;
  popularityRank: number;
  isInstalledOnPc: boolean;
  isInstalledConsole: boolean;
  isActive: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  totalSessions?: number;
  totalPlayMinutes?: number;
}

export interface MemberGameStatItem {
  id: string;
  memberId: string;
  gameId: string;
  gameTitle: string;
  gameGenre: string;
  gameIconUrl?: string | null;
  totalSessions: number;
  totalPlayMinutes: number;
  totalPlayHours: number;
  wins: number;
  losses: number;
  xp: number;
  lastPlayedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GamingActivityItem {
  id: string;
  sessionNumber: string;
  gameId?: string | null;
  gameTitle?: string | null;
  stationType: string;
  stationNumber: string;
  durationMinutes: number;
  startTime: string;
  endTime?: string | null;
  status: string;
  xpEarned: number;
}

export interface DreamRankProgressDTO {
  currentRank: DreamRank;
  currentRating: number;
  minRating: number;
  maxRating: number | null;
  nextRank: DreamRank | null;
  nextRankMinRating: number | null;
  ratingInTier: number;
  tierSpan: number | null;
  progressPercent: number;
  ratingNeeded: number;
}

export interface DreamRankHistoryItem {
  id: string;
  memberId: string;
  previousRating: number;
  newRating: number;
  previousRank: DreamRank;
  newRank: DreamRank;
  change: number;
  reason: string;
  createdAt: string;
}

export interface DreamRankProfileDTO {
  memberId: string;
  rank: DreamRank;
  rating: number;
  progress: DreamRankProgressDTO;
  history: DreamRankHistoryItem[];
}

export interface GamingProfileDTO {
  member: {
    id: string;
    memberCode: string;
    fullName: string;
    username: string;
    tier: MemberTier;
    dreamRank: DreamRank;
    dreamRating: number;
    avatarUrl?: string | null;
    dreamCoins: number;
    xp: number;
    level: number;
    createdAt: string;
  };
  stats: {
    totalSessions: number;
    totalPlayMinutes: number;
    totalPlayHours: number;
    xpForCurrentLevel: number;
    xpForNextLevel: number;
    progressPercent: number;
    xpRemaining: number;
  };
  dreamRankProfile: DreamRankProfileDTO;
  teams: MemberTeamMembershipDTO[];
  favoriteGames: MemberGameStatItem[];
  gamesPlayed: MemberGameStatItem[];
  recentActivity: GamingActivityItem[];
}

// ==========================================
// SCRIM SYSTEM TYPES (PHASE 1)
// ==========================================

export type { ScrimStatus, ScrimResult } from "@prisma/client";

export interface ScrimTeamSummary {
  id: string;
  name: string;
  tag: string;
  logoUrl?: string | null;
  ownerId: string;
  ownerName: string;
  ownerUsername: string;
  memberCount: number;
}

export interface ScrimItem {
  id: string;
  challengerTeamId: string;
  challengerTeam: ScrimTeamSummary;
  opponentTeamId: string;
  opponentTeam: ScrimTeamSummary;
  gameId: string;
  game: {
    id: string;
    title: string;
    genre: string;
    iconUrl?: string | null;
  };
  scheduledAt: string;
  bestOf: number;
  status: import("@prisma/client").ScrimStatus;
  result?: import("@prisma/client").ScrimResult | null;
  winnerTeamId?: string | null;
  winnerTeam?: ScrimTeamSummary | null;
  note?: string | null;
  createdById: string;
  createdBy: {
    id: string;
    fullName: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

// ==========================================
// COMPETITIVE MATCH TYPES (PHASE 1)
// ==========================================

export type { CompetitiveMatchStatus, CompetitiveMatchResult } from "@prisma/client";

export interface CompetitiveMatchParticipantDTO {
  id: string;
  matchId: string;
  teamId: string;
  teamTag: string;
  teamName: string;
  memberId: string;
  memberName: string;
  memberUsername: string;
  memberCode: string;
  dreamRating: number;
  dreamRank: string;
  createdAt: string;
}

export interface CompetitiveMatchSubmissionDTO {
  id: string;
  matchId: string;
  submittedByTeamId: string;
  submittedByTeamTag: string;
  submittedByTeamName: string;
  submittedById: string;
  submittedByName: string;
  result: import("@prisma/client").CompetitiveMatchResult;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompetitiveMatchItem {
  id: string;
  teamAId: string;
  teamA: ScrimTeamSummary;
  teamBId: string;
  teamB: ScrimTeamSummary;
  gameId: string;
  game: {
    id: string;
    title: string;
    genre: string;
    iconUrl?: string | null;
  };
  scheduledAt: string;
  bestOf: number;
  status: import("@prisma/client").CompetitiveMatchStatus;
  result?: import("@prisma/client").CompetitiveMatchResult | null;
  winnerTeamId?: string | null;
  winnerTeam?: ScrimTeamSummary | null;
  sourceScrimId?: string | null;
  note?: string | null;
  createdById: string;
  createdBy: {
    id: string;
    fullName: string;
    username: string;
  };
  participantsCount: number;
  submissionsCount: number;
  isDisputed: boolean;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export type { CompetitiveRatingChangeType } from "@prisma/client";

export interface CompetitiveRatingApplicationItem {
  id: string;
  matchId: string;
  memberId: string;
  memberName: string;
  memberUsername: string;
  memberCode: string;
  teamId?: string;
  teamTag?: string;
  teamName?: string;
  previousRating: number;
  newRating: number;
  ratingChange: number;
  changeType: import("@prisma/client").CompetitiveRatingChangeType;
  previousRank: import("@prisma/client").DreamRank;
  newRank: import("@prisma/client").DreamRank;
  createdAt: string;
}

export interface MatchRatingResultDTO {
  matchId: string;
  alreadyApplied: boolean;
  applications: CompetitiveRatingApplicationItem[];
}

export interface MemberCompetitiveStatsDTO {
  memberId: string;
  fullName: string;
  username: string;
  memberCode: string;
  currentRating: number;
  currentRank: import("@prisma/client").DreamRank;
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  recentRatingChanges: CompetitiveRatingApplicationItem[];
}

export interface CompetitiveMatchDetailDTO extends CompetitiveMatchItem {
  participants: CompetitiveMatchParticipantDTO[];
  submissions: CompetitiveMatchSubmissionDTO[];
  ratingApplications: CompetitiveRatingApplicationItem[];
}
