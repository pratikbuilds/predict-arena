export interface DescribeSchema {
  command: string;
  defaults?: Record<string, unknown>;
  filters: Record<
    string,
    { type: string; values?: string[]; default?: unknown; description?: string }
  >;
  discovery_flow?: string[];
}

export interface OutputHints {
  available_filters?: string[];
  next?: string;
  related?: string[];
  notes?: string[];
}

export function eventsDescribeSchema(): DescribeSchema {
  return {
    command: "predictarena events list",
    defaults: { status: "active", limit: 20, sort: "volume" },
    filters: {
      status: {
        type: "enum",
        values: [
          "initialized",
          "active",
          "inactive",
          "closed",
          "determined",
          "finalized",
        ],
      },
      sort: {
        type: "enum",
        values: ["volume", "volume24h", "liquidity", "openInterest", "startDate"],
      },
      order: { type: "enum", values: ["asc", "desc"], default: "desc" },
      seriesTickers: {
        type: "string",
        description: "Comma-separated series tickers (max 25).",
      },
      isInitialized: {
        type: "boolean",
        description: "Filter to events with market ledger.",
      },
      withNestedMarkets: { type: "boolean", default: true },
      limit: { type: "number", default: 20 },
      cursor: { type: "number", description: "Pagination offset." },
    },
    discovery_flow: [
      "predictarena categories        -- browse categories and tags",
      "predictarena series --category Sports  -- get series tickers",
      "predictarena events list --series <ticker> -- filter events",
    ],
  };
}

export function marketsDescribeSchema(): DescribeSchema {
  return {
    command: "predictarena markets list",
    defaults: { status: "active", limit: 20, sort: "volume" },
    filters: {
      status: {
        type: "enum",
        values: [
          "initialized",
          "active",
          "inactive",
          "closed",
          "determined",
          "finalized",
        ],
      },
      sort: {
        type: "enum",
        values: ["volume", "volume24h", "liquidity", "openInterest", "startDate"],
      },
      order: { type: "enum", values: ["asc", "desc"], default: "desc" },
      isInitialized: {
        type: "boolean",
        description: "Filter to markets with market ledger.",
      },
      limit: { type: "number", default: 20 },
      cursor: { type: "number", description: "Pagination offset." },
    },
  };
}

export function seriesDescribeSchema(): DescribeSchema {
  return {
    command: "predictarena series",
    filters: {
      category: { type: "string", description: "Series category filter." },
      tags: { type: "string", description: "Comma-separated tags." },
      status: {
        type: "enum",
        values: [
          "initialized",
          "active",
          "inactive",
          "closed",
          "determined",
          "finalized",
        ],
      },
      isInitialized: {
        type: "boolean",
        description: "Filter to series with market ledger.",
      },
    },
  };
}

export function tradesDescribeSchema(): DescribeSchema {
  return {
    command: "predictarena trades list",
    filters: {
      ticker: { type: "string", description: "Market ticker filter." },
      minTs: { type: "number", description: "Min unix timestamp." },
      maxTs: { type: "number", description: "Max unix timestamp." },
      limit: { type: "number", description: "Max trades (1-1000)." },
      cursor: { type: "string", description: "Pagination cursor (trade ID)." },
    },
  };
}

export function searchDescribeSchema(): DescribeSchema {
  return {
    command: "predictarena search",
    filters: {
      q: { type: "string", description: "Search query (required)." },
      sort: {
        type: "enum",
        values: ["volume", "volume24h", "liquidity", "openInterest", "startDate"],
      },
      order: { type: "enum", values: ["asc", "desc"], default: "desc" },
      limit: { type: "number", description: "Limit results." },
      cursor: { type: "number", description: "Pagination offset." },
      withNestedMarkets: { type: "boolean" },
      withMarketAccounts: { type: "boolean" },
    },
  };
}

export function buildHints(hints: OutputHints): OutputHints {
  return hints;
}
