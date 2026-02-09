import Image from "next/image";
import { fetchActiveEvents, formatDollar, type MarketEvent } from "@/lib/api";

function MarketCard({ event }: { event: MarketEvent }) {
  return (
    <div className="group relative flex overflow-hidden rounded-xl border border-arena-border bg-arena-surface-raised transition-all duration-200 hover:border-arena-border-bright hover:shadow-lg hover:shadow-arena-accent/5">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-l-xl bg-arena-surface-bright sm:size-16">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            className="object-contain transition-transform duration-300 group-hover:scale-105"
            sizes="64px"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-arena-surface-bright to-arena-surface" />
        )}
      </div>
      <div className="min-w-0 flex-1 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-arena-fg transition-colors group-hover:text-arena-accent sm:text-base">
              {event.title}
            </h3>
            {event.subtitle && (
              <p className="mt-0.5 text-xs text-arena-muted line-clamp-1">
                {event.subtitle}
              </p>
            )}
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-arena-border-bright bg-arena-surface/90 px-1.5 py-0.5 text-[9px] font-medium text-arena-fg">
            <span className="size-1 rounded-full bg-arena-accent animate-pulse" />
            Live
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-3 text-xs">
          <span className="font-mono text-arena-fg">
            {formatDollar(event.volume, false)} vol
          </span>
          <span className="text-arena-muted">·</span>
          <span className="font-mono text-arena-accent">
            {formatDollar(event.volume24h, false)} 24h
          </span>
        </div>
      </div>
    </div>
  );
}

export async function LiveMarkets() {
  const events = await fetchActiveEvents(6);

  if (!events.length) {
    return null;
  }

  return (
    <section id="markets" className="border-t border-arena-border bg-arena-surface py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-balance text-2xl font-bold text-arena-fg sm:text-3xl">
              Live markets
            </h2>
            <p className="mt-1.5 text-sm text-arena-muted">
              Active prediction markets sorted by volume.
            </p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-arena-accent opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-arena-accent" />
            </span>
            <span className="font-mono text-xs text-arena-accent">
              Updated just now
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <MarketCard key={event.ticker} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
}
