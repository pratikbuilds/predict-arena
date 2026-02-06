import { NextRequest, NextResponse } from "next/server";

const METADATA_API =
  process.env.METADATA_API_BASE ||
  "https://dev-prediction-markets-api.dflow.net";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = searchParams.get("limit") || "6";
  const sort = searchParams.get("sort") || "volume";

  const url = `${METADATA_API}/api/v1/events?status=active&sort=${sort}&order=desc&limit=${limit}&withNestedMarkets=true`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch markets" },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch markets" },
      { status: 500 }
    );
  }
}
