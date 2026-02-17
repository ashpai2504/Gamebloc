"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Game, SportType } from "@/types";

interface UseGamesOptions {
  selectedLeagues?: string[];
  selectedSport?: SportType | "all";
  refreshInterval?: number; // in ms
}

export function useGames(options: UseGamesOptions = {}) {
  const {
    selectedLeagues,
    selectedSport = "all",
    refreshInterval = 60000,
  } = options;

  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchGames = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedLeagues && selectedLeagues.length > 0) {
        params.set("leagues", selectedLeagues.join(","));
      }

      const url = `/api/games${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        let filteredGames = result.data.games;

        // Client-side sport filter
        if (selectedSport !== "all") {
          filteredGames = filteredGames.filter(
            (g: Game) => g.sport === selectedSport
          );
        }

        setGames(filteredGames);
        setLastUpdated(result.data.lastUpdated);
        setError(null);
      } else {
        setError(result.error || "Failed to fetch games");
      }
    } catch (err) {
      setError("Failed to connect to server");
      console.error("Error fetching games:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedLeagues, selectedSport]);

  useEffect(() => {
    fetchGames();

    // Auto-refresh
    intervalRef.current = setInterval(fetchGames, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchGames, refreshInterval]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    fetchGames();
  }, [fetchGames]);

  // Categorize games
  const liveGames = games.filter(
    (g) => g.status === "live" || g.status === "halftime"
  );
  const scheduledGames = games.filter((g) => g.status === "scheduled");
  const finishedGames = games.filter((g) => g.status === "finished");

  return {
    games,
    liveGames,
    scheduledGames,
    finishedGames,
    isLoading,
    error,
    lastUpdated,
    refresh,
  };
}
