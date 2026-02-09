import { z } from "zod";

export const statusEnum = z.enum([
  "initialized",
  "active",
  "inactive",
  "closed",
  "determined",
]);

export const sortEnum = z.enum([
  "volume",
  "volume24h",
  "liquidity",
  "openInterest",
  "startDate",
]);

export const orderEnum = z.enum(["asc", "desc"]);

const optionalBool = z
  .enum(["true", "false"])
  .optional()
  .transform((s) => (s === undefined ? undefined : s === "true"));

const optionalInt = z.coerce.number().int().min(0).optional();

export const eventsListQuerySchema = z.object({
  limit: optionalInt,
  cursor: optionalInt,
  seriesTickers: z.string().max(500).optional(),
  status: statusEnum.optional(),
  isInitialized: optionalBool,
  sort: sortEnum.optional(),
  order: orderEnum.optional(),
  withNestedMarkets: optionalBool,
});

export const eventGetQuerySchema = z.object({
  withNestedMarkets: optionalBool,
});

export const marketsListQuerySchema = z.object({
  limit: optionalInt,
  cursor: optionalInt,
  status: statusEnum.optional(),
  isInitialized: optionalBool,
  sort: sortEnum.optional(),
  order: orderEnum.optional(),
});

export const seriesListQuerySchema = z.object({
  category: z.string().max(200).optional(),
  tags: z.string().max(500).optional(),
  isInitialized: optionalBool,
  status: statusEnum.optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1, "q is required"),
  sort: sortEnum.optional(),
  order: orderEnum.optional(),
  limit: optionalInt,
  cursor: optionalInt,
  withNestedMarkets: optionalBool,
  withMarketAccounts: optionalBool,
});

export const eventCandlesticksQuerySchema = z.object({
  startTs: z.coerce.number().int().min(0),
  endTs: z.coerce.number().int().min(0),
  periodInterval: z.coerce.number().int().refine(
    (n) => n === 1 || n === 60 || n === 1440,
    { message: "periodInterval must be 1, 60, or 1440" },
  ),
});

export type EventsListQuery = z.infer<typeof eventsListQuerySchema>;
export type EventGetQuery = z.infer<typeof eventGetQuerySchema>;
export type MarketsListQuery = z.infer<typeof marketsListQuerySchema>;
export type SeriesListQuery = z.infer<typeof seriesListQuerySchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type EventCandlesticksQuery = z.infer<typeof eventCandlesticksQuerySchema>;
