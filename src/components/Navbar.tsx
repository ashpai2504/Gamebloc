"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Gamepad2,
  User,
  LogOut,
  MessageSquare,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const user = session?.user as any;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/95 backdrop-blur-md border-b border-dark-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Gamepad2 className="w-8 h-8 text-primary-500 group-hover:text-primary-400 transition-colors" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-green rounded-full animate-pulse-live" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              Gamebloc
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-dark-300 hover:text-white transition-colors text-sm font-medium"
            >
              Matches
            </Link>
            <div className="flex items-center gap-2 text-dark-500 text-xs">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Live Sports Chat</span>
            </div>
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {status === "loading" ? (
              <div className="w-8 h-8 rounded-full bg-dark-700 animate-pulse" />
            ) : session ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-600/50 transition-all"
                >
                  {user?.avatar || user?.image ? (
                    <img
                      src={user.avatar || user.image}
                      alt={user.username || user.name}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <User className="w-5 h-5 text-primary-400" />
                  )}
                  <span className="text-sm text-dark-200 hidden sm:inline">
                    {user?.username || user?.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-dark-400" />
                </button>

                {isProfileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsProfileOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-dark-800 border border-dark-600/50 rounded-xl shadow-xl z-50 overflow-hidden animate-slide-down">
                      <div className="px-4 py-3 border-b border-dark-700">
                        <p className="text-sm font-medium text-white">
                          {user?.username || user?.name}
                        </p>
                        <p className="text-xs text-dark-400 truncate">
                          {user?.email}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          signOut();
                          setIsProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-dark-700/50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => router.push("/auth")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-primary-600/25"
              >
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-dark-400 hover:text-white"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-dark-800/95 backdrop-blur-md border-t border-dark-700/50 animate-slide-down">
          <div className="px-4 py-3 space-y-2">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-dark-300 hover:text-white hover:bg-dark-700/50 transition-colors text-sm"
            >
              Matches
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
