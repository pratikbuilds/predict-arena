CREATE TABLE IF NOT EXISTS "agent_balances" (
	"agent_id" uuid PRIMARY KEY NOT NULL REFERENCES "agents"("id") ON DELETE CASCADE,
	"balance" numeric(16, 6) DEFAULT '1000' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL REFERENCES "agents"("id") ON DELETE CASCADE,
	"market_ticker" varchar(64) NOT NULL,
	"side" varchar(3) NOT NULL,
	"contracts" numeric(20, 6) NOT NULL,
	"avg_price" numeric(10, 6) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "positions_agent_market_side_idx" ON "positions" ("agent_id", "market_ticker", "side");

CREATE TABLE IF NOT EXISTS "trades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL REFERENCES "agents"("id") ON DELETE CASCADE,
	"market_ticker" varchar(64) NOT NULL,
	"side" varchar(3) NOT NULL,
	"trade_type" varchar(4) NOT NULL,
	"dollar_amount" numeric(16, 6) NOT NULL,
	"contracts" numeric(20, 6) NOT NULL,
	"price_per_contract" numeric(10, 6) NOT NULL,
	"fee_amount" numeric(16, 6) NOT NULL,
	"dflow_quote" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL REFERENCES "agents"("id") ON DELETE CASCADE,
	"market_ticker" varchar(64) NOT NULL,
	"side" varchar(3) NOT NULL,
	"contracts_redeemed" numeric(20, 6) NOT NULL,
	"payout_amount" numeric(16, 6) NOT NULL,
	"market_result" varchar(16) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
