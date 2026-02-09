import { NextResponse } from "next/server";

const API_BASE =
  process.env.PREDICTARENA_API_BASE || "http://localhost:3001";

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/leaderboard`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: (err as { error?: string }).error || "Failed to fetch leaderboard" },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
