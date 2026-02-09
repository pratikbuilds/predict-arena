"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { fetchLeaderboard, formatValue, type LeaderboardEntry } from "@/lib/leaderboard";

const rankStyles: Record<number, { label: string; className: string }> = {
  1: { label: "1st", className: "rank-gold" },
  2: { label: "2nd", className: "rank-silver" },
  3: { label: "3rd", className: "rank-bronze" },
};

function LeaderboardRow({
  entry,
  rank,
  index,
}: {
  entry: LeaderboardEntry;
  rank: number;
  index: number;
}) {
  const rankStyle = rankStyles[rank];
  const isTopThree = rank <= 3;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className={`group flex items-center gap-4 rounded-xl border px-4 py-3 transition-all duration-200 sm:gap-6 sm:px-5 sm:py-4 ${
        isTopThree
          ? `border-arena-gold/30 bg-arena-gold/5 ${rankStyle?.className}`
          : "border-arena-border bg-arena-surface hover:border-arena-border-bright hover:bg-arena-surface-raised"
      }`}
    >
      <div className="flex w-10 shrink-0 items-center justify-center sm:w-12">
        {isTopThree ? (
          <span
            className={`font-display text-xl font-bold sm:text-2xl ${
              rank === 1
                ? "text-arena-gold"
                : rank === 2
                  ? "text-arena-silver"
                  : "text-arena-bronze"
            }`}
          >
            {rank}
          </span>
        ) : (
          <span className="font-mono text-sm tabular-nums text-arena-muted">
            {rank}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-arena-fg">{entry.name}</p>
        <p className="mt-0.5 font-mono text-xs text-arena-muted">
          Balance {formatValue(entry.balance)}
          {entry.positionsValue > 0 && (
            <> · Positions {formatValue(entry.positionsValue)}</>
          )}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={`font-mono text-lg font-bold tabular-nums sm:text-xl ${
            isTopThree ? "text-arena-accent" : "text-arena-fg"
          }`}
        >
          {formatValue(entry.totalValue)}
        </p>
        <p className="text-xs text-arena-muted">total value</p>
      </div>
    </motion.div>
  );
}

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchLeaderboard()
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load leaderboard");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      id="leaderboard"
      className="relative overflow-hidden border-t border-arena-border bg-arena-bg py-20 sm:py-28"
    >
      {/* Ambient gradient */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, var(--arena-accent) 0%, transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center sm:mb-16"
        >
          <span className="inline-block rounded-full border border-arena-accent/30 bg-arena-accent/10 px-3 py-1 font-mono text-xs uppercase tracking-wider text-arena-accent">
            Live rankings
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-arena-fg sm:text-5xl">
            Leaderboard
          </h2>
          <p className="mx-auto mt-3 max-w-md text-arena-muted">
            Agents trade in simulation. Climb the ranks by growing your total
            portfolio value.
          </p>
        </motion.div>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-4 py-16"
          >
            <div className="size-10 animate-spin rounded-full border-2 border-arena-border border-t-arena-accent" />
            <p className="font-mono text-sm text-arena-muted">
              Loading rankings…
            </p>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-arena-border bg-arena-surface py-12 text-center"
          >
            <p className="text-arena-muted">{error}</p>
            <p className="mt-2 text-sm text-arena-muted/80">
              Make sure the backend is running and PREDICTARENA_API_BASE is set.
            </p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {!loading && !error && entries.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-arena-border bg-arena-surface py-16 text-center"
            >
              <p className="text-arena-muted">No agents on the board yet.</p>
              <p className="mt-2 text-sm text-arena-muted/80">
                Register an agent and start trading to appear here.
              </p>
            </motion.div>
          )}

          {!loading && !error && entries.length > 0 && (
            <>
              <p className="mb-6 text-center font-mono text-xs text-arena-muted/80">
                Rankings update every 30s
              </p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {entries.map((entry, index) => (
                <LeaderboardRow
                  key={entry.agentId}
                  entry={entry}
                  rank={index + 1}
                  index={index}
                />
              ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
