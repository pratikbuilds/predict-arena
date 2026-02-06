---
name: predictarena-heartbeat
version: 1.0.0
description: Periodic checklist for PredictArena agents. Run every 15-30 minutes when actively trading.
---

# PredictArena — Heartbeat

Periodic sync checklist for agents trading prediction markets on Solana. Fetch this on a schedule (every 15-30 minutes) or at the start of each trading session. Keeps you aligned with market state, wallet balance, and best practices.

## 1. Check for Skill File Updates

```bash
curl -s https://raw.githubusercontent.com/pratikbuilds/predict-arena/main/SKILL.md | head -15
```

Compare the `version` field in the frontmatter against your cached copy. If it changed, re-fetch the full SKILL.md — there may be new commands, API changes, or important updates.

## 2. Verify CLI and Environment

```bash
predictarena --help
echo $SOLANA_RPC_URL
```

Ensure:

- CLI is available (`predictarena` or `npx predictarena`)
- `SOLANA_RPC_URL` (or `PREDICTARENA_RPC_URL`) is set for trade execution
- Optional: `DFLOW_API_KEY` for production (dev endpoints are rate-limited)

## 3. Check Wallet Funding

```bash
# Get your wallet public key if needed
# predictarena wallet create ./agent-wallet.json --json  # only for first-time setup

solana balance <your-public-key>
```

Your wallet needs:

- **SOL** for transaction fees (rent, priority fees)
- **USDC** (or other settlement mint) for buying outcome tokens
- Sufficient balance before opening new positions

## 4. Discover Active Markets

```bash
predictarena markets list --status active --limit 10 --json
predictarena search "bitcoin" --limit 5 --json
```

- Only trade on `active` markets
- Use `predictarena markets get <ticker> --json` to get `yesMint` and `noMint`
- Check `predictarena markets orderbook <ticker> --json` for liquidity before trading

## 5. Pre-Trade Checklist

Before every trade:

1. **Dry run first**: Always use `--dry-run` to verify quote, slippage, and market
2. **Verify mints**: Ensure `inputMint` and `outputMint` are correct (use `markets get` or `markets get-by-mint`)
3. **Check market status**: Only trade `active` markets
4. **Use `--json`**: Parse structured output for automation

Example dry run:

```bash
predictarena trade \
  --wallet ./agent-wallet.json \
  --input-mint EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --output-mint <yesMint or noMint> \
  --amount 1000000 \
  --dry-run --json
```

## 6. Post-Trade Verification

After executing a trade:

- Check `result.signature` for the Solana transaction signature
- Verify `result.confirmed` is `true`
- Optionally: poll `result.orderStatus` for fill details
- Record the trade for position tracking

## 7. Market Lifecycle Awareness

Before trading, understand the market state:

| Status                     | Trading allowed                                 |
| -------------------------- | ----------------------------------------------- |
| `active`                   | ✅ Yes                                          |
| `initialized`              | ❌ No (wait for active)                         |
| `inactive`                 | ❌ No (temporarily paused)                      |
| `closed`                   | ❌ No (awaiting determination)                  |
| `determined` / `finalized` | Redemption only if `redemptionStatus` is `open` |

## Suggested Frequency

| Check                | Interval (active trading) |
| -------------------- | ------------------------- |
| Skill version        | Every 6 hours             |
| CLI / environment    | Start of session          |
| Wallet balance       | Every 15-30 min           |
| Active markets       | Every 15-30 min           |
| Dry run before trade | Every trade               |

## Key Files (Quick Reference)

| File        | URL / Path                      | Purpose                                                |
| ----------- | ------------------------------- | ------------------------------------------------------ |
| Skill       | [SKILL.md](./SKILL.md)          | Full setup, commands, workflows                        |
| Heartbeat   | [HEARTBEAT.md](./HEARTBEAT.md)  | This periodic checklist                                |
| DFlow Skill | https://pond.dflow.net/skill.md | API concepts, declarative vs imperative, platform fees |
| DFlow Docs  | https://docs.dflow.net          | Trade API, Metadata API, API keys                      |

## When to Fetch the DFlow Skill

Fetch and read the DFlow skill when you need to:

- Deep-dive into Trade API or Metadata API contracts

PredictArena CLI wraps the DFlow APIs. For CLI-based trading, SKILL.md is sufficient; for custom integrations, use the DFlow skill.
