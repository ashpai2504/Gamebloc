"use client";

import { Game } from "@/types";
import { useRouter } from "next/navigation";

/**
 * Broadcast-style scrolling ticker of live scores. Renders the list twice and
 * animates -50% so the loop is seamless. Pauses on hover.
 */
export default function LiveTicker({ games }: { games: Game[] }) {
  const router = useRouter();
  if (games.length === 0) return null;

  const items = [...games, ...games]; // duplicate for seamless loop

  return (
    <div className="relative overflow-hidden border-y border-dark-700/50 bg-dark-900/60 backdrop-blur-sm">
      {/* Edge fades */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-dark-950 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-l from-dark-950 to-transparent" />

      {/* LIVE label */}
      <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center gap-1.5 px-3 bg-red-600 text-white">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/70" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
        </span>
        <span className="text-[11px] font-extrabold uppercase tracking-wider">
          Live
        </span>
      </div>

      <div className="flex w-max animate-ticker hover:[animation-play-state:paused] py-2 pl-24">
        {items.map((g, i) => (
          <button
            key={`${g.id}-${i}`}
            onClick={() => router.push(`/match/${g.id}`)}
            className="flex items-center gap-2 px-4 border-r border-dark-700/40 whitespace-nowrap hover:bg-dark-800/40 transition-colors"
          >
            <span className="text-[11px] font-semibold text-dark-400 uppercase">
              {g.league.shortName}
            </span>
            <span className="text-xs font-medium text-dark-200">
              {g.homeTeam.shortName}
            </span>
            <span className="text-xs font-extrabold text-dark-50 tabular-nums">
              {g.homeTeam.score ?? 0}
            </span>
            <span className="text-dark-500 text-[10px]">vs</span>
            <span className="text-xs font-extrabold text-dark-50 tabular-nums">
              {g.awayTeam.score ?? 0}
            </span>
            <span className="text-xs font-medium text-dark-200">
              {g.awayTeam.shortName}
            </span>
            {g.minute ? (
              <span className="text-[10px] font-bold text-red-400 tabular-nums">
                {g.minute}&apos;
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
