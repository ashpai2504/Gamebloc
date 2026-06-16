"use client";

import { useEffect, useState } from "react";
import { Trophy, MapPin, Calendar, ChevronRight, Zap } from "lucide-react";

interface WorldCupBannerProps {
  onViewMatches: () => void;
  liveMatchCount?: number;
  totalMatchCount?: number;
}

const WC_START = new Date("2026-06-11T14:00:00Z");
const WC_END = new Date("2026-07-19T20:00:00Z");

export default function WorldCupBanner({
  onViewMatches,
  liveMatchCount = 0,
  totalMatchCount = 0,
}: WorldCupBannerProps) {
  const [countdown, setCountdown] = useState<{
    days: number;
    hours: number;
    minutes: number;
  } | null>(null);
  const [tournamentState, setTournamentState] = useState<
    "upcoming" | "live" | "finished"
  >("upcoming");

  useEffect(() => {
    function tick() {
      const now = new Date();
      if (now >= WC_END) {
        setTournamentState("finished");
        setCountdown(null);
        return;
      }
      if (now >= WC_START) {
        setTournamentState("live");
        setCountdown(null);
        return;
      }
      setTournamentState("upcoming");
      const diff = WC_START.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setCountdown({ days, hours, minutes });
    }
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const isLive = tournamentState === "live" && liveMatchCount > 0;
  const isOngoing = tournamentState === "live";

  return (
    <div className="relative overflow-hidden border-b border-amber-500/10">
      {/* Layered background */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-950/30 via-dark-900/80 to-emerald-950/25" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(245,158,11,0.06),transparent)]" />

      {/* Animated top bar when matches are live */}
      {isLive && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 via-amber-400 to-red-600 animate-pulse" />
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

          {/* Left: Trophy icon + info */}
          <div className="flex items-center gap-4">
            {/* Trophy badge */}
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400/15 to-amber-700/15 border border-amber-500/25 flex items-center justify-center shadow-lg shadow-amber-500/5">
                <Trophy className="w-7 h-7 text-amber-400" />
              </div>
              {isLive && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-dark-950 animate-pulse" />
              )}
            </div>

            {/* Text */}
            <div className="min-w-0">
              {/* Title row */}
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-lg sm:text-xl font-bold text-dark-50 leading-none">
                  FIFA World Cup{" "}
                  <span className="bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
                    2026
                  </span>
                </h2>

                {isLive && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    <Zap className="w-2.5 h-2.5" />
                    {liveMatchCount} Live
                  </span>
                )}

                {isOngoing && !isLive && (
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    Ongoing
                  </span>
                )}

                {tournamentState === "upcoming" && countdown && countdown.days <= 3 && (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Starts in {countdown.days}d {countdown.hours}h
                  </span>
                )}
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <div className="flex items-center gap-1 text-xs text-dark-400">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Jun 11 – Jul 19, 2026</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-dark-400">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>🇺🇸 USA · 🇨🇦 Canada · 🇲🇽 Mexico</span>
                </div>
                {totalMatchCount > 0 && (
                  <div className="flex items-center gap-1 text-xs text-dark-500">
                    <span>{totalMatchCount} match{totalMatchCount !== 1 ? "es" : ""} available</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: countdown tiles + CTA */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            {/* Countdown tiles — shown only when upcoming and > 0 days */}
            {tournamentState === "upcoming" && countdown && countdown.days > 0 && (
              <div className="hidden sm:flex items-center gap-1.5">
                {[
                  { value: countdown.days, label: "days" },
                  { value: countdown.hours, label: "hrs" },
                  { value: countdown.minutes, label: "min" },
                ].map(({ value, label }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center bg-dark-800/60 border border-dark-700/50 rounded-lg px-2.5 py-1.5 min-w-[42px]"
                  >
                    <span className="text-base font-bold text-amber-400 tabular-nums leading-none">
                      {String(value).padStart(2, "0")}
                    </span>
                    <span className="text-[9px] text-dark-500 mt-0.5 uppercase tracking-wider">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={onViewMatches}
              className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-amber-950 transition-all text-sm font-bold whitespace-nowrap shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
            >
              <Trophy className="w-4 h-4" />
              <span>View Matches</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
