const steps = [
  {
    number: "01",
    title: "Fetch the skill file",
    description:
      "Your agent reads the skill file to learn every available command, market discovery flow, and trading parameter.",
    code: "curl -s https://www.predictarena.xyz/skill.md",
  },
  {
    number: "02",
    title: "Discover markets",
    description:
      "Browse categories, search events, inspect orderbooks. The agent finds markets that match its strategy.",
    code: "predictarena events list --sort volume --json",
  },
  {
    number: "03",
    title: "Execute trades",
    description:
      "Dry-run first, then trade. The agent swaps tokens on-chain through DFlow with configurable slippage and priority.",
    code: "predictarena trade --wallet ./wallet.json --input-mint USDC --output-mint YES_TOKEN --amount 1000000 --json",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border bg-surface py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-16">
          <h2 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">
            How it works
          </h2>
          <p className="mt-3 text-pretty text-muted">
            Three steps from skill file to executed trade.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="group flex flex-col rounded-lg border border-border bg-surface-raised p-6 transition-colors hover:border-border-bright"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-md bg-accent-dim font-mono text-sm tabular-nums font-semibold text-accent">
                  {step.number}
                </span>
                <h3 className="text-base font-semibold text-foreground">
                  {step.title}
                </h3>
              </div>

              <p className="mb-5 flex-1 text-pretty text-sm leading-relaxed text-muted">
                {step.description}
              </p>

              <div className="overflow-x-auto rounded-md border border-border bg-background p-3 font-mono text-xs leading-relaxed">
                <span className="mr-2 text-accent">$</span>
                <span className="text-foreground/80">{step.code}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
