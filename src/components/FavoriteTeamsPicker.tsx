"use client";

import { useState, useMemo } from "react";
import { FavoriteTeam, ALL_LEAGUES } from "@/types";
import { Search, X, Heart, Star } from "lucide-react";

interface FavoriteTeamsPickerProps {
  selected: FavoriteTeam[];
  onChange: (teams: FavoriteTeam[]) => void;
  allTeams: { teamId: string; name: string; shortName: string; logo: string }[];
}

export default function FavoriteTeamsPicker({
  selected,
  onChange,
  allTeams,
}: FavoriteTeamsPickerProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return allTeams.slice(0, 20);
    return allTeams.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.shortName.toLowerCase().includes(q)
    );
  }, [search, allTeams]);

  const selectedIds = new Set(selected.map((t) => t.teamId));

  const toggleTeam = (team: (typeof allTeams)[0]) => {
    if (selectedIds.has(team.teamId)) {
      onChange(selected.filter((t) => t.teamId !== team.teamId));
    } else if (selected.length < 3) {
      onChange([...selected, team]);
    }
  };

  const removeTeam = (teamId: string) => {
    onChange(selected.filter((t) => t.teamId !== teamId));
  };

  return (
    <div>
      {/* Selected badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {selected.map((team, i) => (
          <div
            key={team.teamId}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg bg-dark-700/80 border border-dark-600/50 text-sm"
          >
            <div className="flex items-center gap-1.5">
              <Star className="w-3 h-3 text-amber-400" />
              {team.logo && (
                <img
                  src={team.logo}
                  alt={team.name}
                  className="w-5 h-5 object-contain rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <span className="text-dark-200 text-xs font-medium">
                {team.name}
              </span>
            </div>
            <button
              onClick={() => removeTeam(team.teamId)}
              className="p-1 rounded-md hover:bg-dark-600/50 text-dark-400 hover:text-red-400 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {selected.length < 3 && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-dark-600/50 text-xs text-dark-400 hover:text-primary-400 hover:border-primary-500/30 transition-colors"
          >
            <Heart className="w-3 h-3" />
            {selected.length === 0 ? "Add Favorite" : "Add More"}
            <span className="text-dark-600">({selected.length}/3)</span>
          </button>
        )}
      </div>

      {/* Search dropdown */}
      {isOpen && (
        <div className="bg-dark-800 border border-dark-700/50 rounded-xl overflow-hidden">
          {/* Search input */}
          <div className="relative border-b border-dark-700/50">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teams..."
              autoFocus
              className="w-full pl-10 pr-4 py-3 text-sm bg-transparent text-white placeholder-dark-500 focus:outline-none"
            />
          </div>

          {/* Team list */}
          <div className="max-h-52 overflow-y-auto scrollbar-thin">
            {filtered.length === 0 ? (
              <p className="text-center text-xs text-dark-500 py-6">
                No teams found
              </p>
            ) : (
              filtered.map((team) => {
                const isSelected = selectedIds.has(team.teamId);
                return (
                  <button
                    key={team.teamId}
                    onClick={() => {
                      toggleTeam(team);
                      if (!isSelected && selected.length >= 2) setIsOpen(false);
                    }}
                    disabled={!isSelected && selected.length >= 3}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      isSelected
                        ? "bg-primary-600/10 text-primary-300"
                        : "text-dark-200 hover:bg-dark-700/50"
                    } disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                    <div className="w-6 h-6 rounded-full bg-dark-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {team.logo ? (
                        <img
                          src={team.logo}
                          alt={team.name}
                          className="w-4 h-4 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-dark-400">
                          {team.shortName.slice(0, 2)}
                        </span>
                      )}
                    </div>
                    <span className="flex-1 text-left truncate">
                      {team.name}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] bg-primary-600/20 text-primary-400 px-2 py-0.5 rounded-full">
                        Selected
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Close */}
          <button
            onClick={() => setIsOpen(false)}
            className="w-full text-center text-xs text-dark-500 hover:text-dark-300 py-2.5 border-t border-dark-700/50 transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
