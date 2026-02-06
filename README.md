# PredictArena CLI

Production-ready CLI for discovering DFlow prediction markets.

## Requirements

- Node.js 18+

## Install

```bash
npm install
```

## Build

```bash
npm run build
```

## Run

Use the built CLI:

```bash
node dist/bin.mjs <command> [options]
```

Examples:

```bash
node dist/bin.mjs categories --json
node dist/bin.mjs series --category Economics --json
node dist/bin.mjs events list --limit 5 --json
node dist/bin.mjs markets list --limit 3 --json
node dist/bin.mjs trades list --limit 5 --json
node dist/bin.mjs search bitcoin --limit 5 --json
node dist/bin.mjs wallet create ./agent-wallet.json
```

## Output formats

- Default: human-readable full JSON (no truncation)
- `--json`: structured JSON with `data`, `pagination`, `_hints`

## Wallet

Create a Solana keypair for agent signing and save it to a file:

```bash
node dist/bin.mjs wallet create <path>
```

The CLI writes a standard Solana keypair file (JSON array of 64 bytes) to `<path>` and prints the **public key** so you can fund it. The file is compatible with `Keypair.fromSecretKey(new Uint8Array(JSON.parse(...)))`.

**Agent / automation:** Agents can run `wallet create <path>` autonomously. Use `--json` to get machine-readable output `{ data: { publicKey, path } }`. Fund the returned `publicKey` before using the wallet.

## Config (codebase only)

The CLI does **not** accept API URL or API key flags. The library reads them from env:

- `METADATA_API_BASE` or `DFLOW_METADATA_API_URL` (default: `https://dev-prediction-markets-api.dflow.net`)
- `TRADE_API_BASE` or `DFLOW_TRADE_API_URL` (default: `https://dev-quote-api.dflow.net`)
- `DFLOW_API_KEY` or `PREDICTARENA_API_KEY` (optional for dev, rate-limited without)

## Tests

Integration tests hit the live dev API.

```bash
npm test
```
