"use client";

import { Game } from "@/types";
import MatchCard from "./MatchCard";
import { Flame, Clock, CheckCircle, Frown } from "lucide-react";

interface MatchListProps {
  games: Game[];
  liveGames: Game[];
  scheduledGames: Game[];
  finishedGames: Game[];
  isLoading: boolean;
  error: string | null;
}

function SectionHeader({
  icon,
  title,
  count,
  color,
  accent,
  live = false,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  color: string;
  accent: string;
  live?: boolean;
}) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-2.5 mb-4 mt-8 first:mt-0">
      <span className={`h-5 w-1 rounded-full ${accent}`} />
      <div className={`${color}`}>{icon}</div>
      <h2 className="text-sm font-extrabold text-dark-100 uppercase tracking-wider">
        {title}
      </h2>
      {live && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
      )}
      <span className="text-[11px] font-bold text-dark-300 bg-dark-800 border border-dark-700/60 px-2 py-0.5 rounded-full tabular-nums">
        {count}
      </span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-dark-800/80 rounded-2xl border border-dark-700/50 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="h-3 w-16 skeleton rounded" />
        <div className="h-3 w-10 skeleton rounded" />
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl skeleton" />
            <div className="h-4 w-32 skeleton rounded" />
          </div>
          <div className="h-6 w-6 skeleton rounded" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl skeleton" />
            <div className="h-4 w-28 skeleton rounded" />
          </div>
          <div className="h-6 w-6 skeleton rounded" />
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-dark-700/50">
        <div className="h-3 w-20 skeleton rounded" />
      </div>
    </div>
  );
}

export default function MatchList({
  games,
  liveGames,
  scheduledGames,
  finishedGames,
  isLoading,
  error,
}: MatchListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Frown className="w-12 h-12 text-dark-500 mb-4" />
        <h3 className="text-lg font-semibold text-dark-300 mb-2">
          Failed to load games
        </h3>
        <p className="text-sm text-dark-500 max-w-md">{error}</p>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Frown className="w-12 h-12 text-dark-500 mb-4" />
        <h3 className="text-lg font-semibold text-dark-300 mb-2">
          No games found
        </h3>
        <p className="text-sm text-dark-500 max-w-md">
          There are no matches for the selected filters. Try changing the sport
          or league filters above.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Live Games */}
      <SectionHeader
        icon={<Flame className="w-4 h-4" />}
        title="Live Now"
        count={liveGames.length}
        color="text-red-500"
        accent="bg-red-500"
        live
      />
      {liveGames.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
          {liveGames.map((game) => (
            <MatchCard key={game.id} game={game} />
          ))}
        </div>
      )}

      {/* Scheduled Games */}
      <SectionHeader
        icon={<Clock className="w-4 h-4" />}
        title="Upcoming"
        count={scheduledGames.length}
        color="text-primary-400"
        accent="bg-primary-500"
      />
      {scheduledGames.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
          {scheduledGames.map((game) => (
            <MatchCard key={game.id} game={game} />
          ))}
        </div>
      )}

      {/* Finished Games */}
      <SectionHeader
        icon={<CheckCircle className="w-4 h-4" />}
        title="Finished"
        count={finishedGames.length}
        color="text-dark-500"
        accent="bg-dark-600"
      />
      {finishedGames.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {finishedGames.map((game) => (
            <MatchCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}
