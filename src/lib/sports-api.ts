// =============================================
// Sports API Integration
// Fetches live/upcoming game data from:
//   - API-Football (RapidAPI) for soccer
//   - ESPN public API for NCAA
// =============================================

import axios from "axios";
import {
  Game,
  GameStatus,
  Team,
  League,
  SportType,
  SOCCER_LEAGUES,
  NCAA_LEAGUES,
  API_FOOTBALL_LEAGUE_IDS,
} from "@/types";

// ---------- API-Football (Soccer) ----------

const footballApi = axios.create({
  baseURL: "https://v3.football.api-sports.io",
  headers: {
    "x-apisports-key": process.env.FOOTBALL_API_KEY || "",
  },
});

function mapFootballStatus(status: string, elapsed: number | null): { gameStatus: GameStatus; minute?: number } {
  const shortStatus = status?.toUpperCase();
  switch (shortStatus) {
    case "1H":
    case "2H":
    case "ET":
    case "P":
    case "LIVE":
      return { gameStatus: "live", minute: elapsed || undefined };
    case "HT":
      return { gameStatus: "halftime", minute: 45 };
    case "FT":
    case "AET":
    case "PEN":
      return { gameStatus: "finished" };
    case "NS":
    case "TBD":
      return { gameStatus: "scheduled" };
    case "PST":
      return { gameStatus: "postponed" };
    case "CANC":
    case "ABD":
    case "AWD":
    case "WO":
      return { gameStatus: "cancelled" };
    default:
      return { gameStatus: "scheduled" };
  }
}

export async function fetchSoccerGames(leagueId: string): Promise<Game[]> {
  const apiLeagueId = API_FOOTBALL_LEAGUE_IDS[leagueId];
  if (!apiLeagueId) return [];

  const league = SOCCER_LEAGUES.find((l) => l.id === leagueId);
  if (!league) return [];

  // If no API key, return demo data
  if (!process.env.FOOTBALL_API_KEY) {
    return generateDemoSoccerGames(league);
  }

  try {
    const today = new Date().toISOString().split("T")[0];
    // Fetch games for today and the next 3 days
    const dates = [];
    for (let i = 0; i < 4; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);
    }

    const responses = await Promise.all(
      dates.map((date) =>
        footballApi.get("/fixtures", {
          params: { league: apiLeagueId, season: 2025, date },
        })
      )
    );

    const allFixtures = responses.flatMap((res) => res.data?.response || []);

    return allFixtures.map((fixture: any) => {
      const { gameStatus, minute } = mapFootballStatus(
        fixture.fixture.status.short,
        fixture.fixture.status.elapsed
      );

      return {
        id: `soccer_${fixture.fixture.id}`,
        externalId: String(fixture.fixture.id),
        sport: "soccer" as SportType,
        league,
        homeTeam: {
          id: String(fixture.teams.home.id),
          name: fixture.teams.home.name,
          shortName: fixture.teams.home.name.split(" ").pop() || fixture.teams.home.name,
          logo: fixture.teams.home.logo,
          score: fixture.goals.home,
        },
        awayTeam: {
          id: String(fixture.teams.away.id),
          name: fixture.teams.away.name,
          shortName: fixture.teams.away.name.split(" ").pop() || fixture.teams.away.name,
          logo: fixture.teams.away.logo,
          score: fixture.goals.away,
        },
        status: gameStatus,
        startTime: fixture.fixture.date,
        minute,
        venue: fixture.fixture.venue?.name,
        messageCount: 0,
        activeUsers: 0,
      };
    });
  } catch (error) {
    console.error(`Error fetching soccer games for ${leagueId}:`, error);
    return generateDemoSoccerGames(league);
  }
}

// ---------- ESPN API (NCAA) ----------

const espnApi = axios.create({
  baseURL: "https://site.api.espn.com/apis/site/v2/sports",
});

function mapEspnStatus(status: string): GameStatus {
  switch (status?.toLowerCase()) {
    case "in":
      return "live";
    case "pre":
      return "scheduled";
    case "post":
      return "finished";
    case "postponed":
      return "postponed";
    case "canceled":
    case "cancelled":
      return "cancelled";
    default:
      return "scheduled";
  }
}

export async function fetchNcaaGames(leagueId: string): Promise<Game[]> {
  const league = NCAA_LEAGUES.find((l) => l.id === leagueId);
  if (!league) return [];

  const sportSlug =
    leagueId === "ncaa_fb"
      ? "football/college-football"
      : "basketball/mens-college-basketball";

  try {
    const response = await espnApi.get(`/${sportSlug}/scoreboard`, {
      params: { limit: 50 },
    });

    const events = response.data?.events || [];

    return events.map((event: any) => {
      const competition = event.competitions?.[0];
      const homeCompetitor = competition?.competitors?.find(
        (c: any) => c.homeAway === "home"
      );
      const awayCompetitor = competition?.competitors?.find(
        (c: any) => c.homeAway === "away"
      );

      const status = mapEspnStatus(competition?.status?.type?.state);
      const minute =
        status === "live"
          ? parseInt(competition?.status?.displayClock || "0")
          : undefined;

      return {
        id: `ncaa_${event.id}`,
        externalId: String(event.id),
        sport: league.sport,
        league,
        homeTeam: {
          id: String(homeCompetitor?.id || ""),
          name: homeCompetitor?.team?.displayName || "TBD",
          shortName: homeCompetitor?.team?.abbreviation || "TBD",
          logo: homeCompetitor?.team?.logo || "",
          score: homeCompetitor?.score ? parseInt(homeCompetitor.score) : undefined,
        },
        awayTeam: {
          id: String(awayCompetitor?.id || ""),
          name: awayCompetitor?.team?.displayName || "TBD",
          shortName: awayCompetitor?.team?.abbreviation || "TBD",
          logo: awayCompetitor?.team?.logo || "",
          score: awayCompetitor?.score ? parseInt(awayCompetitor.score) : undefined,
        },
        status,
        startTime: event.date,
        minute,
        venue: competition?.venue?.fullName,
        messageCount: 0,
        activeUsers: 0,
      };
    });
  } catch (error) {
    console.error(`Error fetching NCAA games for ${leagueId}:`, error);
    return generateDemoNcaaGames(league);
  }
}

// ---------- Fetch All Games ----------

export async function fetchAllGames(
  leagueFilter?: string[]
): Promise<Game[]> {
  const soccerLeagueIds = leagueFilter
    ? SOCCER_LEAGUES.filter((l) => leagueFilter.includes(l.id)).map((l) => l.id)
    : SOCCER_LEAGUES.map((l) => l.id);

  const ncaaLeagueIds = leagueFilter
    ? NCAA_LEAGUES.filter((l) => leagueFilter.includes(l.id)).map((l) => l.id)
    : NCAA_LEAGUES.map((l) => l.id);

  const [soccerGames, ncaaGames] = await Promise.all([
    Promise.all(soccerLeagueIds.map(fetchSoccerGames)),
    Promise.all(ncaaLeagueIds.map(fetchNcaaGames)),
  ]);

  const allGames = [...soccerGames.flat(), ...ncaaGames.flat()];

  // Sort: live first, then scheduled by start time, then finished
  return allGames.sort((a, b) => {
    const statusOrder: Record<GameStatus, number> = {
      live: 0,
      halftime: 1,
      scheduled: 2,
      finished: 3,
      postponed: 4,
      cancelled: 5,
    };

    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;

    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });
}

// =============================================
// DEMO DATA (when no API key is configured)
// =============================================

function generateDemoSoccerGames(league: League): Game[] {
  const now = new Date();

  const soccerTeams: Record<string, Array<[string, string]>> = {
    pl: [
      ["Arsenal", "ARS"],
      ["Manchester City", "MCI"],
      ["Liverpool", "LIV"],
      ["Chelsea", "CHE"],
      ["Manchester United", "MUN"],
      ["Tottenham", "TOT"],
      ["Newcastle United", "NEW"],
      ["Aston Villa", "AVL"],
      ["Brighton", "BHA"],
      ["West Ham", "WHU"],
    ],
    laliga: [
      ["Real Madrid", "RMA"],
      ["Barcelona", "BAR"],
      ["Atletico Madrid", "ATM"],
      ["Real Sociedad", "RSO"],
      ["Athletic Bilbao", "ATH"],
      ["Villarreal", "VIL"],
      ["Real Betis", "BET"],
      ["Sevilla", "SEV"],
    ],
    bundesliga: [
      ["Bayern Munich", "BAY"],
      ["Borussia Dortmund", "BVB"],
      ["RB Leipzig", "RBL"],
      ["Bayer Leverkusen", "B04"],
      ["Stuttgart", "VFB"],
      ["Frankfurt", "SGE"],
    ],
    seriea: [
      ["Inter Milan", "INT"],
      ["AC Milan", "ACM"],
      ["Juventus", "JUV"],
      ["Napoli", "NAP"],
      ["Roma", "ROM"],
      ["Lazio", "LAZ"],
      ["Atalanta", "ATA"],
      ["Fiorentina", "FIO"],
    ],
    ligue1: [
      ["PSG", "PSG"],
      ["Marseille", "OM"],
      ["Monaco", "ASM"],
      ["Lyon", "OL"],
      ["Lille", "LOC"],
      ["Nice", "OGC"],
    ],
    ucl: [
      ["Real Madrid", "RMA"],
      ["Manchester City", "MCI"],
      ["Bayern Munich", "BAY"],
      ["Barcelona", "BAR"],
      ["PSG", "PSG"],
      ["Inter Milan", "INT"],
      ["Arsenal", "ARS"],
      ["Borussia Dortmund", "BVB"],
    ],
  };

  const teams = soccerTeams[league.id] || soccerTeams["pl"];
  const games: Game[] = [];

  for (let i = 0; i < teams.length - 1; i += 2) {
    const [homeName, homeShort] = teams[i];
    const [awayName, awayShort] = teams[i + 1];

    const gameTime = new Date(now);
    const hourOffset = Math.floor(i / 2) * 3 - 3;
    gameTime.setHours(gameTime.getHours() + hourOffset);

    const isLive = hourOffset >= -2 && hourOffset <= 0;
    const isFinished = hourOffset < -2;
    const status: GameStatus = isLive
      ? "live"
      : isFinished
      ? "finished"
      : "scheduled";

    games.push({
      id: `soccer_demo_${league.id}_${i}`,
      externalId: `demo_${league.id}_${i}`,
      sport: "soccer",
      league,
      homeTeam: {
        id: `team_${homeShort.toLowerCase()}`,
        name: homeName,
        shortName: homeShort,
        logo: `https://api.dicebear.com/8.x/initials/svg?seed=${homeShort}&backgroundColor=1e293b&textColor=ffffff`,
        score: isLive || isFinished ? Math.floor(Math.random() * 4) : undefined,
      },
      awayTeam: {
        id: `team_${awayShort.toLowerCase()}`,
        name: awayName,
        shortName: awayShort,
        logo: `https://api.dicebear.com/8.x/initials/svg?seed=${awayShort}&backgroundColor=1e293b&textColor=ffffff`,
        score: isLive || isFinished ? Math.floor(Math.random() * 3) : undefined,
      },
      status,
      startTime: gameTime.toISOString(),
      minute: isLive ? Math.floor(Math.random() * 90) + 1 : undefined,
      venue: `${homeName} Stadium`,
      messageCount: Math.floor(Math.random() * 500),
      activeUsers: isLive ? Math.floor(Math.random() * 200) + 10 : Math.floor(Math.random() * 20),
    });
  }

  return games;
}

function generateDemoNcaaGames(league: League): Game[] {
  const now = new Date();

  const ncaaFbTeams: Array<[string, string]> = [
    ["Alabama", "ALA"],
    ["Georgia", "UGA"],
    ["Ohio State", "OSU"],
    ["Michigan", "MICH"],
    ["Texas", "TEX"],
    ["USC", "USC"],
    ["Clemson", "CLEM"],
    ["Oregon", "ORE"],
  ];

  const ncaaBbTeams: Array<[string, string]> = [
    ["Duke", "DUKE"],
    ["North Carolina", "UNC"],
    ["Kansas", "KU"],
    ["Kentucky", "UK"],
    ["Gonzaga", "GONZ"],
    ["UCLA", "UCLA"],
    ["UConn", "CONN"],
    ["Purdue", "PUR"],
  ];

  const teams = league.id === "ncaa_fb" ? ncaaFbTeams : ncaaBbTeams;
  const games: Game[] = [];

  for (let i = 0; i < teams.length - 1; i += 2) {
    const [homeName, homeShort] = teams[i];
    const [awayName, awayShort] = teams[i + 1];

    const gameTime = new Date(now);
    const hourOffset = Math.floor(i / 2) * 4 - 2;
    gameTime.setHours(gameTime.getHours() + hourOffset);

    const isLive = hourOffset >= -2 && hourOffset <= 0;
    const isFinished = hourOffset < -2;
    const status: GameStatus = isLive
      ? "live"
      : isFinished
      ? "finished"
      : "scheduled";

    const isFb = league.id === "ncaa_fb";

    games.push({
      id: `ncaa_demo_${league.id}_${i}`,
      externalId: `demo_${league.id}_${i}`,
      sport: league.sport,
      league,
      homeTeam: {
        id: `team_${homeShort.toLowerCase()}`,
        name: homeName,
        shortName: homeShort,
        logo: `https://api.dicebear.com/8.x/initials/svg?seed=${homeShort}&backgroundColor=312e81&textColor=ffffff`,
        score:
          isLive || isFinished
            ? isFb
              ? Math.floor(Math.random() * 6) * 7
              : Math.floor(Math.random() * 40) + 50
            : undefined,
      },
      awayTeam: {
        id: `team_${awayShort.toLowerCase()}`,
        name: awayName,
        shortName: awayShort,
        logo: `https://api.dicebear.com/8.x/initials/svg?seed=${awayShort}&backgroundColor=312e81&textColor=ffffff`,
        score:
          isLive || isFinished
            ? isFb
              ? Math.floor(Math.random() * 5) * 7
              : Math.floor(Math.random() * 40) + 45
            : undefined,
      },
      status,
      startTime: gameTime.toISOString(),
      minute: isLive ? Math.floor(Math.random() * 60) + 1 : undefined,
      venue: `${homeName} Arena`,
      messageCount: Math.floor(Math.random() * 300),
      activeUsers: isLive ? Math.floor(Math.random() * 150) + 5 : Math.floor(Math.random() * 10),
    });
  }

  return games;
}
