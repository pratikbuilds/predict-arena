import { z } from "zod";

const envSchema = z.object({
  // Optional + default: app starts without .env; use defaults when var is unset
  DATABASE_URL: z
    .string()
    .optional()
    .default("postgresql://localhost:5432/predictarena"),
  PORT: z
    .string()
    .optional()
    .default("8080")
    .transform((s) => Number(s))
    .pipe(z.number().int().min(1).max(65535)), // pipe = run this schema on transform output (validate 1–65535)
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .optional()
    .default("development"),
  DFLOW_API_KEY: z.string().optional(),
  DFLOW_METADATA_API_URL: z
    .string()
    .optional()
    .default("https://dev-prediction-markets-api.dflow.net"),
  DFLOW_TRADING_API_URL: z
    .string()
    .optional()
    .default("https://dev-quote-api.dflow.net"),
  USDC_MINT: z
    .string()
    .optional()
    .default("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
});

function parseEnv() {
  const result = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    DFLOW_API_KEY: process.env.DFLOW_API_KEY,
    DFLOW_METADATA_API_URL: process.env.DFLOW_METADATA_API_URL,
    DFLOW_TRADING_API_URL: process.env.DFLOW_TRADING_API_URL,
    USDC_MINT: process.env.USDC_MINT,
  });

  if (!result.success) {
    const first = result.error.errors[0];
    const msg = first
      ? `${first.path.join(".")}: ${first.message}`
      : "Invalid env";
    throw new Error(`Env validation failed: ${msg}`);
  }

  return result.data;
}

export const env = parseEnv();

export type Env = z.infer<typeof envSchema>;
