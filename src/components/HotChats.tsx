"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Game } from "@/types";
import { Flame, MessageSquare } from "lucide-react";
import LiveBadge from "./LiveBadge";

interface HotChatsProps {
  /** The currently loaded games to rank. Only fifa_wc games are considered. */
  games: Game[];
}

interface HotChat {
  game: Game;
  count: number; // messages in the last 24h
}

/**
 * "Hot Chats Today" rail for the World Cup section.
 * Ranks WC match chats by message volume in the last 24h — including finished
 * matches, since a chat can stay busy well after the final whistle.
 */
export default function HotChats({ games }: HotChatsProps) {
  const router = useRouter();

  // Only rank World Cup matches that we actually have metadata for, so every
  // ranked chat is renderable (finished WC games stay in the feed for ~2 days).
  const wcGames = useMemo(
    () => games.filter((g) => g.league.id === "fifa_wc"),
    [games]
  );

  // Stable key so the effect only re-fetches when the set of games changes.
  const gameIdKey = useMemo(
    () => wcGames.map((g) => g.id).sort().join(","),
    [wcGames]
  );

  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!gameIdKey) {
      setCounts({});
      return;
    }

    let active = true;

    const load = () => {
      fetch(
        `/api/hot-chats?hours=24&limit=12&gameIds=${encodeURIComponent(gameIdKey)}`
      )
        .then((r) => r.json())
        .then((res) => {
          if (!active || !res?.success) return;
          const map: Record<string, number> = {};
          for (const hc of res.data.hotChats as { gameId: string; count: number }[]) {
            map[hc.gameId] = hc.count;
          }
          setCounts(map);
        })
        .catch(() => {
          /* non-fatal: rail just stays hidden/empty */
        });
    };

    load();
    const interval = setInterval(load, 90_000); // refresh every 90s
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [gameIdKey]);

  const hot: HotChat[] = useMemo(
    () =>
      wcGames
        .map((g) => ({ game: g, count: counts[g.id] ?? 0 }))
        .filter((h) => h.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 2),
    [wcGames, counts]
  );

  if (hot.length === 0) return null;

  return (
    <section className="mb-2">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <span className="h-5 w-1 rounded-full bg-amber-500" />
        <Flame className="w-4 h-4 text-amber-400" />
        <h2 className="text-sm font-extrabold text-dark-100 uppercase tracking-wider">
          Hot Chats Today
        </h2>
        <span className="text-[11px] text-dark-500 normal-case font-medium tracking-normal">
          Most talked-about matches in the last 24h
        </span>
      </div>

      {/* Horizontal rail */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
        {hot.map(({ game, count }, i) => {
          const isLive = game.status === "live" || game.status === "halftime";
          const isFinished = game.status === "finished";
          const hasScores =
            game.homeTeam.score !== undefined &&
            game.awayTeam.score !== undefined;

          return (
            <button
              key={game.id}
              onClick={() => router.push(`/match/${game.id}`)}
              className={`group relative flex-shrink-0 w-64 text-left snap-start rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1 ${
                isLive
                  ? "bg-dark-800/90 border-red-500/30 hover:border-red-500/60"
                  : "bg-gradient-to-br from-amber-950/30 to-dark-800/80 border-amber-500/20 hover:border-amber-500/50"
              }`}
            >
              {/* Rank + hot count */}
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-[11px] font-extrabold tabular-nums ${
                    i === 0
                      ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40"
                      : "bg-dark-700/60 text-dark-300"
                  }`}
                >
                  #{i + 1}
                </span>
                <span className="inline-flex items-center gap-1 text-amber-300 text-xs font-bold tabular-nums">
                  <Flame className="w-3.5 h-3.5" />
                  {count}
                </span>
              </div>

              {/* Teams */}
              <div className="space-y-1.5">
                <TeamLine
                  name={game.homeTeam.name}
                  shortName={game.homeTeam.shortName}
                  logo={game.homeTeam.logo}
                  score={hasScores ? game.homeTeam.score : undefined}
                />
                <TeamLine
                  name={game.awayTeam.name}
                  shortName={game.awayTeam.shortName}
                  logo={game.awayTeam.logo}
                  score={hasScores ? game.awayTeam.score : undefined}
                />
              </div>

              {/* Footer: status + open */}
              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-dark-700/50">
                {isLive ? (
                  <LiveBadge status={game.status} minute={game.minute} />
                ) : isFinished ? (
                  <span className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">
                    Full time
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-primary-300 uppercase tracking-wider">
                    Upcoming
                  </span>
                )}
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-300/0 group-hover:text-amber-300 transition-colors">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Open
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function TeamLine({
  name,
  shortName,
  logo,
  score,
}: {
  name: string;
  shortName: string;
  logo?: string;
  score?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 rounded-md bg-dark-700/50 flex items-center justify-center overflow-hidden flex-shrink-0">
          {logo ? (
            <img
              src={logo}
              alt={shortName}
              className="w-4 h-4 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <span className="text-[9px] font-bold text-dark-400">
              {shortName.slice(0, 3)}
            </span>
          )}
        </div>
        <span className="truncate text-sm font-semibold text-dark-100">
          {name}
        </span>
      </div>
      {score !== undefined && (
        <span className="text-base font-extrabold tabular-nums text-dark-50">
          {score}
        </span>
      )}
    </div>
  );
}
