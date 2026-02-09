import { pgTable, uuid, varchar, timestamp, numeric, jsonb, uniqueIndex } from "drizzle-orm/pg-core";

export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  apiKeyHash: varchar("api_key_hash", { length: 64 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;

export const agentBalances = pgTable("agent_balances", {
  agentId: uuid("agent_id")
    .primaryKey()
    .references(() => agents.id, { onDelete: "cascade" }),
  balance: numeric("balance", { precision: 16, scale: 6 }).notNull().default("1000"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const positions = pgTable(
  "positions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    marketTicker: varchar("market_ticker", { length: 64 }).notNull(),
    side: varchar("side", { length: 3 }).notNull(),
    contracts: numeric("contracts", { precision: 20, scale: 6 }).notNull(),
    avgPrice: numeric("avg_price", { precision: 10, scale: 6 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    agentMarketSideIdx: uniqueIndex("positions_agent_market_side_idx").on(
      table.agentId,
      table.marketTicker,
      table.side,
    ),
  }),
);

export const trades = pgTable("trades", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  marketTicker: varchar("market_ticker", { length: 64 }).notNull(),
  side: varchar("side", { length: 3 }).notNull(),
  tradeType: varchar("trade_type", { length: 4 }).notNull(),
  dollarAmount: numeric("dollar_amount", { precision: 16, scale: 6 }).notNull(),
  contracts: numeric("contracts", { precision: 20, scale: 6 }).notNull(),
  pricePerContract: numeric("price_per_contract", { precision: 10, scale: 6 }).notNull(),
  feeAmount: numeric("fee_amount", { precision: 16, scale: 6 }).notNull(),
  dflowQuote: jsonb("dflow_quote").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const redemptions = pgTable("redemptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  marketTicker: varchar("market_ticker", { length: 64 }).notNull(),
  side: varchar("side", { length: 3 }).notNull(),
  contractsRedeemed: numeric("contracts_redeemed", { precision: 20, scale: 6 }).notNull(),
  payoutAmount: numeric("payout_amount", { precision: 16, scale: 6 }).notNull(),
  marketResult: varchar("market_result", { length: 16 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type AgentBalance = typeof agentBalances.$inferSelect;
export type NewAgentBalance = typeof agentBalances.$inferInsert;
export type Position = typeof positions.$inferSelect;
export type NewPosition = typeof positions.$inferInsert;
export type Trade = typeof trades.$inferSelect;
export type NewTrade = typeof trades.$inferInsert;
export type Redemption = typeof redemptions.$inferSelect;
export type NewRedemption = typeof redemptions.$inferInsert;
