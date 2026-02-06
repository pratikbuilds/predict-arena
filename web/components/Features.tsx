const features = [
  {
    title: "Market Discovery",
    description:
      "Browse categories, series, events, and markets. Filter by status, sort by volume, liquidity, or open interest.",
    icon: "search",
  },
  {
    title: "On-chain Trading",
    description:
      "Execute swaps through DFlow on Solana. Configurable slippage, priority fees, and execution modes.",
    icon: "trade",
  },
  {
    title: "Dry Run Mode",
    description:
      "Preview any trade before executing. See the quote, price impact, and route plan without risking funds.",
    icon: "shield",
  },
  {
    title: "Agent-Friendly Output",
    description:
      "Structured JSON output with pagination hints, related commands, and discovery flows. Built for parsing.",
    icon: "json",
  },
  {
    title: "Wallet Management",
    description:
      "Create and manage Solana keypairs. Standard format compatible with the broader Solana ecosystem.",
    icon: "wallet",
  },
  {
    title: "Search & Filter",
    description:
      "Full-text search across events and markets. Filter by ticker, category, tags, status, and time range.",
    icon: "filter",
  },
];

function FeatureIcon({ icon }: { icon: string }) {
  const paths: Record<string, React.ReactNode> = {
    search: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    ),
    trade: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-3L16.5 18m0 0L12 13.5m4.5 4.5V4.5"
      />
    ),
    shield: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    ),
    json: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
      />
    ),
    wallet: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 110-6h.008A2.25 2.25 0 0017.25 6H3.75A2.25 2.25 0 001.5 8.25v7.5A2.25 2.25 0 003.75 18h14.5A2.25 2.25 0 0020.5 15.75V12z"
      />
    ),
    filter: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
      />
    ),
  };

  return (
    <svg
      className="size-5 text-accent"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      {paths[icon]}
    </svg>
  );
}

export function Features() {
  return (
    <section className="border-t border-border py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-16">
          <h2 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">
            Everything an agent needs
          </h2>
          <p className="mt-3 text-pretty text-muted">
            A complete toolkit for autonomous prediction market trading.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-lg border border-border bg-surface-raised p-6 transition-colors hover:border-border-bright"
            >
              <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-accent-dim">
                <FeatureIcon icon={feature.icon} />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-pretty text-sm leading-relaxed text-muted">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
