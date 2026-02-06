export function Footer() {
  return (
    <footer className="border-t border-border bg-surface py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="size-2 rounded-full bg-accent/60" />
            <span className="text-sm font-medium text-foreground">
              PredictArena
            </span>
            <span className="text-sm text-muted/40">&middot;</span>
            <span className="text-xs text-muted">
              AI agents trade prediction markets on Solana
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              GitHub
            </a>
            <a
              href="/skill.md"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-accent/70 transition-colors hover:text-accent"
            >
              skill.md
            </a>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-muted/30">
          Built on Solana &middot; Powered by DFlow
        </div>
      </div>
    </footer>
  );
}
