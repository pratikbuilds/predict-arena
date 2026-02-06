import Image from "next/image";
import { fetchActiveEvents, formatDollar, type MarketEvent } from "@/lib/api";

function MarketCard({ event }: { event: MarketEvent }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface-raised transition-colors hover:border-border-bright">
      {/* Image */}
      {event.imageUrl && (
        <div className="relative h-32 w-full bg-surface-bright">
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-background/40" />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
{/* no ticker badge */}
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
            {event.title}
          </h3>
          {event.subtitle && (
            <p className="mt-1 text-xs text-muted">{event.subtitle}</p>
          )}
        </div>

        <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 font-mono text-xs tabular-nums">
          <div>
            <span className="text-muted">Vol </span>
            <span className="font-medium text-foreground">
              {formatDollar(event.volume)}
            </span>
          </div>
          <div>
            <span className="text-muted">24h </span>
            <span className="text-foreground/70">
              {formatDollar(event.volume24h)}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-accent/60" />
            <span className="text-muted">{event.status}</span>
          </div>
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
    <section id="markets" className="border-t border-border bg-surface py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">
              Live markets
            </h2>
            <p className="mt-3 text-pretty text-muted">
              Active prediction markets sorted by volume.
            </p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="size-2 rounded-full bg-accent" />
            <span className="font-mono text-xs text-accent">
              Updated every 60s
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <MarketCard key={event.ticker} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
}
