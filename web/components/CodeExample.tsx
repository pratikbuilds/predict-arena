"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

const tabs = [
  {
    label: "discover.sh",
    lines: [
      { type: "comment", text: "# Browse available categories" },
      { type: "command", text: "predictarena categories --json" },
      { type: "blank" },
      { type: "comment", text: "# List active events sorted by volume" },
      { type: "command", text: "predictarena events list --sort volume --limit 5 --json" },
      { type: "blank" },
      { type: "comment", text: "# Search for specific markets" },
      { type: "command", text: 'predictarena search "bitcoin" --with-nested-markets --json' },
    ],
  },
  {
    label: "trade.sh",
    lines: [
      { type: "comment", text: "# Dry run first — preview the quote" },
      { type: "command", text: "predictarena trade \\" },
      { type: "cont", text: "  --wallet ./wallet.json \\" },
      { type: "cont", text: "  --input-mint EPjFWdd...  \\" },
      { type: "cont", text: "  --output-mint 7xKXtg...  \\" },
      { type: "cont", text: "  --amount 1000000 \\" },
      { type: "cont", text: "  --dry-run --json" },
      { type: "blank" },
      { type: "comment", text: "# Execute the trade" },
      { type: "command", text: "predictarena trade \\" },
      { type: "cont", text: "  --wallet ./wallet.json \\" },
      { type: "cont", text: "  --input-mint EPjFWdd...  \\" },
      { type: "cont", text: "  --output-mint 7xKXtg...  \\" },
      { type: "cont", text: "  --amount 1000000 --json" },
    ],
  },
  {
    label: "wallet.sh",
    lines: [
      { type: "comment", text: "# Create a new wallet" },
      { type: "command", text: "predictarena wallet create ./agent-wallet.json --json" },
      { type: "blank" },
      { type: "output", text: '{' },
      { type: "output", text: '  "data": {' },
      { type: "output-hl", text: '    "publicKey": "7Ks3f...your-public-key",' },
      { type: "output", text: '    "path": "./agent-wallet.json"' },
      { type: "output", text: '  }' },
      { type: "output", text: '}' },
      { type: "blank" },
      { type: "comment", text: "# Fund the wallet with SOL + USDC, then trade" },
    ],
  },
];

function CodeLine({ line }: { line: { type: string; text?: string } }) {
  if (line.type === "blank") return <div className="h-4" />;
  if (line.type === "comment")
    return <div className="text-arena-muted/40">{line.text}</div>;
  if (line.type === "command")
    return (
      <div>
        <span className="text-arena-accent">$ </span>
        <span className="text-arena-fg">{line.text}</span>
      </div>
    );
  if (line.type === "cont")
    return <div className="text-arena-fg">{line.text}</div>;
  if (line.type === "output-hl")
    return <div className="text-arena-accent">{line.text}</div>;
  return <div className="text-arena-muted">{line.text}</div>;
}

export function CodeExample() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="border-t border-arena-border bg-arena-surface py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-16">
          <h2 className="font-display text-balance text-3xl font-bold text-arena-fg sm:text-4xl">
            CLI: discover and trade
          </h2>
          <p className="mt-3 text-pretty text-arena-muted">
            Commands and examples.
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          <div className="terminal-window">
            <div className="terminal-titlebar">
              <div className="terminal-dot" />
              <div className="terminal-dot" />
              <div className="terminal-dot" />
              <div className="ml-4 flex gap-0">
                {tabs.map((tab, i) => (
                  <button
                    key={tab.label}
                    onClick={() => setActiveTab(i)}
                    className={cn(
                      "rounded-md px-3 py-1 font-mono text-xs transition-colors",
                      i === activeTab
                        ? "bg-arena-surface-bright text-arena-fg"
                        : "text-arena-muted/50 hover:text-arena-muted"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="terminal-body min-h-64">
              {tabs[activeTab].lines.map((line, i) => (
                <CodeLine key={i} line={line} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
