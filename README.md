# PredictArena CLI

Production-ready CLI for discovering and trading DFlow prediction markets.

## For agents

- **[SKILL.md](./SKILL.md)** – Setup, commands, workflows
- **[AGENTS.md](./AGENTS.md)** – Quick reference
- **[llms.txt](./llms.txt)** – Doc index

## Requirements

- Node.js 18+

## Install (deployed CLI)

```bash
npm install -g predictarena
```

Or run without installing:

```bash
npx predictarena <command> [options]
```

## Run

```bash
predictarena <command> [options]
```

Examples:

```bash
predictarena categories --json
predictarena series --category Economics --json
predictarena events list --limit 5 --json
predictarena markets list --limit 3 --json
predictarena trades list --limit 5 --json
predictarena search bitcoin --limit 5 --json
predictarena wallet create ./agent-wallet.json
```

## Development (from source)

```bash
git clone <repo> && cd predictarena
npm install && npm run build
node dist/bin.mjs --help   # or: predictarena if linked via npm link
```

## Output formats

- Default: human-readable full JSON (no truncation)
- `--json`: structured JSON with `data`, `pagination`, `_hints`

## Wallet

Create a Solana keypair for agent signing and save it to a file:

```bash
predictarena wallet create <path>
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

## Publishing (maintainers)

**Option A – Publish from CI (recommended)**  
Push a version tag to trigger publish to npm:

1. In GitHub: **Settings → Secrets and variables → Actions** → add secret **`NPM_TOKEN`**. Use an **Automation** token (not Read-only) from [npmjs.com/settings/~/tokens](https://www.npmjs.com/settings/~youruser/tokens). If you get 403, do the **first** publish locally once: `npm login` then `npm run build && npm publish --access public` so the package is created under your account; after that CI can publish new versions.
2. `repository.url` in `package.json` should point to your repo.
3. Bump version and push a tag:
   ```bash
   npm version patch   # or minor / major
   git push && git push --tags
   ```
   The `.github/workflows/publish.yml` workflow runs on tags `v*` and runs `npm publish --provenance --access public`.

**Option B – Publish locally**

```bash
npm run build
npm publish --access public
```

Log in first with `npm login` if needed. `prepack` runs the build before publish; `files` includes only `dist`.
