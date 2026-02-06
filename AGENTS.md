# Agent-facing commands

Full docs: [SKILL.md](./SKILL.md). Periodic checklist: [HEARTBEAT.md](./HEARTBEAT.md). DFlow API concepts: https://pond.dflow.net/skill.md

**CLI usage:** Use the deployed CLI as `predictarena` (after `npm install -g predictarena`) or `npx predictarena`. From source: `node dist/bin.mjs`.

## First-time setup

```bash
# 1. Install CLI (one of)
npm install -g predictarena
# or: npx predictarena (no install)

# 2. Set environment
export SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
export PREDICTARENA_WALLET="./agent-wallet.json"  # optional

# 3. Create wallet
predictarena wallet create ./agent-wallet.json --json

# 4. Fund the wallet (copy publicKey from output)
```

## Wallet creation

Create a Solana keypair for signing/trading:

```bash
predictarena wallet create <path> [--json]
```

- Use `--json` for structured output: `{ data: { publicKey, path } }`.
- Fund the printed `publicKey` before using the wallet.
- Compatible with standard Solana keypair format.

## Market discovery

```bash
# Search markets
predictarena search "bitcoin" --json

# List active markets
predictarena markets list --status active --limit 10 --json

# Get market details (includes YES/NO mints)
predictarena markets get <ticker> --json

# Get market by outcome mint
predictarena markets get-by-mint <mint> --json
```

See [SKILL.md](./SKILL.md) for complete discovery commands (categories, series, events, orderbook).

## Trade execution

Execute a swap from input mint to output mint:

```bash
predictarena trade \
  --wallet <path> \
  --input-mint <mint> \
  --output-mint <mint> \
  --amount <raw> \
  [--dry-run] \
  [--json]
```

**Required flags:**
- `--wallet <path>`: Path to wallet keypair JSON file
- `--input-mint <mint>`: Input token mint address
- `--output-mint <mint>`: Output token mint address  
- `--amount <raw>`: Raw integer amount (e.g., 1000000 for 1 USDC with 6 decimals)

**Optional flags:**
- `--dry-run`: Fetch order and print quote only; do not sign or send
- `--slippage-bps <bps>`: Slippage tolerance (default: 50)
- `--priority <level>`: Priority fee - auto, medium, high, veryHigh, disabled, or lamports number
- `--rpc <url>`: Override RPC endpoint
- `--no-confirm`: Send without waiting for confirmation
- `--json`: Structured JSON output

**Environment variables:**
- `SOLANA_RPC_URL` or `PREDICTARENA_RPC_URL`: RPC endpoint (required for trading)
- `PREDICTARENA_WALLET` or `WALLET_PATH`: Default wallet path (optional)
- `DFLOW_API_KEY` or `PREDICTARENA_API_KEY`: API key (optional for dev, rate-limited)

**Output structure (--json):**

Dry run:
```json
{
  "data": {
    "trade": {
      "inputMint": "...",
      "outputMint": "...",
      "inAmount": "1000000",
      "outAmount": "980000",
      "executionMode": "instant",
      "marketTicker": "...",
      "eventTicker": "...",
      "marketTitle": "..."
    },
    "quote": {
      "minOutAmount": "970000",
      "priceImpactPct": "0.5"
    }
  }
}
```

Executed trade:
```json
{
  "data": {
    "trade": { ... },
    "result": {
      "signature": "5xK...",
      "confirmed": true
    }
  }
}
```

## Known mints

- **USDC**: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- **SOL (wrapped)**: `So11111111111111111111111111111111111111112`
- **CASH**: `CASHx9KJUStyftLFWGvEVf59SGeG9sh5FfcnZMVPCASH`

## Common workflows

**Open position (buy YES/NO):**
```bash
# 1. Get market outcome mints
predictarena markets get <ticker> --json

# 2. Trade USDC -> YES/NO token
predictarena trade \
  --wallet ./wallet.json \
  --input-mint EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --output-mint <yesMint or noMint> \
  --amount 1000000 \
  --json
```

**Close position (sell YES/NO):**
```bash
predictarena trade \
  --wallet ./wallet.json \
  --input-mint <outcomeMint> \
  --output-mint EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --amount <raw outcome amount> \
  --json
```

## Heartbeat

Fetch [HEARTBEAT.md](./HEARTBEAT.md) every 15–30 min when actively trading. It covers wallet balance, market discovery, and pre-trade checks.

## Agent best practices

1. **Always dry run first**: Use `--dry-run` to verify trade before execution
2. **Use `--json` flag**: Parse structured output for automation
3. **Check market status**: Only trade `active` markets
4. **Handle errors**: Catch API errors and retry with exponential backoff
5. **Secure wallets**: Never log keypair files; use environment variables

Full details: [SKILL.md](./SKILL.md).
