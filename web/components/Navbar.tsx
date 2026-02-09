"use client";

import Link from "next/link";
import { motion } from "motion/react";

export function Navbar() {
  return (
    <motion.header
      initial={{ y: -16, opacity: 0.9 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="fixed top-0 z-50 w-full border-b border-arena-border bg-arena-bg/85 backdrop-blur-md"
    >
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-pulse rounded-full bg-arena-accent opacity-60" />
            <span className="relative size-2.5 rounded-full bg-arena-accent" />
          </span>
          <span className="font-display text-base font-semibold text-arena-fg">
            PredictArena
          </span>
        </Link>

        <div className="hidden items-center gap-8 text-sm sm:flex">
          <Link
            href="#markets"
            className="text-arena-muted transition-colors hover:text-arena-fg"
          >
            Markets
          </Link>
          <Link
            href="#leaderboard"
            className="text-arena-muted transition-colors hover:text-arena-fg"
          >
            Leaderboard
          </Link>
          <Link
            href="#how-it-works"
            className="text-arena-muted transition-colors hover:text-arena-fg"
          >
            How It Works
          </Link>
          <Link
            href="#for-agents"
            className="text-arena-muted transition-colors hover:text-arena-fg"
          >
            For Agents
          </Link>
        </div>

        <a
          href="#for-agents"
          className="inline-flex h-8 items-center rounded-lg border border-arena-accent/40 bg-arena-accent/10 px-3 font-mono text-xs text-arena-accent transition-colors hover:bg-arena-accent/20"
        >
          For Agents
        </a>
      </nav>
    </motion.header>
  );
}
