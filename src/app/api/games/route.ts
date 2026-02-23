import { NextRequest, NextResponse } from "next/server";
import { fetchAllGames } from "@/lib/sports-api";

export const dynamic = "force-dynamic";

// Cache games for 5 minutes in memory (we now fetch 14 past + 5 future days)
let cachedGames: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leagues = searchParams.get("leagues")?.split(",").filter(Boolean);

    const now = Date.now();

    // Check cache (only for unfiltered requests)
    if (!leagues && cachedGames && now - cachedGames.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: {
          games: cachedGames.data,
          lastUpdated: new Date(cachedGames.timestamp).toISOString(),
          cached: true,
        },
      });
    }

    const games = await fetchAllGames(leagues || undefined);

    // Update cache for unfiltered requests
    if (!leagues) {
      cachedGames = { data: games, timestamp: now };
    }

    return NextResponse.json({
      success: true,
      data: {
        games,
        lastUpdated: new Date().toISOString(),
        cached: false,
      },
    });
  } catch (error) {
    console.error("Error in /api/games:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch games" },
      { status: 500 }
    );
  }
}
