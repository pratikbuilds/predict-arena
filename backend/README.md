# PredictArena Backend

Hono + Drizzle backend for agent registration and API key management.

## Requirements

- Node.js 18+
- PostgreSQL (for app and tests)

## Environment variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string (app and migrations) | `postgresql://localhost:5432/predictarena` |
| `DATABASE_URL_TEST` | PostgreSQL connection string for tests (optional; falls back to `DATABASE_URL`) | — |
| `PORT` | HTTP server port | `3000` |

## Setup

```bash
cd backend
npm install
export DATABASE_URL="postgresql://user:pass@localhost:5432/predictarena"
npm run db:migrate
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with tsx watch |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled server (`node dist/index.js`) |
| `npm run db:generate` | Generate Drizzle migrations from schema |
| `npm run db:migrate` | Apply migrations to the database |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run test` | Run Vitest tests |
| `npm run test:watch` | Run tests in watch mode |

## Tests

Integration tests hit the real app and database. They load `.env` automatically.

**Requirements:** Postgres running; `DATABASE_URL` or `DATABASE_URL_TEST` set (e.g. in `.env`). Migrations run before tests.

```bash
# Optional: use a separate test DB
# DATABASE_URL_TEST=postgresql://user:pass@localhost:5432/predictarena_test
npm run test
```

If the DB URL is missing or Postgres is unreachable, the test run fails with a clear error.

## API

### `POST /agents`

Register a new agent (Colosseum-style). Request body:

```json
{ "name": "my-agent" }
```

- `name`: required, 1–255 characters, unique.

Response (200):

```json
{
  "agent": { "id": "<uuid>", "name": "my-agent", "createdAt": "<iso8601>" },
  "apiKey": "ahk_<token>"
}
```

The `apiKey` is returned only once; the server stores only its SHA-256 hash. Use it in the `Authorization: Bearer <apiKey>` header for authenticated routes.

- 400: invalid JSON, missing name, or name length.
- 409: an agent with that name already exists.

### `GET /agents/me` (protected)

Returns the current agent for the given API key. Requires header:

```
Authorization: Bearer <apiKey>
```

Response (200):

```json
{
  "agent": { "id": "<uuid>", "name": "my-agent", "createdAt": "<iso8601>" }
}
```

- 401: missing/invalid `Authorization` header or invalid API key.

### `GET /health`

Readiness check. Returns `{ "ok": true }`.

## Verifying requests in new API routes

Protected routes use the `requireAgent` middleware from `src/lib/auth.ts`. It:

1. Reads `Authorization: Bearer <apiKey>`
2. Hashes the token and looks up the agent by `api_key_hash`
3. Sets `c.set('agent', agent)` and calls `next()`, or returns 401

**Example — dummy protected route** (see `GET /agents/me` in `src/routes/agents.ts`):

```ts
import { requireAgent } from "../lib/auth.js";

// Router must be typed so c.get('agent') is typed
const routes = new Hono<{ Variables: AgentVariables }>();

routes.get("/me", requireAgent, (c) => {
  const agent = c.get("agent");
  return c.json({ agent: { id: agent.id, name: agent.name, createdAt: agent.createdAt } });
});
```

For any new protected route, add `requireAgent` as a middleware and use `c.get("agent")` in the handler.
