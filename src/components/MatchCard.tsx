"use client";

import { memo } from "react";
import { MatchCardProps } from "@/types";
import LiveBadge from "./LiveBadge";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { MessageSquare, Users, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

function TeamRow({
  name,
  shortName,
  logo,
  score,
  showScore,
  isWinner,
  emphasizeScore,
}: {
  name: string;
  shortName: string;
  logo?: string;
  score?: number;
  showScore: boolean;
  isWinner: boolean;
  emphasizeScore: "live" | "muted" | "winner" | "none";
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 transition-colors ${
            isWinner
              ? "bg-dark-700/60 ring-primary-500/40"
              : "bg-dark-700/50 ring-dark-600/40"
          }`}
        >
          {logo ? (
            <img
              src={logo}
              alt={shortName}
              className="w-6 h-6 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <span className="text-[10px] font-bold text-dark-400">
              {shortName.slice(0, 3)}
            </span>
          )}
        </div>
        <span
          className={`truncate ${
            isWinner ? "text-dark-50 font-bold" : "text-dark-200 font-medium"
          } text-sm sm:text-[15px]`}
        >
          {name}
        </span>
      </div>
      {showScore && score !== undefined && (
        <span
          className={`text-2xl font-extrabold tabular-nums leading-none tracking-tight ${
            emphasizeScore === "live" || emphasizeScore === "winner"
              ? "text-dark-50"
              : "text-dark-400"
          }`}
        >
          {score}
        </span>
      )}
    </div>
  );
}

function MatchCard({ game, onClick }: MatchCardProps) {
  const router = useRouter();

  const isLive = game.status === "live" || game.status === "halftime";
  const isFinished = game.status === "finished";
  const isScheduled = game.status === "scheduled";

  const startDate = parseISO(game.startTime);
  const timeString = format(startDate, "HH:mm");
  const dateString = isToday(startDate)
    ? "Today"
    : isTomorrow(startDate)
    ? "Tomorrow"
    : format(startDate, "MMM d");

  const hasScores =
    game.homeTeam.score !== undefined && game.awayTeam.score !== undefined;
  const homeWins =
    isFinished && hasScores && game.homeTeam.score! > game.awayTeam.score!;
  const awayWins =
    isFinished && hasScores && game.awayTeam.score! > game.homeTeam.score!;

  const handleClick = () => {
    if (onClick) onClick(game);
    else router.push(`/match/${game.id}`);
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left group relative rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
        isLive
          ? "bg-dark-800/90 border-red-500/30 hover:border-red-500/60 shadow-lg shadow-red-500/5 hover:shadow-xl hover:shadow-red-500/15"
          : "bg-dark-800/80 border-dark-700/50 hover:border-primary-500/40 hover:shadow-xl hover:shadow-primary-900/10"
      }`}
    >
      {/* Top accent bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
          isLive
            ? "bg-[linear-gradient(90deg,#ef4444,#f59e0b,#ef4444)] bg-[length:200%_100%] animate-shimmer"
            : isFinished
            ? "bg-dark-600/40"
            : "bg-gradient-to-r from-primary-600/0 via-primary-500/60 to-primary-600/0 opacity-0 group-hover:opacity-100 transition-opacity"
        }`}
      />

      {/* Hover glow */}
      <div className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(99,102,241,0.08),transparent)]" />

      <div className="relative p-4 sm:p-5">
        {/* League & status header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-[11px] font-bold text-dark-300 uppercase tracking-wider truncate">
              {game.league.shortName}
            </span>
            {game.league.country && (
              <span className="text-[10px] text-dark-500 truncate">
                · {game.league.country}
              </span>
            )}
            {(game.round || game.leg) && (
              <span className="text-[10px] font-medium text-primary-300 bg-primary-500/10 border border-primary-500/20 px-1.5 py-0.5 rounded-md">
                {game.round}
                {game.leg ? ` · ${game.leg}` : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isLive && <LiveBadge status={game.status} minute={game.minute} />}
            {isFinished && <LiveBadge status="finished" />}
            {isScheduled && (
              <span className="text-xs font-semibold text-dark-200 tabular-nums">
                {timeString}
              </span>
            )}
          </div>
        </div>

        {/* Teams */}
        <div className="space-y-3">
          <TeamRow
            name={game.homeTeam.name}
            shortName={game.homeTeam.shortName}
            logo={game.homeTeam.logo}
            score={game.homeTeam.score}
            showScore={isLive || isFinished}
            isWinner={homeWins}
            emphasizeScore={
              isLive ? "live" : homeWins ? "winner" : isFinished ? "muted" : "none"
            }
          />
          <TeamRow
            name={game.awayTeam.name}
            shortName={game.awayTeam.shortName}
            logo={game.awayTeam.logo}
            score={game.awayTeam.score}
            showScore={isLive || isFinished}
            isWinner={awayWins}
            emphasizeScore={
              isLive ? "live" : awayWins ? "winner" : isFinished ? "muted" : "none"
            }
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-dark-700/50">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-dark-400">
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold tabular-nums">
                {game.messageCount}
              </span>
            </span>
            {game.activeUsers > 0 && (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Users className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold tabular-nums">
                  {game.activeUsers}
                </span>
              </span>
            )}
            {isScheduled && (
              <span className="text-xs text-dark-500">{dateString}</span>
            )}
          </div>

          <span
            className={`flex items-center gap-1 text-xs font-bold transition-all ${
              isLive
                ? "text-red-400"
                : "text-primary-300 opacity-0 group-hover:opacity-100"
            } translate-x-1 group-hover:translate-x-0`}
          >
            {isLive ? "Join Live" : "Open Chat"}
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </button>
  );
}

export default memo(MatchCard);
