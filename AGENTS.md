# Agent-facing commands

Commands and usage for autonomous agents (e.g. Cursor, scripts) working in this repo.

## Wallet creation

To create a wallet for signing/trading:

```bash
node dist/bin.mjs wallet create <path>
```

Or, if the CLI is on PATH: `predictarena wallet create <path>`.

- Use `--json` for structured output: `{ data: { publicKey, path } }`.
- Fund the printed `publicKey` before using the wallet.

## Trade execution

Execute a swap from an input mint to an output mint for a raw input amount, using a wallet keypair path for signing.

```bash
predictarena trade --wallet <path> --input-mint <mint> --output-mint <mint> --amount <raw> [--dry-run] [--json]
```

- **Required**: `--wallet`, `--input-mint`, `--output-mint`, `--amount` (raw integer, e.g. 1000000 for 1 USDC with 6 decimals).
- **Env**: `SOLANA_RPC_URL` or `PREDICTARENA_RPC_URL` for RPC; optional `PREDICTARENA_WALLET` or `WALLET_PATH` for wallet path. Wallet must be funded.
- **Dry run**: `--dry-run` fetches the order and prints the trade summary and quote (min out amount, price impact, last valid block height) without signing or sending. Use this to verify the intended trade and market.
- **Output**: CLI prints a trade summary (input → output amounts and mints), and when not dry-run, the transaction signature and confirmation status. With `--json`, use `data.trade` for the intended trade (inputMint, outputMint, inAmount, outAmount, executionMode, marketTicker, eventTicker, marketTitle when applicable) and `data.result` for signature and confirmation status. This lets agents answer "what trade did the user make?" and "on which market?" from the response.
