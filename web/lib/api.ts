const METADATA_API =
  process.env.METADATA_API_BASE ||
  "https://dev-prediction-markets-api.dflow.net";

export interface MarketEvent {
  ticker: string;
  title: string;
  subtitle: string;
  status: string;
  imageUrl: string | null;
  volume: number;
  volume24h: number;
  markets?: {
    ticker: string;
    title: string;
    yesSubTitle: string;
    noSubTitle: string;
    status: string;
    volume: number;
    yesBid: number | null;
    yesAsk: number | null;
    noBid: number | null;
    noAsk: number | null;
  }[];
}

export async function fetchActiveEvents(limit = 6): Promise<MarketEvent[]> {
  const url = `${METADATA_API}/api/v1/events?status=active&sort=volume&order=desc&limit=${limit}&withNestedMarkets=true`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.events ?? [];
}

/** Format a dollar amount. Event/market API returns dollars; set inCents true only when value is in cents. */
export function formatDollar(value: number, inCents = false): string {
  const dollars = inCents ? value / 100 : value;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(1)}K`;
  return `$${dollars.toFixed(0)}`;
}
