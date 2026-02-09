import type { Context } from "hono";
import type { z, ZodSchema, ZodType } from "zod";
import { env } from "../config.js";

/**
 * Parse request JSON and validate with Zod. Returns parsed data or a 400 Response.
 * Use in routes: const body = await parseBody(c, schema); if (body instanceof Response) return body;
 */
export async function parseBody<T>(
  c: Context,
  schema: ZodSchema<T>,
): Promise<T | Response> {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const result = schema.safeParse(raw);
  if (result.success) {
    return result.data;
  }

  const first = result.error.errors[0];
  const message = first
    ? `${first.path.join(".") || "body"}: ${first.message}`
    : "Validation failed";
  const body: { error: string; details?: unknown } = { error: message };

  if (env.NODE_ENV !== "production") {
    body.details = result.error.flatten();
  }

  return c.json(body, 400);
}

/**
 * Parse query params and validate with Zod. Returns parsed data or a 400 Response.
 * Query values are always strings; schemas should use coerce/transform as needed.
 */
export function parseQuery<T>(
  c: Context,
  schema: ZodType<T, z.ZodTypeDef, unknown>,
  source?: Record<string, string | undefined>,
): T | Response {
  const raw = source ?? c.req.query();
  const result = schema.safeParse(raw);
  if (result.success) {
    return result.data;
  }

  const first = result.error.errors[0];
  const message = first
    ? `${first.path.join(".") || "query"}: ${first.message}`
    : "Validation failed";
  const body: { error: string; details?: unknown } = { error: message };

  if (env.NODE_ENV !== "production") {
    body.details = result.error.flatten();
  }

  return c.json(body, 400);
}

export type { z };
