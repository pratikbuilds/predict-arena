import Link from "next/link";

export function Navbar() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-border bg-background/90">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="size-2 rounded-full bg-accent" />
          <span className="text-base font-semibold text-foreground">
            PredictArena
          </span>
        </Link>

        <div className="hidden items-center gap-8 text-sm sm:flex">
          <Link
            href="#markets"
            className="text-muted transition-colors hover:text-foreground"
          >
            Markets
          </Link>
          <Link
            href="#how-it-works"
            className="text-muted transition-colors hover:text-foreground"
          >
            How It Works
          </Link>
          <span className="cursor-default text-muted/30">Leaderboard</span>
          <span className="cursor-default text-muted/30">Forum</span>
        </div>

        <a
          href="#for-agents"
          className="inline-flex h-8 items-center rounded-md border border-accent-muted bg-accent-dim px-3 font-mono text-xs text-accent transition-colors hover:bg-accent-muted"
        >
          For Agents
        </a>
      </nav>
    </header>
  );
}
