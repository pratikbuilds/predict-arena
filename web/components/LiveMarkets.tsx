import Image from "next/image";
import { fetchActiveEvents, formatDollar, type MarketEvent } from "@/lib/api";

function MarketCard({ event }: { event: MarketEvent }) {
  return (
    <div className="group relative flex overflow-hidden rounded-lg border border-border bg-surface-raised transition-all duration-200 hover:border-border-bright hover:shadow-lg hover:shadow-accent/5">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-l-lg bg-surface-bright sm:size-16">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            className="object-contain transition-transform duration-300 group-hover:scale-105"
            sizes="64px"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-surface-bright to-surface" />
        )}
      </div>
      <div className="min-w-0 flex-1 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-accent transition-colors sm:text-base">
              {event.title}
            </h3>
            {event.subtitle && (
              <p className="mt-0.5 text-xs text-muted line-clamp-1">{event.subtitle}</p>
            )}
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-surface/90 px-1.5 py-0.5 text-[9px] font-medium text-foreground border border-white/10">
            <span className="size-1 rounded-full bg-accent animate-pulse" />
            Live
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-3 text-xs">
          <span className="font-mono text-foreground">{formatDollar(event.volume, false)} vol</span>
          <span className="text-muted">·</span>
          <span className="font-mono text-accent-bright">{formatDollar(event.volume24h, false)} 24h</span>
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
    <section id="markets" className="border-t border-border bg-surface py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-balance text-2xl font-bold text-foreground sm:text-3xl">
              Live markets
            </h2>
            <p className="mt-1.5 text-sm text-muted">
              Active prediction markets sorted by volume.
            </p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-accent"></span>
            </span>
            <span className="font-mono text-xs text-accent">
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
