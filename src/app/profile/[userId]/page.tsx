"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Calendar,
  MessageSquare,
  Star,
  TrendingUp,
  Loader2,
  Settings,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import TeamActivityCard from "@/components/TeamActivityCard";
import { FavoriteTeam, TeamActivity } from "@/types";

interface PublicProfile {
  _id: string;
  username: string;
  avatar?: string;
  bio?: string;
  favoriteTeams: FavoriteTeam[];
  teamActivity: TeamActivity[];
  totalMessages: number;
  joinedAt: string;
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const userId = params.userId as string;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const isOwnProfile =
    session?.user && (session.user as any).id === userId;

  useEffect(() => {
    if (!userId) return;

    // If this is own profile, redirect to /profile
    if (isOwnProfile) {
      router.replace("/profile");
      return;
    }

    setIsLoading(true);
    fetch(`/api/profile/${userId}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setProfile(result.data);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [userId, isOwnProfile, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold text-dark-300">
          User not found
        </h2>
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Matches
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 bg-grid-pattern">
      {/* Header */}
      <div className="bg-dark-900 border-b border-dark-700/50">
        {/* Banner */}
        <div className="h-28 bg-gradient-to-br from-primary-600/20 via-primary-800/10 to-dark-900 relative">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <button
              onClick={() => router.back()}
              className="absolute top-4 left-4 flex items-center gap-2 text-dark-400 hover:text-white transition-colors text-sm bg-dark-900/50 backdrop-blur-sm px-3 py-1.5 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-end gap-4 -mt-10 pb-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-dark-800 border-4 border-dark-900 flex-shrink-0">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary-600/20">
                  <span className="text-2xl font-bold text-primary-400">
                    {profile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-xl font-bold text-white truncate">
                {profile.username}
              </h1>
              {profile.bio && (
                <p className="text-sm text-dark-400 mt-0.5 line-clamp-2">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-5 pb-4 text-xs text-dark-500">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{profile.totalMessages} messages</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                Joined {format(parseISO(profile.joinedAt), "MMMM yyyy")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Favorite Teams */}
        {profile.favoriteTeams && profile.favoriteTeams.length > 0 && (
          <section className="bg-dark-900 rounded-2xl border border-dark-700/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-dark-700/50 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-white">
                Favorite Teams
              </h2>
            </div>
            <div className="px-5 py-5">
              <div className="flex flex-wrap gap-2">
                {profile.favoriteTeams.map((team) => (
                  <div
                    key={team.teamId}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-dark-800/60 border border-dark-700/30"
                  >
                    {team.logo && (
                      <img
                        src={team.logo}
                        alt={team.name}
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium text-dark-200">
                        {team.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Top Active Chats */}
        {profile.teamActivity && profile.teamActivity.length > 0 && (
          <section className="bg-dark-900 rounded-2xl border border-dark-700/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-dark-700/50 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent-green" />
              <h2 className="text-sm font-semibold text-white">
                Most Active Chats
              </h2>
            </div>
            <div className="px-5 py-5">
              <TeamActivityCard
                activity={profile.teamActivity}
                isOwnProfile={false}
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
