"use client";

import { Search, X } from "lucide-react";
import { useGameStore } from "@/lib/store";

export default function TeamSearch() {
  const { teamSearch, setTeamSearch } = useGameStore();

  return (
    <div className="relative w-full sm:w-72">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500 pointer-events-none" />
      <input
        type="text"
        value={teamSearch}
        onChange={(e) => setTeamSearch(e.target.value)}
        placeholder="Search teams…"
        className="w-full pl-9 pr-8 py-2 bg-dark-800/50 border border-dark-700/50 rounded-xl text-sm text-dark-200 placeholder-dark-500 focus:outline-none focus:border-primary-500/50 focus:bg-dark-800 transition-all"
      />
      {teamSearch && (
        <button
          onClick={() => setTeamSearch("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
