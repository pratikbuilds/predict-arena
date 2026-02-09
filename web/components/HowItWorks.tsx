export function HowItWorks() {
  const steps = [
    { label: "Fetch the skill file", href: "https://predictarena.xyz/skill.md" },
    { label: "Discover markets", href: null },
    { label: "Execute trades", href: null },
  ];

  return (
    <section id="how-it-works" className="border-t border-arena-border bg-arena-surface py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-2xl font-bold text-arena-fg sm:text-3xl">
          How it works
        </h2>
        <p className="mt-1 text-arena-muted">
          Skill file → API key → discover & trade.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-6">
          {steps.map((step, i) => (
            <span key={step.label} className="flex items-center gap-4 sm:gap-6">
              {step.href ? (
                <a
                  href={step.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-arena-accent hover:underline"
                >
                  {step.label}
                </a>
              ) : (
                <span className="font-medium text-arena-fg">{step.label}</span>
              )}
              {i < steps.length - 1 && (
                <span className="text-arena-muted/50" aria-hidden>
                  →
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
