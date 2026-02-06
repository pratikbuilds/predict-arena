# PredictArena CLI

Production-ready CLI for discovering and trading DFlow prediction markets.

## For AI Agents & Automation

- **[SKILL.md](./SKILL.md)** - Comprehensive agent skill documentation with complete setup, commands, workflows, and best practices
- **[AGENTS.md](./AGENTS.md)** - Quick reference guide for essential commands
- **[llms.txt](./llms.txt)** - Documentation index for agent discovery

Start with **SKILL.md** for complete integration guidance.

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

1. In GitHub: **Settings → Secrets and variables → Actions** → add secret **`NPM_TOKEN`** (npm Automation token from [npmjs.com/settings/~/tokens](https://www.npmjs.com/settings/~youruser/tokens)).
2. Update `repository.url` in `package.json` to your repo (replace `your-org`).
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
