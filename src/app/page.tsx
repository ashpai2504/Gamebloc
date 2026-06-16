"use client";

import { useMemo } from "react";
import { useGames } from "@/hooks/useGames";
import { useGameStore } from "@/lib/store";
import MatchList from "@/components/MatchList";
import LeagueFilter from "@/components/LeagueFilter";
import TeamSearch from "@/components/TeamSearch";
import WorldCupBanner from "@/components/WorldCupBanner";
import LiveTicker from "@/components/LiveTicker";
import { RefreshCw, Zap, TrendingUp, Globe, Trophy } from "lucide-react";
import GameblocLogo from "@/components/GameblocLogo";
import { format, parseISO } from "date-fns";

export default function HomePage() {
  const selectedSport = useGameStore((s) => s.selectedSport);
  const selectedLeagues = useGameStore((s) => s.selectedLeagues);
  const teamSearch = useGameStore((s) => s.teamSearch);
  const setSport = useGameStore((s) => s.setSport);
  const toggleLeague = useGameStore((s) => s.toggleLeague);
  const clearSelectedLeagues = useGameStore((s) => s.clearSelectedLeagues);

  const {
    games,
    liveGames,
    scheduledGames,
    finishedGames,
    isLoading,
    error,
    lastUpdated,
    refresh,
  } = useGames({
    selectedLeagues: selectedLeagues.length > 0 ? selectedLeagues : undefined,
    selectedSport,
    refreshInterval: 5 * 60 * 1000, // match server cache (5 min)
  });

  const filterByTeam = useMemo(() => {
    const q = teamSearch.trim().toLowerCase();
    if (!q) return null;
    return (list: typeof games) =>
      list.filter(
        (g) =>
          g.homeTeam.name.toLowerCase().includes(q) ||
          g.awayTeam.name.toLowerCase().includes(q) ||
          g.homeTeam.shortName.toLowerCase().includes(q) ||
          g.awayTeam.shortName.toLowerCase().includes(q)
      );
  }, [teamSearch]);

  const filteredGames = filterByTeam ? filterByTeam(games) : games;
  const filteredLive = filterByTeam ? filterByTeam(liveGames) : liveGames;
  const filteredScheduled = filterByTeam ? filterByTeam(scheduledGames) : scheduledGames;
  const filteredFinished = filterByTeam ? filterByTeam(finishedGames) : finishedGames;

  const wcLiveCount = useMemo(
    () => liveGames.filter((g) => g.league.id === "fifa_wc").length,
    [liveGames]
  );
  const wcTotalCount = useMemo(
    () => games.filter((g) => g.league.id === "fifa_wc").length,
    [games]
  );

  // When the World Cup filter is active, the whole page adopts the WC theme.
  const isWcActive = selectedLeagues.includes("fifa_wc");

  const handleViewWcMatches = () => {
    setSport("soccer"); // clears selectedLeagues as a side-effect
    toggleLeague("fifa_wc"); // then adds fifa_wc
  };

  return (
    <div className="min-h-screen bg-dark-950 bg-grid-pattern">
      {/* FIFA World Cup 2026 Banner */}
      <WorldCupBanner
        onViewMatches={handleViewWcMatches}
        liveMatchCount={wcLiveCount}
        totalMatchCount={wcTotalCount}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background layers */}
        {isWcActive ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-950/40 via-dark-950 to-emerald-950/30" />
            <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_20%_0%,rgba(245,158,11,0.12),transparent)]" />
            <div className="absolute inset-0 bg-[radial-gradient(50%_80%_at_90%_10%,rgba(16,185,129,0.10),transparent)]" />
            {/* Pitch stripes */}
            <div className="absolute inset-0 opacity-[0.06] bg-[repeating-linear-gradient(90deg,#10b981_0_60px,transparent_60px_120px)]" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-primary-950/30 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(50%_70%_at_50%_0%,rgba(99,102,241,0.12),transparent)]" />
          </>
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-7">
          {/* Eyebrow pill */}
          <div className="flex items-center gap-2 mb-4">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                isWcActive
                  ? "text-amber-300 bg-amber-500/10 border-amber-500/30"
                  : "text-primary-300 bg-primary-500/10 border-primary-500/30"
              }`}
            >
              {isWcActive ? (
                <Trophy className="w-3 h-3" />
              ) : (
                <Zap className="w-3 h-3" />
              )}
              {isWcActive ? "World Cup 2026" : "Live Sports Chat"}
            </span>
            {liveGames.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/30">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                </span>
                {liveGames.length} LIVE
              </span>
            )}
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div className="max-w-2xl">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-dark-50 leading-[1.05]">
                {isWcActive ? (
                  <>
                    The{" "}
                    <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                      World Cup
                    </span>
                    , talked through together
                  </>
                ) : (
                  <>
                    Every match,{" "}
                    <span className="text-gradient">one live bloc</span> of fans
                  </>
                )}
              </h1>
              <p className="text-dark-400 text-sm sm:text-base mt-3">
                Tap any match to jump into the real-time chat — react to every
                goal, call, and comeback with fans around the world.
              </p>
            </div>

            {/* Stat tiles + refresh */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-dark-800/70 border border-dark-700/50">
                <Globe className="w-4 h-4 text-primary-400" />
                <div className="leading-none">
                  <div className="text-base font-extrabold text-dark-50 tabular-nums">
                    {games.length}
                  </div>
                  <div className="text-[10px] text-dark-500 uppercase tracking-wider mt-0.5">
                    Matches
                  </div>
                </div>
              </div>
              {liveGames.length > 0 && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25">
                  <Zap className="w-4 h-4 text-red-500" />
                  <div className="leading-none">
                    <div className="text-base font-extrabold text-dark-50 tabular-nums">
                      {liveGames.length}
                    </div>
                    <div className="text-[10px] text-red-400/80 uppercase tracking-wider mt-0.5">
                      Live now
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={refresh}
                  disabled={isLoading}
                  className="p-2.5 rounded-xl bg-dark-800/70 border border-dark-700/50 text-dark-400 hover:text-dark-50 hover:border-dark-600/50 transition-all disabled:opacity-50"
                  title="Refresh games"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                </button>
                {lastUpdated && (
                  <span className="text-[10px] text-dark-500 tabular-nums">
                    {format(parseISO(lastUpdated), "HH:mm")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live ticker */}
      {filteredLive.length > 0 && <LiveTicker games={filteredLive} />}

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <LeagueFilter
          selectedLeagues={selectedLeagues}
          onToggleLeague={toggleLeague}
          onClearLeagues={clearSelectedLeagues}
          selectedSport={selectedSport}
          onChangeSport={setSport}
          rightSlot={<TeamSearch games={games} />}
        />
      </div>

      {/* Match Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <MatchList
          games={filteredGames}
          liveGames={filteredLive}
          scheduledGames={filteredScheduled}
          finishedGames={filteredFinished}
          isLoading={isLoading}
          error={error}
        />
      </div>

      {/* Footer */}
      <footer className="border-t border-dark-800/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-dark-500 text-xs">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>
                Soccer data powered by API-Football · NCAA data powered by ESPN
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <GameblocLogo variant="footer" />
              <p className="text-xs text-dark-600">
                © {new Date().getFullYear()} Gamebloc. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
