import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { ESPN_SPORT_SLUGS } from "@/types";

export const dynamic = "force-dynamic";

const espnApi = axios.create({
  baseURL: "https://site.api.espn.com/apis/site/v2/sports",
  timeout: 15000,
});

export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  const { searchParams } = request.nextUrl;
  const externalId = params.gameId;
  const leagueId = searchParams.get("leagueId");

  if (!externalId || !leagueId) {
    return NextResponse.json(
      { success: false, error: "Missing required params" },
      { status: 400 }
    );
  }

  const slug = ESPN_SPORT_SLUGS[leagueId];
  if (!slug) {
    return NextResponse.json(
      { success: false, error: "Unknown league" },
      { status: 400 }
    );
  }

  try {
    const response = await espnApi.get(`/${slug}/summary`, {
      params: { event: externalId },
    });

    const data = response.data;
    const boxscore = data?.boxscore;
    const teams: any[] = boxscore?.teams || [];

    const homeTeam = teams.find((t) => t.homeAway === "home");
    const awayTeam = teams.find((t) => t.homeAway === "away");

    if (!homeTeam || !awayTeam) {
      return NextResponse.json({ success: true, data: null });
    }

    const homeMap: Record<string, string> = {};
    const awayMap: Record<string, string> = {};

    (homeTeam.statistics || []).forEach((s: any) => {
      if (s.name && s.displayValue !== undefined) {
        homeMap[s.name] = String(s.displayValue);
      }
    });

    (awayTeam.statistics || []).forEach((s: any) => {
      if (s.name && s.displayValue !== undefined) {
        awayMap[s.name] = String(s.displayValue);
      }
    });

    // Nothing returned from ESPN
    if (Object.keys(homeMap).length === 0 && Object.keys(awayMap).length === 0) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({
      success: true,
      data: { home: homeMap, away: awayMap },
    });
  } catch (error: any) {
    console.error("[Stats API] Error:", error?.message || error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
