import { NextRequest, NextResponse } from "next/server";
import { fetchAllGames } from "@/lib/sports-api";

export const dynamic = "force-dynamic";

type CachedEntry = { data: any; timestamp: number };

const responseCache = new Map<string, CachedEntry>();
const inFlightRequests = new Map<string, Promise<any>>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCacheKey(leagues: string[] | undefined, quick: boolean) {
  const base =
    !leagues || leagues.length === 0
      ? "all"
      : `leagues:${[...leagues].sort().join(",")}`;
  return quick ? `${base}:quick` : base;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leagues = searchParams.get("leagues")?.split(",").filter(Boolean);
    const quick =
      searchParams.get("quick") === "1" ||
      searchParams.get("quick") === "true";

    const cacheKey = getCacheKey(leagues, quick);
    const now = Date.now();

    const cached = responseCache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: {
          games: cached.data,
          lastUpdated: new Date(cached.timestamp).toISOString(),
          cached: true,
          quick,
        },
      });
    }

    let requestPromise = inFlightRequests.get(cacheKey);
    if (!requestPromise) {
      requestPromise = fetchAllGames(leagues || undefined, { quick });
      inFlightRequests.set(cacheKey, requestPromise);
    }

    const games = await requestPromise;
    inFlightRequests.delete(cacheKey);

    responseCache.set(cacheKey, { data: games, timestamp: now });

    return NextResponse.json({
      success: true,
      data: {
        games,
        lastUpdated: new Date().toISOString(),
        cached: false,
        quick,
      },
    });
  } catch (error) {
    const { searchParams } = new URL(request.url);
    const leagues = searchParams.get("leagues")?.split(",").filter(Boolean);
    const quick =
      searchParams.get("quick") === "1" ||
      searchParams.get("quick") === "true";
    inFlightRequests.delete(getCacheKey(leagues, quick));

    console.error("Error in /api/games:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch games" },
      { status: 500 }
    );
  }
}
