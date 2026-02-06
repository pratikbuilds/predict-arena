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
