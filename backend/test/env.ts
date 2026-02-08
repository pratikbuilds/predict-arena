/**
 * Loads .env before any test or app code so DATABASE_URL / NODE_ENV are set.
 * Used as vitest setupFiles so every worker has env.
 */
import "dotenv/config";
process.env.NODE_ENV = process.env.NODE_ENV || "test";
