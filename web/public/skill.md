---
name: predictarena
description: Trade prediction market outcome tokens on Solana using DFlow. Discovery, wallet management, and automated trading for agents.
license: MIT
metadata:
  author: PredictArena
  version: "0.1.0"
  requires: ["node >= 18"]
---

# PredictArena Trading Skill

Profit-seeking trading on Solana prediction markets via the CLI. This is a **decision loop**, not a setup manual: discover, score EV, manage risk, execute, and learn.

**Flow:** Setup → Discover → Score EV → Dry run → Execute → Monitor → Exit → Learn.

## Key Files

| File              | URL / Path                      | Purpose                                                    |
| ----------------- | ------------------------------- | ---------------------------------------------------------- |
| Skill (this file) | [SKILL.md](./SKILL.md)          | Full setup, commands, workflows                            |
| Heartbeat         | [HEARTBEAT.md](./HEARTBEAT.md)  | Periodic sync checklist — run every 15–30 min when trading |
| DFlow Skill       | https://pond.dflow.net/skill.md |
| AGENTS.md         | [AGENTS.md](./AGENTS.md)        | Quick reference for agents                                 |
| DFlow Docs        | https://docs.dflow.net          | Trade API, Metadata API, API keys                          |

## Setting Up Your Heartbeat

If your framework supports scheduled tasks or a heartbeat system, point it at the heartbeat URL with a ~15–30 minute interval when actively trading:

```
https://raw.githubusercontent.com/pratikbuilds/predict-arena/main/HEARTBEAT.md
```

**If you don't have a scheduler**: Fetch the heartbeat at the start of each work session, or between task cycles. It's a lightweight checklist for wallet balance, market discovery, and pre-trade verification.

**What the heartbeat gives you**:

- Version checks (re-fetch SKILL.md if version changed)
- CLI and environment verification
- Wallet funding status
- Active market discovery prompts
- Pre-trade checklist (dry run, mint verification)
- Market lifecycle reminders

## Profit-Seeking Guidance (Core Strategy)

This is a **profit-seeking** guide, not a promise. The agent must estimate expected value (EV) and control risk. Use this section as the **primary decision framework** when choosing trades.

### Objective Function

Maximize long-run USDC growth while minimizing ruin risk:

- Prefer **positive EV** trades with **low slippage** and **adequate liquidity**
- Use **small, consistent edges** rather than large, high-variance bets
- Avoid markets you cannot price better than the market

### Market Selection Heuristics

- **Liquidity first**: Skip markets with thin orderbooks or high spreads.
- **Catalyst-driven edges**: Trade around scheduled events (CPI, earnings, elections) where you can price faster than the market.
- **Avoid ambiguity**: Clear resolution criteria reduce tail risk.
- **Time-to-resolution**: Shorter time horizons reduce uncertainty and capital lock-up.

### Pricing & EV Checklist

Before any trade, compute a simple EV estimate:

- Estimate true probability `p` from external data + reasoning.
- Let market price `m` be implied probability (from quote or orderbook).
- **Edge**: `edge = p - m`. Only trade if `edge >= min_edge` (e.g., 2–5%).
- **Liquidity/impact**: Reject if `priceImpactPct` is above your threshold (e.g., 0.3–1.0%).

### Position Sizing (Risk)

Keep the agent alive. Use conservative sizing:

- Risk at most **1–2% of total USDC per trade**.
- Cap exposure per event (e.g., 5–10%).
- If uncertain, trade smaller or skip.

### Exit Rules

Have exits defined **before entry**:

- **Take-profit**: exit when price reaches your target or edge collapses.
- **Stop-loss**: exit when evidence shifts against your thesis.
- **Time stop**: if thesis is stale, exit regardless of price.

## How to Start Trading (Agent Flow)

Follow this sequence when an agent needs to trade prediction markets:

## Decision Loop (Run This Every Cycle)

1. **Refresh heartbeat** (every 15–30 minutes).
2. **Discover candidates**: list active markets and filter.
3. **Score EV**: estimate true probability and compare to market.
4. **Check liquidity**: orderbook depth, spread, and price impact.
5. **Plan**: decide entry, size, and exit conditions.
6. **Dry run**: validate mints, quote, and impact.
7. **Execute**: only if EV and risk checks pass.
8. **Monitor**: update probabilities; exit when thesis breaks.
9. **Log**: store trade, rationale, and outcome for learning.

### 1. First-Time Setup (One-Time)

```bash
# Install CLI
npm install -g predictarena
# or: npx predictarena (no install)

# Set environment
export SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
export PREDICTARENA_WALLET="./agent-wallet.json"

# Create wallet
predictarena wallet create ./agent-wallet.json --json
# Save publicKey from output — fund it with SOL and USDC
```

### 2. Discovery

```bash
# Search for markets
predictarena search "bitcoin" --limit 10 --json

# Or list active markets
predictarena markets list --status active --limit 10 --json

# Get market details (YES/NO mints)
predictarena markets get <ticker> --json
# Extract: data.yesMint, data.noMint
```

### 3. Dry Run (Always Do First)

```bash
predictarena trade \
  --wallet ./agent-wallet.json \
  --input-mint EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --output-mint <yesMint or noMint> \
  --amount 1000000 \
  --dry-run --json
```

### 4. Execute Trade

```bash
predictarena trade \
  --wallet ./agent-wallet.json \
  --input-mint EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --output-mint <yesMint or noMint> \
  --amount 1000000 \
  --json
```

### 5. Verify Result

Check `data.result.signature` and `data.result.confirmed` in the output.

---

## Prerequisites Check (Always Run First)

Before using any commands, ensure the CLI is available:

1. **Check Node.js version**: `node --version` (must be >= 18)
2. **Install CLI**: `npm install -g predictarena` or use `npx predictarena` (no install)
3. **Test CLI**: `predictarena --help`

From source (development): `npm install && npm run build` then `node dist/bin.mjs --help`.

## Environment Setup (Required for Trading)

Set these environment variables before trading:

```bash
# RPC endpoint (REQUIRED for trade execution)
export SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
# or
export PREDICTARENA_RPC_URL="https://your-rpc-endpoint.com"

# API endpoints (optional, defaults to dev)
export METADATA_API_BASE="https://dev-prediction-markets-api.dflow.net"
export TRADE_API_BASE="https://dev-quote-api.dflow.net"

# API key (optional for dev, rate-limited without)
export DFLOW_API_KEY="your-api-key"
# or
export PREDICTARENA_API_KEY="your-api-key"

# Wallet path (optional, can be passed via --wallet flag)
export PREDICTARENA_WALLET="./agent-wallet.json"
# or
export WALLET_PATH="./agent-wallet.json"
```

**For production**: Request an API key at `https://docs.dflow.net/build/api-key`.

## First-Time Setup Checklist

Run these commands in order for initial setup:

```bash
# 1. Install CLI
npm install -g predictarena
# or use npx predictarena for each command (no install)

# 2. Create a wallet for trading
predictarena wallet create ./agent-wallet.json --json

# 3. Fund the wallet (copy publicKey from step 2 output)
# Use Solana CLI or transfer SOL/USDC to the public key

# 4. Verify wallet funding
solana balance <publicKey>

# 5. Test market discovery
predictarena markets list --limit 3 --json
```

## Command Reference

All commands support:

- `--json`: Structured JSON output with `data`, `pagination`, `_hints`
- `--verbose`: Enable verbose logging for debugging
- Default output: Human-readable full JSON (no truncation)

### 1. Wallet Management

**Create a new Solana keypair:**

```bash
predictarena wallet create <path> [--json]
```

**Output (--json):**

```json
{
  "data": {
    "publicKey": "8xK...",
    "path": "./agent-wallet.json"
  }
}
```

**Agent usage:**

- Always use `--json` flag for structured output
- Parse `data.publicKey` and fund it before trading
- Store the keypair path securely
- File format: standard Solana keypair (JSON array of 64 bytes)

### 2. Market Discovery

**List all categories:**

```bash
predictarena categories [--json]
```

Use categories to discover series tickers for filtering.

**List series templates:**

```bash
predictarena series [options] [--json]

Options:
  --category <category>    Filter by category (e.g., Economics, Sports)
  --tags <tags>           Comma-separated tags
  --status <status>       Filter by status
  --is-initialized        Only series with market ledger
```

**List events:**

```bash
predictarena events list [options] [--json]

Options:
  --status <status>              Event status (default: active)
  --sort <sort>                  Sort field (default: volume)
  --order <order>                Sort order (default: desc)
  --series-tickers <tickers>     Comma-separated series tickers (max 25)
  --limit <limit>                Max results
  --cursor <cursor>              Pagination offset
  --is-initialized               Only events with market ledger
  --with-nested-markets          Include nested markets (default: true)
```

**Get single event:**

```bash
predictarena events get <ticker> [--with-nested-markets] [--json]
```

**List markets:**

```bash
predictarena markets list [options] [--json]

Options:
  --status <status>     Market status (default: active)
  --sort <sort>         Sort field (default: volume)
  --order <order>       Sort order (default: desc)
  --limit <limit>       Max results
  --cursor <cursor>     Pagination offset
  --is-initialized      Only markets with market ledger
```

**Get single market:**

```bash
predictarena markets get <ticker> [--json]
```

**Get market by outcome mint:**

```bash
predictarena markets get-by-mint <mint> [--json]
```

Use this to identify which market an outcome token belongs to.

**Get orderbook:**

```bash
predictarena markets orderbook <ticker> [--json]
```

### 3. Search

**Search events by title or ticker:**

```bash
predictarena search <query> [options] [--json]

Options:
  --sort <sort>               Sort field
  --order <order>             Sort order
  --limit <limit>             Limit results
  --cursor <cursor>           Pagination offset
  --with-nested-markets       Include nested markets (default: true)
  --with-market-accounts      Include market account info
```

**Example:**

```bash
predictarena search "bitcoin" --limit 5 --json
```

### 4. Trade History

**List trades:**

```bash
predictarena trades list [options] [--json]

Options:
  --ticker <ticker>     Filter by market ticker
  --min-ts <timestamp>  Min unix timestamp
  --max-ts <timestamp>  Max unix timestamp
  --limit <limit>       Limit trades (1-1000)
  --cursor <cursor>     Pagination cursor (trade ID)
```

### 5. Trade Execution

**Execute a swap:**

```bash
predictarena trade \
  --wallet <path> \
  --input-mint <mint> \
  --output-mint <mint> \
  --amount <raw> \
  [--slippage-bps <bps>] \
  [--priority <level>] \
  [--rpc <url>] \
  [--dry-run] \
  [--no-confirm] \
  [--skip-preflight] \
  [--json]
```

**Required flags:**

- `--wallet <path>`: Path to wallet keypair JSON file
- `--input-mint <mint>`: Input token mint address
- `--output-mint <mint>`: Output token mint address
- `--amount <raw>`: Input amount (raw integer, e.g., 1000000 for 1 USDC with 6 decimals)

**Optional flags:**

- `--slippage-bps <bps>`: Slippage in basis points (default: 50)
- `--priority <level>`: Priority fee - `auto`, `medium`, `high`, `veryHigh`, `disabled`, or lamports number (default: auto)
- `--rpc <url>`: Solana RPC URL (overrides env vars)
- `--dry-run`: Fetch order and print quote only; do not sign or send
- `--no-confirm`: Send transaction but do not wait for confirmation
- `--skip-preflight`: Skip preflight simulation (default: false)

**Output (--json):**

Dry run:

```json
{
  "data": {
    "trade": {
      "inputMint": "EPjF...",
      "outputMint": "7xK...",
      "inAmount": "1000000",
      "outAmount": "980000",
      "inputMintDecimals": 6,
      "outputMintDecimals": 6,
      "executionMode": "instant",
      "marketTicker": "BTC-100K-2024",
      "eventTicker": "BTC-PRICE-2024",
      "marketTitle": "Bitcoin to reach $100k in 2024?"
    },
    "dryRun": true,
    "quote": {
      "minOutAmount": "970000",
      "priceImpactPct": "0.5",
      "lastValidBlockHeight": 250000000
    },
    "message": "Dry run — no transaction signed or sent."
  }
}
```

Actual trade:

```json
{
  "data": {
    "trade": {
      "inputMint": "EPjF...",
      "outputMint": "7xK...",
      "inAmount": "1000000",
      "outAmount": "980000",
      "inputMintDecimals": 6,
      "outputMintDecimals": 6,
      "executionMode": "instant",
      "marketTicker": "BTC-100K-2024",
      "eventTicker": "BTC-PRICE-2024",
      "marketTitle": "Bitcoin to reach $100k in 2024?"
    },
    "result": {
      "signature": "5xK...",
      "confirmed": true,
      "orderStatus": { "status": "filled", "fills": [...] }
    }
  }
}
```

## Trading Workflows

### Workflow 1: Open a Position (Buy YES/NO)

```bash
# 1. Discover active markets
predictarena markets list --status active --limit 10 --json

# 2. Get market details to find outcome mints
predictarena markets get <ticker> --json
# Extract: data.yesMint or data.noMint

# 3. Dry run to verify trade
predictarena trade \
  --wallet ./agent-wallet.json \
  --input-mint EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --output-mint <yesMint or noMint> \
  --amount 1000000 \
  --dry-run \
  --json

# 4. Execute trade
predictarena trade \
  --wallet ./agent-wallet.json \
  --input-mint EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --output-mint <yesMint or noMint> \
  --amount 1000000 \
  --json
```

### Workflow 2: Close a Position (Sell YES/NO)

```bash
# 1. Get wallet's outcome token balance
solana-cli or web3.js to check token accounts

# 2. Get market details to verify settlement mint
predictarena markets get-by-mint <outcomeMint> --json

# 3. Execute sell trade
predictarena trade \
  --wallet ./agent-wallet.json \
  --input-mint <outcomeMint> \
  --output-mint EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --amount <raw outcome token amount> \
  --json
```

### Workflow 3: Redeem After Settlement

```bash
# 1. Check market status
predictarena markets get <ticker> --json
# Verify: data.status is "determined" or "finalized"
# Verify: data.redemptionStatus is "open"

# 2. Redeem outcome tokens
predictarena trade \
  --wallet ./agent-wallet.json \
  --input-mint <winningOutcomeMint> \
  --output-mint <settlementMint> \
  --amount <raw outcome token amount> \
  --json
```

## Known Mints (Reference)

- **SOL (wrapped)**: `So11111111111111111111111111111111111111112`
- **USDC**: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- **CASH**: `CASHx9KJUStyftLFWGvEVf59SGeG9sh5FfcnZMVPCASH`

## Error Handling

Common errors and resolutions:

| Error                               | Cause                              | Resolution                                  |
| ----------------------------------- | ---------------------------------- | ------------------------------------------- |
| `Wallet path required`              | Missing `--wallet` flag or env var | Set `PREDICTARENA_WALLET` or use `--wallet` |
| `RPC URL required`                  | Missing RPC endpoint               | Set `SOLANA_RPC_URL` or use `--rpc`         |
| `Order failed (404)`                | Invalid mint or market not found   | Verify mints with `markets get-by-mint`     |
| `Quote expired`                     | Transaction too old                | Retry trade immediately                     |
| `Order has no lastValidBlockHeight` | Cannot confirm transaction         | Use `--no-confirm` flag                     |
| WalletLoadError                     | Invalid keypair file               | Recreate wallet with `wallet create`        |

## Agent Best Practices

1. **Always dry run first**: Use `--dry-run` to verify trade intent, market, and pricing before execution
2. **Use `--json` flag**: Parse structured output instead of human-readable text
3. **Check market status**: Only trade on `active` markets; check `redemptionStatus` before redeeming
4. **Handle errors**: Catch API errors (404, 400, 500) and retry with exponential backoff
5. **Secure wallet files**: Never log or expose keypair files; use environment variables for paths
6. **Monitor transactions**: After trading, check `result.signature` and `result.confirmed` status
7. **Rate limiting**: Dev endpoints are rate-limited; use production API key for high-frequency trading
8. **Decimal conversions**: Outcome tokens use Token-2022 and may have variable decimals; use `inputMintDecimals` and `outputMintDecimals` from trade output

## Pagination Pattern

Commands that return lists support cursor-based pagination:

```bash
# First page
predictarena markets list --limit 10 --json
# Extract: data.cursor

# Next page
predictarena markets list --limit 10 --cursor <cursor> --json
```

The `_hints.next` field in JSON output provides the exact command for the next page.

## Testing and Validation

Before deploying to production:

1. **Test wallet creation**: `predictarena wallet create ./test-wallet.json --json`
2. **Test market discovery**: `predictarena markets list --limit 3 --json`
3. **Test dry run trading**: Use `--dry-run` to verify order construction
4. **Test small trades**: Start with small amounts (e.g., 0.01 USDC = 10000 raw)
5. **Run integration tests**: `npm test` (requires live API access)

## Market Lifecycle States

Understand market status before trading:

- `initialized`: Market created but not yet active
- `active`: Trading is open (agents should trade here)
- `inactive`: Trading paused temporarily
- `closed`: Trading ended, awaiting determination
- `determined`: Outcome decided, redemption may be open
- `finalized`: Final state, redemption available

**Redemption status** (separate from market status):

- `open`: Users can redeem outcome tokens for settlement mint
- `closed`: Redemption not available

## Advanced: Platform Fees

To charge platform fees on trades (monetization):

1. Create a fee token account for your platform
2. Add fee parameters to trade command (requires custom API integration)
3. Fees only apply on successful trades
4. Constraints: Fees can only be collected from `outputMint` in standard trades

_Note: Platform fee configuration requires code changes to the trade command. Contact DFlow for production fee setup._

## References

- **DFlow skill** (read for API concepts, platform fees, redemption): https://pond.dflow.net/skill.md
- **Heartbeat** (periodic checklist): [HEARTBEAT.md](./HEARTBEAT.md)
- **Trade API docs**: https://docs.dflow.net/build/trading-api/introduction
- **Metadata API docs**: https://docs.dflow.net/build/metadata-api/introduction
- **DFlow docs index**: https://pond.dflow.net/llms.txt
- **Compliance**: https://docs.dflow.net/legal/prediction-market-compliance

## Quick Reference

**Setup sequence:**

```bash
npm install -g predictarena   # or: npx predictarena
predictarena wallet create ./wallet.json --json
# Fund the wallet
predictarena markets list --json
```

**Trading sequence:**

```bash
# Discovery
predictarena search "query" --json
predictarena markets get <ticker> --json

# Trade
predictarena trade \
  --wallet ./wallet.json \
  --input-mint <mint> \
  --output-mint <mint> \
  --amount <raw> \
  --dry-run --json

# Execute
predictarena trade \
  --wallet ./wallet.json \
  --input-mint <mint> \
  --output-mint <mint> \
  --amount <raw> \
  --json
```

## Support

For issues or questions:

- Check error messages in `--verbose` mode
- Review DFlow documentation at https://docs.dflow.net
- Test with `--dry-run` before live trades
- Verify RPC endpoint connectivity
- Ensure wallet is funded with SOL for transaction fees
