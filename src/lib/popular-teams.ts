/** Curated list of major club & national teams always shown in the Favorite Teams picker.
 *  IDs match ESPN's team IDs so logos resolve correctly. */
export interface StaticTeam {
  teamId: string;
  name: string;
  shortName: string;
  logo: string;
  sport: string;
}

const espnSoccerLogo = (id: number) =>
  `https://a.espncdn.com/i/teamlogos/soccer/500/${id}.png`;

const espnNcaaLogo = (id: number) =>
  `https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png`;

export const POPULAR_TEAMS: StaticTeam[] = [
  // ── La Liga ──────────────────────────────────────────────────
  { teamId: "86",   name: "Real Madrid",        shortName: "RMA",  logo: espnSoccerLogo(86),   sport: "soccer" },
  { teamId: "83",   name: "FC Barcelona",        shortName: "BAR",  logo: espnSoccerLogo(83),   sport: "soccer" },
  { teamId: "1068", name: "Atlético Madrid",     shortName: "ATM",  logo: espnSoccerLogo(1068), sport: "soccer" },
  { teamId: "558",  name: "Sevilla",             shortName: "SEV",  logo: espnSoccerLogo(558),  sport: "soccer" },
  { teamId: "243",  name: "Valencia",            shortName: "VAL",  logo: espnSoccerLogo(243),  sport: "soccer" },
  // ── Premier League ───────────────────────────────────────────
  { teamId: "360",  name: "Manchester United",   shortName: "MUN",  logo: espnSoccerLogo(360),  sport: "soccer" },
  { teamId: "382",  name: "Manchester City",     shortName: "MCI",  logo: espnSoccerLogo(382),  sport: "soccer" },
  { teamId: "364",  name: "Liverpool",           shortName: "LIV",  logo: espnSoccerLogo(364),  sport: "soccer" },
  { teamId: "359",  name: "Arsenal",             shortName: "ARS",  logo: espnSoccerLogo(359),  sport: "soccer" },
  { teamId: "363",  name: "Chelsea",             shortName: "CHE",  logo: espnSoccerLogo(363),  sport: "soccer" },
  { teamId: "367",  name: "Tottenham Hotspur",   shortName: "TOT",  logo: espnSoccerLogo(367),  sport: "soccer" },
  { teamId: "370",  name: "Aston Villa",         shortName: "AVL",  logo: espnSoccerLogo(370),  sport: "soccer" },
  { teamId: "362",  name: "Newcastle United",    shortName: "NEW",  logo: espnSoccerLogo(362),  sport: "soccer" },
  // ── Bundesliga ───────────────────────────────────────────────
  { teamId: "132",  name: "Bayern Munich",       shortName: "BAY",  logo: espnSoccerLogo(132),  sport: "soccer" },
  { teamId: "124",  name: "Borussia Dortmund",   shortName: "DOR",  logo: espnSoccerLogo(124),  sport: "soccer" },
  { teamId: "131",  name: "Bayer Leverkusen",    shortName: "LEV",  logo: espnSoccerLogo(131),  sport: "soccer" },
  // ── Serie A ──────────────────────────────────────────────────
  { teamId: "157",  name: "Juventus",            shortName: "JUV",  logo: espnSoccerLogo(157),  sport: "soccer" },
  { teamId: "103",  name: "AC Milan",            shortName: "MIL",  logo: espnSoccerLogo(103),  sport: "soccer" },
  { teamId: "110",  name: "Inter Milan",         shortName: "INT",  logo: espnSoccerLogo(110),  sport: "soccer" },
  { teamId: "109",  name: "Napoli",              shortName: "NAP",  logo: espnSoccerLogo(109),  sport: "soccer" },
  // ── Ligue 1 ──────────────────────────────────────────────────
  { teamId: "160",  name: "Paris Saint-Germain", shortName: "PSG",  logo: espnSoccerLogo(160),  sport: "soccer" },
  // ── UEFA Champions League regulars ───────────────────────────
  { teamId: "676",  name: "Ajax",                shortName: "AJA",  logo: espnSoccerLogo(676),  sport: "soccer" },
  { teamId: "174",  name: "Porto",               shortName: "POR",  logo: espnSoccerLogo(174),  sport: "soccer" },
  { teamId: "169",  name: "Benfica",             shortName: "BEN",  logo: espnSoccerLogo(169),  sport: "soccer" },
  // ── World Cup national teams ─────────────────────────────────
  { teamId: "9",    name: "Brazil",              shortName: "BRA",  logo: espnSoccerLogo(9),    sport: "soccer" },
  { teamId: "7",    name: "Argentina",           shortName: "ARG",  logo: espnSoccerLogo(7),    sport: "soccer" },
  { teamId: "17",   name: "France",              shortName: "FRA",  logo: espnSoccerLogo(17),   sport: "soccer" },
  { teamId: "21",   name: "Germany",             shortName: "GER",  logo: espnSoccerLogo(21),   sport: "soccer" },
  { teamId: "38",   name: "Spain",               shortName: "ESP",  logo: espnSoccerLogo(38),   sport: "soccer" },
  { teamId: "42",   name: "England",             shortName: "ENG",  logo: espnSoccerLogo(42),   sport: "soccer" },
  { teamId: "44",   name: "Portugal",            shortName: "POR",  logo: espnSoccerLogo(44),   sport: "soccer" },
  { teamId: "43",   name: "Netherlands",         shortName: "NED",  logo: espnSoccerLogo(43),   sport: "soccer" },
  { teamId: "23",   name: "USA",                 shortName: "USA",  logo: espnSoccerLogo(23),   sport: "soccer" },
  { teamId: "30",   name: "Mexico",              shortName: "MEX",  logo: espnSoccerLogo(30),   sport: "soccer" },
  { teamId: "8",    name: "Belgium",             shortName: "BEL",  logo: espnSoccerLogo(8),    sport: "soccer" },
  { teamId: "27",   name: "Japan",               shortName: "JPN",  logo: espnSoccerLogo(27),   sport: "soccer" },
  { teamId: "10",   name: "Colombia",            shortName: "COL",  logo: espnSoccerLogo(10),   sport: "soccer" },
  { teamId: "37",   name: "Senegal",             shortName: "SEN",  logo: espnSoccerLogo(37),   sport: "soccer" },
  { teamId: "6",    name: "Morocco",             shortName: "MAR",  logo: espnSoccerLogo(6),    sport: "soccer" },
  { teamId: "2",    name: "Canada",              shortName: "CAN",  logo: espnSoccerLogo(2),    sport: "soccer" },
  // ── NCAA Football (top programs) ─────────────────────────────
  { teamId: "333",  name: "Alabama Crimson Tide",   shortName: "ALA",  logo: espnNcaaLogo(333),  sport: "ncaa_football" },
  { teamId: "2",    name: "Ohio State Buckeyes",    shortName: "OSU",  logo: espnNcaaLogo(194),  sport: "ncaa_football" },
  { teamId: "130",  name: "Michigan Wolverines",    shortName: "MICH", logo: espnNcaaLogo(130),  sport: "ncaa_football" },
  { teamId: "228",  name: "Georgia Bulldogs",       shortName: "UGA",  logo: espnNcaaLogo(61),   sport: "ncaa_football" },
  { teamId: "99",   name: "Texas Longhorns",        shortName: "TEX",  logo: espnNcaaLogo(251),  sport: "ncaa_football" },
  // ── NCAA Basketball (top programs) ───────────────────────────
  { teamId: "150",  name: "Duke Blue Devils",       shortName: "DUKE", logo: espnNcaaLogo(150),  sport: "ncaa_basketball" },
  { teamId: "153",  name: "Kentucky Wildcats",      shortName: "UK",   logo: espnNcaaLogo(96),   sport: "ncaa_basketball" },
  { teamId: "41",   name: "Kansas Jayhawks",        shortName: "KU",   logo: espnNcaaLogo(2305), sport: "ncaa_basketball" },
  { teamId: "26",   name: "North Carolina Tar Heels", shortName: "UNC", logo: espnNcaaLogo(153), sport: "ncaa_basketball" },
];
