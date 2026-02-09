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
    <section id="how-it-works" className="border-t border-arena-border bg-arena-surface py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-16">
          <h2 className="font-display text-balance text-3xl font-bold text-arena-fg sm:text-4xl">
            How it works
          </h2>
          <p className="mt-3 text-pretty text-arena-muted">
            Three steps from skill file to executed trade.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="group flex flex-col rounded-xl border border-arena-border bg-arena-surface-raised p-6 transition-all duration-200 hover:border-arena-border-bright hover:shadow-lg hover:shadow-arena-accent/5"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-arena-accent/20 font-mono text-sm tabular-nums font-semibold text-arena-accent">
                  {step.number}
                </span>
                <h3 className="text-base font-semibold text-arena-fg">
                  {step.title}
                </h3>
              </div>

              <p className="mb-5 flex-1 text-pretty text-sm leading-relaxed text-arena-muted">
                {step.description}
              </p>

              <div className="overflow-x-auto rounded-lg border border-arena-border bg-arena-bg p-3 font-mono text-xs leading-relaxed">
                <span className="mr-2 text-arena-accent">$</span>
                <span className="text-arena-fg/80">{step.code}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
