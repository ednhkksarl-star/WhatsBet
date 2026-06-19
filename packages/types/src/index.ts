export type UserStatus = "active" | "blocked" | "suspended";
export type AdminRole = "SUPER_ADMIN" | "BETIKA" | "SUPPORT";
export type TicketStatus = "pending" | "won" | "lost" | "cancelled";
export type TransactionStatus = "pending" | "completed" | "failed" | "cancelled";
export type TransactionType = "deposit" | "withdrawal" | "bet" | "win" | "refund";
export type WithdrawalStatus = "pending" | "approved" | "rejected" | "paid";
export type MatchStatus = "scheduled" | "live" | "finished" | "cancelled" | "postponed";
export type MarketType =
  | "1x2"
  | "double_chance"
  | "btts"
  | "over_under";
export type QuickBetType = "safe" | "balanced" | "jackpot" | "custom";
export type ConversationStep =
  | "idle"
  | "awaiting_stake"
  | "awaiting_deposit_amount"
  | "awaiting_withdrawal_amount"
  | "awaiting_mobile_money"
  | "building_ticket"
  | "quickbet_menu"
  | "quickbet_custom_budget";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DashboardKpis {
  totalUsers: number;
  activeUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
  totalTickets: number;
  totalVolume: number;
  totalProfit: number;
  totalCommission: number;
}

export interface WhatsAppInboundMessage {
  from: string;
  name?: string;
  text: string;
  messageId: string;
  timestamp: number;
}

export interface WhatsAppOutboundMessage {
  to: string;
  text: string;
}

export interface GatewayWebhookPayload {
  type: "message" | "status" | "qr";
  data: WhatsAppInboundMessage | { qr: string } | { status: string };
  signature: string;
  timestamp: number;
}
