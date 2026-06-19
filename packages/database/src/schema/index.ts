import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
  pgEnum,
  boolean,
  jsonb,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userStatusEnum = pgEnum("user_status", ["active", "blocked", "suspended"]);
export const adminRoleEnum = pgEnum("admin_role", ["SUPER_ADMIN", "BETIKA", "SUPPORT"]);
export const ticketStatusEnum = pgEnum("ticket_status", ["pending", "won", "lost", "cancelled"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "completed", "failed", "cancelled"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["deposit", "withdrawal", "bet", "win", "refund"]);
export const withdrawalStatusEnum = pgEnum("withdrawal_status", ["pending", "approved", "rejected", "paid"]);
export const matchStatusEnum = pgEnum("match_status", ["scheduled", "live", "finished", "cancelled", "postponed"]);
export const marketTypeEnum = pgEnum("market_type", ["1x2", "double_chance", "btts", "over_under"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  phone: varchar("phone", { length: 32 }).notNull().unique(),
  whatsappJid: varchar("whatsapp_jid", { length: 128 }),
  name: varchar("name", { length: 255 }),
  profilePictureBase64: text("profile_picture_base64"),
  balance: decimal("balance", { precision: 18, scale: 2 }).notNull().default("0"),
  status: userStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [index("users_phone_idx").on(t.phone)]);

export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: adminRoleEnum("role").notNull().default("SUPPORT"),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  twoFactorSecret: text("two_factor_secret"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const betikaUsers = pgTable("betika_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminId: uuid("admin_id").notNull().references(() => admins.id),
  companyName: varchar("company_name", { length: 255 }).notNull().default("Betika"),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull().default("5.00"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const leagues = pgTable("leagues", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalId: varchar("external_id", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  country: varchar("country", { length: 100 }),
  sport: varchar("sport", { length: 50 }).notNull().default("football"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalId: varchar("external_id", { length: 100 }),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const matches = pgTable("matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalId: varchar("external_id", { length: 100 }).notNull().unique(),
  leagueId: uuid("league_id").references(() => leagues.id),
  homeTeamId: uuid("home_team_id").references(() => teams.id),
  awayTeamId: uuid("away_team_id").references(() => teams.id),
  homeTeam: varchar("home_team", { length: 255 }).notNull(),
  awayTeam: varchar("away_team", { length: 255 }).notNull(),
  league: varchar("league", { length: 255 }).notNull(),
  country: varchar("country", { length: 100 }),
  startTime: timestamp("start_time").notNull(),
  status: matchStatusEnum("status").notNull().default("scheduled"),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("matches_start_time_idx").on(t.startTime),
  index("matches_status_idx").on(t.status),
]);

export const markets = pgTable("markets", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchId: uuid("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
  type: marketTypeEnum("type").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const odds = pgTable("odds", {
  id: uuid("id").primaryKey().defaultRandom(),
  marketId: uuid("market_id").notNull().references(() => markets.id, { onDelete: "cascade" }),
  selection: varchar("selection", { length: 100 }).notNull(),
  value: decimal("value", { precision: 8, scale: 3 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  stake: decimal("stake", { precision: 18, scale: 2 }).notNull(),
  totalOdds: decimal("total_odds", { precision: 12, scale: 4 }).notNull(),
  potentialWin: decimal("potential_win", { precision: 18, scale: 2 }).notNull(),
  status: ticketStatusEnum("status").notNull().default("pending"),
  isQuickBet: boolean("is_quickbet").notNull().default(false),
  quickBetType: varchar("quickbet_type", { length: 50 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  settledAt: timestamp("settled_at"),
}, (t) => [
  index("tickets_user_id_idx").on(t.userId),
  index("tickets_status_idx").on(t.status),
]);

export const ticketSelections = pgTable("ticket_selections", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  matchId: uuid("match_id").notNull().references(() => matches.id),
  oddId: uuid("odd_id").notNull().references(() => odds.id),
  selection: varchar("selection", { length: 100 }).notNull(),
  oddValue: decimal("odd_value", { precision: 8, scale: 3 }).notNull(),
  result: varchar("result", { length: 20 }),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  type: transactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  status: transactionStatusEnum("status").notNull().default("pending"),
  reference: varchar("reference", { length: 255 }).unique(),
  idempotencyKey: varchar("idempotency_key", { length: 255 }).unique(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
}, (t) => [index("transactions_user_id_idx").on(t.userId)]);

export const withdrawals = pgTable("withdrawals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  mobileMoneyNumber: varchar("mobile_money_number", { length: 20 }).notNull(),
  status: withdrawalStatusEnum("status").notNull().default("pending"),
  reviewedBy: uuid("reviewed_by").references(() => admins.id),
  reviewedAt: timestamp("reviewed_at"),
  paidAt: timestamp("paid_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("withdrawals_status_idx").on(t.status)]);

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(),
  message: text("message").notNull(),
  sent: boolean("sent").notNull().default(false),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditLogs = pgTable("logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorType: varchar("actor_type", { length: 20 }).notNull(),
  actorId: uuid("actor_id"),
  action: varchar("action", { length: 100 }).notNull(),
  ip: varchar("ip", { length: 45 }),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("logs_created_at_idx").on(t.createdAt)]);

export const conversationSessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  step: varchar("step", { length: 50 }).notNull().default("idle"),
  context: jsonb("context").default({}),
  expiresAt: timestamp("expires_at").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [index("sessions_user_id_idx").on(t.userId)]);

export const settings = pgTable("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  fromMe: boolean("from_me").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("messages_user_id_idx").on(t.userId)]);

export const usersRelations = relations(users, ({ many }) => ({
  tickets: many(tickets),
  transactions: many(transactions),
  withdrawals: many(withdrawals),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, { fields: [messages.userId], references: [users.id] }),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  user: one(users, { fields: [tickets.userId], references: [users.id] }),
  selections: many(ticketSelections),
}));

export const matchesRelations = relations(matches, ({ many }) => ({
  markets: many(markets),
}));

export const marketsRelations = relations(markets, ({ one, many }) => ({
  match: one(matches, { fields: [markets.matchId], references: [matches.id] }),
  odds: many(odds),
}));
