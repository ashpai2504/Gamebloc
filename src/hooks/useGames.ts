"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Game, SportType } from "@/types";

interface UseGamesOptions {
  selectedLeagues?: string[];
  selectedSport?: SportType | "all";
  refreshInterval?: number; // in ms
}

function buildGamesUrl(selectedLeagues: string[] | undefined, quick: boolean) {
  const params = new URLSearchParams();
  if (selectedLeagues && selectedLeagues.length > 0) {
    params.set("leagues", selectedLeagues.join(","));
  }
  if (quick) params.set("quick", "1");
  const s = params.toString();
  return s ? `/api/games?${s}` : "/api/games";
}

export function useGames(options: UseGamesOptions = {}) {
  const {
    selectedLeagues,
    selectedSport = "all",
    refreshInterval = 5 * 60 * 1000,
  } = options;

  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isFetchingRef = useRef(false);

  const filterBySport = useCallback(
    (list: Game[]) => {
      if (selectedSport === "all") return list;
      return list.filter((g) => g.sport === selectedSport);
    },
    [selectedSport]
  );

  const applyGamesPayload = useCallback(
    (rawGames: Game[]) => {
      setGames(filterBySport(rawGames));
    },
    [filterBySport]
  );

  const fetchGamesFull = useCallback(
    async (signal: AbortSignal) => {
      const url = buildGamesUrl(selectedLeagues, false);
      const response = await fetch(url, { signal });
      const result = await response.json();

      if (result.success) {
        applyGamesPayload(result.data.games);
        setLastUpdated(result.data.lastUpdated);
        setError(null);
      } else {
        setError(result.error || "Failed to fetch games");
      }
    },
    [selectedLeagues, applyGamesPayload]
  );

  const fetchGamesInitial = useCallback(
    (signal: AbortSignal) => {
      const quickUrl = buildGamesUrl(selectedLeagues, true);
      const fullUrl = buildGamesUrl(selectedLeagues, false);

      let fullSettled = false;
      let fullSuccess = false;

      const quickPromise = fetch(quickUrl, { signal })
        .then((r) => r.json())
        .then(
          (result: {
            success?: boolean;
            data?: { games: Game[]; lastUpdated?: string };
          }) => {
          if (!result?.success || !result.data?.games) return;
          if (fullSettled && fullSuccess) return;
          applyGamesPayload(result.data.games);
          setLastUpdated(result.data.lastUpdated ?? null);
          if (!fullSettled) {
            setError(null);
            setIsLoading(false);
          }
        })
        .catch(() => {});

      const fullPromise = fetch(fullUrl, { signal })
        .then((r) => r.json())
        .then(
          (result: {
            success?: boolean;
            error?: string;
            data?: { games: Game[]; lastUpdated?: string };
          }) => {
            fullSettled = true;
            fullSuccess = !!result?.success;
            if (result?.success && result.data?.games) {
              applyGamesPayload(result.data.games);
              setLastUpdated(result.data.lastUpdated ?? null);
              setError(null);
            } else if (!result?.success) {
              setError(result?.error || "Failed to fetch games");
            }
          }
        )
        .catch((err: { name?: string }) => {
          fullSettled = true;
          fullSuccess = false;
          if (err?.name !== "AbortError") {
            setError("Failed to connect to server");
          }
        })
        .finally(() => {
          setIsLoading(false);
          isFetchingRef.current = false;
        });

      return Promise.allSettled([quickPromise, fullPromise]);
    },
    [selectedLeagues, applyGamesPayload]
  );

  const fetchGames = useCallback(
    async (force = false, mode: "initial" | "refresh" = "refresh") => {
      if (isFetchingRef.current && !force) return;

      if (abortRef.current) {
        abortRef.current.abort();
      }

      const controller = new AbortController();
      abortRef.current = controller;
      isFetchingRef.current = true;

      if (mode === "refresh") {
        setIsLoading(true);
        try {
          await fetchGamesFull(controller.signal);
        } catch (err: unknown) {
          const e = err as { name?: string };
          if (e?.name !== "AbortError") {
            setError("Failed to connect to server");
            console.error("Error fetching games:", err);
          }
        } finally {
          isFetchingRef.current = false;
          setIsLoading(false);
        }
        return;
      }

      // initial: quick + full in parallel
      setIsLoading(true);
      setError(null);
      await fetchGamesInitial(controller.signal);
    },
    [fetchGamesFull, fetchGamesInitial]
  );

  useEffect(() => {
    fetchGames(true, "initial");

    intervalRef.current = setInterval(() => {
      fetchGames(true, "refresh");
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [fetchGames, refreshInterval]);

  const refresh = useCallback(() => {
    fetchGames(true, "refresh");
  }, [fetchGames]);

  const { liveGames, scheduledGames, finishedGames } = useMemo(() => {
    const live = games.filter((g) => g.status === "live" || g.status === "halftime");
    const scheduled = games.filter((g) => g.status === "scheduled");
    const finished = games.filter((g) => g.status === "finished");
    return {
      liveGames: live,
      scheduledGames: scheduled,
      finishedGames: finished,
    };
  }, [games]);

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
