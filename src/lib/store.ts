"use client";

import { create } from "zustand";
import { Game, SportType, Message } from "@/types";

// ---------- Game Store ----------
interface GameStore {
  selectedSport: SportType | "all";
  selectedLeagues: string[];
  selectedGame: Game | null;
  setSport: (sport: SportType | "all") => void;
  toggleLeague: (leagueId: string) => void;
  setSelectedGame: (game: Game | null) => void;
  clearFilters: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  selectedSport: "all",
  selectedLeagues: [],
  selectedGame: null,
  setSport: (sport) =>
    set({ selectedSport: sport, selectedLeagues: [] }),
  toggleLeague: (leagueId) =>
    set((state) => ({
      selectedLeagues: state.selectedLeagues.includes(leagueId)
        ? state.selectedLeagues.filter((id) => id !== leagueId)
        : [...state.selectedLeagues, leagueId],
    })),
  setSelectedGame: (game) => set({ selectedGame: game }),
  clearFilters: () => set({ selectedSport: "all", selectedLeagues: [] }),
}));

// ---------- Chat Store ----------
interface ChatStore {
  messages: Message[];
  activeUsers: number;
  typingUsers: string[];
  isLoadingMessages: boolean;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  setActiveUsers: (count: number) => void;
  addTypingUser: (username: string) => void;
  removeTypingUser: (username: string) => void;
  setLoadingMessages: (loading: boolean) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  activeUsers: 0,
  typingUsers: [],
  isLoadingMessages: false,
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  setMessages: (messages) => set({ messages }),
  setActiveUsers: (count) => set({ activeUsers: count }),
  addTypingUser: (username) =>
    set((state) => ({
      typingUsers: state.typingUsers.includes(username)
        ? state.typingUsers
        : [...state.typingUsers, username],
    })),
  removeTypingUser: (username) =>
    set((state) => ({
      typingUsers: state.typingUsers.filter((u) => u !== username),
    })),
  setLoadingMessages: (loading) => set({ isLoadingMessages: loading }),
  clearChat: () =>
    set({ messages: [], activeUsers: 0, typingUsers: [] }),
}));
