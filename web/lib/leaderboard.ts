export interface LeaderboardEntry {
  agentId: string;
  name: string;
  balance: number;
  positionsValue: number;
  totalValue: number;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  error?: string;
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const res = await fetch("/api/leaderboard");
  const data = (await res.json()) as LeaderboardResponse;
  if (!res.ok) return [];
  return data.leaderboard ?? [];
}

export function formatValue(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}
