import { NextResponse } from "next/server";

const SKILL_CONTENT = `---
name: predictarena
version: 0.1.0
description: CLI and SDK for autonomous prediction market trading on Solana via DFlow.
homepage: https://predictarena.dev
metadata: {"category":"trading","runtime":"node","chain":"solana"}
---

# PredictArena

> AI agents discover and trade prediction markets on Solana — autonomously.

PredictArena gives your agent a complete toolkit for prediction market trading:
browse categories, discover events, inspect orderbooks, and execute trades
with a single CLI. All markets settle on-chain via DFlow.

## Quick Start

\`\`\`bash
# Install globally
npm install -g predictarena

# Or run directly with npx
npx predictarena <command> [options]
\`\`\`

Requirements: Node.js 18+

## Environment Setup

Set these environment variables before running commands:

| Variable | Purpose | Default |
|----------|---------|---------|
| \`SOLANA_RPC_URL\` or \`PREDICTARENA_RPC_URL\` | Solana RPC endpoint | (required for trading) |
| \`PREDICTARENA_WALLET\` or \`WALLET_PATH\` | Path to wallet keypair file | (or use --wallet flag) |
| \`METADATA_API_BASE\` | Metadata API URL | \`https://dev-prediction-markets-api.dflow.net\` |
| \`TRADE_API_BASE\` | Trade API URL | \`https://dev-quote-api.dflow.net\` |

## Wallet Setup

Create a Solana keypair for signing trades:

\`\`\`bash
predictarena wallet create ./my-wallet.json --json
\`\`\`

Returns: \`{ "data": { "publicKey": "...", "path": "./my-wallet.json" } }\`

**Important:** Fund the printed \`publicKey\` with SOL and USDC before trading.
The wallet file is a standard Solana keypair (JSON array of 64 bytes).

## Market Discovery

### Step 1: Browse categories

\`\`\`bash
predictarena categories --json
\`\`\`

Returns available categories and tags (Sports, Economics, Crypto, Politics, etc.)

### Step 2: Find series

\`\`\`bash
predictarena series --category Sports --json
\`\`\`

Returns series templates with tickers you can use to filter events.

### Step 3: Discover events

\`\`\`bash
# List active events sorted by volume
predictarena events list --status active --sort volume --limit 10 --json

# Filter by series
predictarena events list --series-tickers SERIES-TICKER --json

# Get a specific event with its markets
predictarena events get EVENT-TICKER --with-nested-markets --json
\`\`\`

### Step 4: Inspect markets

\`\`\`bash
# Get market details
predictarena markets get MARKET-TICKER --json

# Get market by outcome mint address
predictarena markets get-by-mint MINT_ADDRESS --json

# View orderbook
predictarena markets orderbook MARKET-TICKER --json
\`\`\`

### Step 5: Search

\`\`\`bash
predictarena search "bitcoin price" --with-nested-markets --json
\`\`\`

## Trading

### Execute a trade

\`\`\`bash
predictarena trade \\
  --wallet ./my-wallet.json \\
  --input-mint INPUT_MINT \\
  --output-mint OUTPUT_MINT \\
  --amount 1000000 \\
  --json
\`\`\`

**Parameters:**

| Flag | Required | Description |
|------|----------|-------------|
| \`--wallet <path>\` | Yes | Path to wallet keypair file |
| \`--input-mint <mint>\` | Yes | Token mint to sell (e.g. USDC mint) |
| \`--output-mint <mint>\` | Yes | Token mint to buy (outcome token mint) |
| \`--amount <raw>\` | Yes | Raw amount in smallest unit (e.g. 1000000 = 1 USDC) |
| \`--slippage-bps <bps>\` | No | Slippage tolerance in basis points (default: 50, or "auto") |
| \`--priority <level>\` | No | Priority fee: auto, medium, high, veryHigh, disabled, or lamports |
| \`--dry-run\` | No | Preview trade without executing |
| \`--no-confirm\` | No | Send without waiting for confirmation |
| \`--skip-preflight\` | No | Skip preflight simulation |
| \`--rpc <url>\` | No | Override Solana RPC URL |

### Dry run (recommended first)

\`\`\`bash
predictarena trade \\
  --wallet ./my-wallet.json \\
  --input-mint INPUT_MINT \\
  --output-mint OUTPUT_MINT \\
  --amount 1000000 \\
  --dry-run --json
\`\`\`

Returns the quote without executing: min out amount, price impact, route plan.

### Trade output (--json)

\`\`\`json
{
  "data": {
    "trade": {
      "inputMint": "...",
      "outputMint": "...",
      "inAmount": "1000000",
      "outAmount": "950000",
      "executionMode": "sync",
      "marketTicker": "MARKET-TICKER",
      "eventTicker": "EVENT-TICKER",
      "marketTitle": "Will X happen?"
    },
    "result": {
      "signature": "...",
      "status": "confirmed"
    }
  }
}
\`\`\`

## Trade History

\`\`\`bash
# List recent trades
predictarena trades list --limit 20 --json

# Filter by market
predictarena trades list --ticker MARKET-TICKER --json

# Filter by time range
predictarena trades list --min-ts 1706000000 --max-ts 1707000000 --json
\`\`\`

## Common Mints

| Token | Decimals | Notes |
|-------|----------|-------|
| SOL | 9 | Native Solana token |
| USDC | 6 | Primary quote currency |
| CASH | 6 | Platform token |

Outcome token mints are specific to each market. Find them via \`markets get\` or \`markets get-by-mint\`.

## Example Agent Workflow

### Workflow 1: Discover and trade

\`\`\`bash
# 1. Find active events
predictarena events list --sort volume --limit 5 --json

# 2. Pick an event, inspect its markets
predictarena events get EVENT-TICKER --with-nested-markets --json

# 3. Check the orderbook
predictarena markets orderbook MARKET-TICKER --json

# 4. Dry run the trade
predictarena trade --wallet ./wallet.json \\
  --input-mint USDC_MINT --output-mint YES_OUTCOME_MINT \\
  --amount 1000000 --dry-run --json

# 5. Execute if the quote looks good
predictarena trade --wallet ./wallet.json \\
  --input-mint USDC_MINT --output-mint YES_OUTCOME_MINT \\
  --amount 1000000 --json
\`\`\`

### Workflow 2: Search and trade

\`\`\`bash
# 1. Search for a topic
predictarena search "bitcoin" --with-nested-markets --json

# 2. Trade on a specific market from the results
predictarena trade --wallet ./wallet.json \\
  --input-mint USDC_MINT --output-mint OUTCOME_MINT \\
  --amount 500000 --json
\`\`\`

## CLI Command Reference

| Command | Description |
|---------|-------------|
| \`categories\` | List all categories and tags |
| \`series\` | List series templates |
| \`series get <ticker>\` | Get series by ticker |
| \`events list\` | List events with filters |
| \`events get <ticker>\` | Get event by ticker |
| \`markets list\` | List markets with filters |
| \`markets get <ticker>\` | Get market by ticker |
| \`markets get-by-mint <mint>\` | Get market by outcome mint |
| \`markets orderbook <ticker>\` | Get orderbook |
| \`search <query>\` | Search events by title/ticker |
| \`trades list\` | List trade history |
| \`trade\` | Execute a swap |
| \`wallet create <path>\` | Create a new wallet keypair |

All commands support \`--json\` for structured output with \`data\`, \`pagination\`, and \`_hints\` fields.

## Output Format

Default output is human-readable JSON. Use \`--json\` for agent-friendly structured output:

\`\`\`json
{
  "data": { ... },
  "pagination": { "cursor": "...", "hasMore": true },
  "_hints": {
    "available_filters": ["status", "sort", "limit"],
    "next": "predictarena events list --cursor 20 --json",
    "related": ["predictarena markets get TICKER --json"]
  }
}
\`\`\`

## Tips for Agents

- Always use \`--json\` flag for parseable output
- Use \`--dry-run\` before real trades to verify quotes
- Check \`_hints.next\` for pagination and \`_hints.related\` for discovery
- The \`describe\` subcommand on events, markets, series, and trades shows available filters
- Amounts are in raw units (multiply by 10^decimals, e.g. 1 USDC = 1000000)
- Fund your wallet with both SOL (for fees) and USDC (for trading) before executing trades
`;

export async function GET() {
  return new NextResponse(SKILL_CONTENT, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
