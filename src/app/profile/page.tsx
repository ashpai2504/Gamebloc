"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Loader2,
  Save,
  Calendar,
  MessageSquare,
  Star,
  TrendingUp,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Shield,
  Pen,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { FavoriteTeam, TeamActivity, UserProfile } from "@/types";
import FavoriteTeamsPicker from "@/components/FavoriteTeamsPicker";
import TeamActivityCard from "@/components/TeamActivityCard";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allTeams, setAllTeams] = useState<
    { teamId: string; name: string; shortName: string; logo: string }[]
  >([]);

  // Editable fields
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [favoriteTeams, setFavoriteTeams] = useState<FavoriteTeam[]>([]);
  const [hiddenTeams, setHiddenTeams] = useState<string[]>([]);

  // Email change
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // Password change
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [saveLoading, setSaveLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth?callbackUrl=/profile");
    }
  }, [status, router]);

  // Fetch profile data
  useEffect(() => {
    if (status !== "authenticated") return;

    setIsLoading(true);
    fetch("/api/profile")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          const p = result.data;
          setProfile(p);
          setUsername(p.username);
          setBio(p.bio || "");
          setFavoriteTeams(p.favoriteTeams || []);
          setHiddenTeams(p.hiddenActivityTeams || []);
        } else {
          console.error("[Profile] API error:", result.error);
          toast.error(result.error || "Failed to load profile");
        }
      })
      .catch((error) => {
        console.error("[Profile] Network error:", error);
        toast.error("Failed to connect to server");
      })
      .finally(() => setIsLoading(false));
  }, [status]);

  // Fetch available teams from games API
  useEffect(() => {
    fetch("/api/games")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          const teamMap = new Map<
            string,
            { teamId: string; name: string; shortName: string; logo: string }
          >();
          for (const game of result.data.games) {
            for (const side of ["homeTeam", "awayTeam"] as const) {
              const t = game[side];
              if (t && t.name && !teamMap.has(t.id)) {
                teamMap.set(t.id, {
                  teamId: t.id,
                  name: t.name,
                  shortName: t.shortName,
                  logo: t.logo,
                });
              }
            }
          }
          setAllTeams(
            Array.from(teamMap.values()).sort((a, b) =>
              a.name.localeCompare(b.name)
            )
          );
        }
      })
      .catch(console.error);
  }, []);

  // Track changes
  useEffect(() => {
    if (!profile) return;
    const changed =
      username !== profile.username ||
      bio !== (profile.bio || "") ||
      JSON.stringify(favoriteTeams) !==
        JSON.stringify(profile.favoriteTeams || []) ||
      JSON.stringify(hiddenTeams) !==
        JSON.stringify(profile.hiddenActivityTeams || []);
    setHasChanges(changed);
  }, [username, bio, favoriteTeams, hiddenTeams, profile]);

  // Save profile
  const handleSave = async () => {
    setSaveLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          bio,
          favoriteTeams,
          hiddenActivityTeams: hiddenTeams,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Profile updated!");
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                username,
                bio,
                favoriteTeams,
                hiddenActivityTeams: hiddenTeams,
              }
            : prev
        );
        setHasChanges(false);
      } else {
        toast.error(result.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaveLoading(false);
    }
  };

  // Change email
  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    setEmailLoading(true);
    try {
      const res = await fetch("/api/profile/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Email updated successfully!");
        setProfile((prev) => (prev ? { ...prev, email: newEmail } : prev));
        setShowEmailChange(false);
        setNewEmail("");
      } else {
        toast.error(result.error || "Failed to change email");
      }
    } catch {
      toast.error("Failed to change email");
    } finally {
      setEmailLoading(false);
    }
  };

  // Request OTP
  const handleRequestOtp = async () => {
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/profile/request-otp", {
        method: "POST",
      });
      const result = await res.json();
      if (result.success) {
        setOtpSent(true);
        if (result._devCode) setDevOtp(result._devCode);
        toast.success("OTP sent to your email!");
      } else {
        toast.error(result.error || "Failed to send OTP");
      }
    } catch {
      toast.error("Failed to send OTP");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (!otpCode) {
      toast.error("Enter the OTP code");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: otpCode, newPassword }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Password changed successfully!");
        setShowPasswordChange(false);
        setOtpSent(false);
        setOtpCode("");
        setDevOtp("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(result.error || "Failed to change password");
      }
    } catch {
      toast.error("Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Toggle hide team activity
  const handleToggleHideTeam = (teamName: string) => {
    setHiddenTeams((prev) =>
      prev.includes(teamName)
        ? prev.filter((t) => t !== teamName)
        : [...prev, teamName]
    );
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-dark-400">Failed to load profile</p>
      </div>
    );
  }

  const isCredentials = profile.provider === "credentials";
  const activityWithHidden = (profile.teamActivity || []).map((ta) => ({
    ...ta,
    hidden: hiddenTeams.includes(ta.teamName),
  }));

  return (
    <div className="min-h-screen bg-dark-950 bg-grid-pattern">
      {/* Header */}
      <div className="bg-dark-900 border-b border-dark-700/50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Matches</span>
          </button>

          {/* Profile header */}
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-dark-800 border-2 border-dark-700/50 flex-shrink-0">
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

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white truncate">
                {profile.username}
              </h1>
              {profile.bio && (
                <p className="text-sm text-dark-400 mt-0.5">{profile.bio}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-dark-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Joined {format(parseISO(profile.joinedAt), "MMMM yyyy")}
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  {profile.provider === "google" ? "Google" : "Email"}
                </div>
              </div>
            </div>

            {/* Save button */}
            {hasChanges && (
              <button
                onClick={handleSave}
                disabled={saveLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-all disabled:opacity-50 flex-shrink-0"
              >
                {saveLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ── Edit Profile ── */}
        <section className="bg-dark-900 rounded-2xl border border-dark-700/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-dark-700/50 flex items-center gap-2">
            <Pen className="w-4 h-4 text-primary-400" />
            <h2 className="text-sm font-semibold text-white">Edit Profile</h2>
          </div>
          <div className="px-5 py-5 space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-medium text-dark-400 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={20}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-800 border border-dark-700/50 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-medium text-dark-400 mb-1.5">
                Bio
                <span className="text-dark-600 ml-1">
                  ({bio.length}/160)
                </span>
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={160}
                rows={2}
                placeholder="Tell us about yourself..."
                className="w-full px-4 py-2.5 rounded-xl bg-dark-800 border border-dark-700/50 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all resize-none"
              />
            </div>
          </div>
        </section>

        {/* ── Favorite Teams ── */}
        <section className="bg-dark-900 rounded-2xl border border-dark-700/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-dark-700/50 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">
              Favorite Teams
            </h2>
            <span className="text-[10px] text-dark-500 bg-dark-800 px-2 py-0.5 rounded-full">
              Select up to 3
            </span>
          </div>
          <div className="px-5 py-5">
            <FavoriteTeamsPicker
              selected={favoriteTeams}
              onChange={setFavoriteTeams}
              allTeams={allTeams}
            />
          </div>
        </section>

        {/* ── Top Active Team Chats ── */}
        <section className="bg-dark-900 rounded-2xl border border-dark-700/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-dark-700/50 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent-green" />
            <h2 className="text-sm font-semibold text-white">
              Top Active Team Chats
            </h2>
            <span className="text-[10px] text-dark-500 bg-dark-800 px-2 py-0.5 rounded-full">
              Auto-detected
            </span>
          </div>
          <div className="px-5 py-5">
            <p className="text-xs text-dark-500 mb-3">
              Based on your chat activity across all matches. You can hide
              individual teams from your public profile.
            </p>
            <TeamActivityCard
              activity={activityWithHidden}
              isOwnProfile={true}
              onToggleHide={handleToggleHideTeam}
            />
          </div>
        </section>

        {/* ── Account Settings ── */}
        <section className="bg-dark-900 rounded-2xl border border-dark-700/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-dark-700/50 flex items-center gap-2">
            <Shield className="w-4 h-4 text-dark-400" />
            <h2 className="text-sm font-semibold text-white">
              Account Settings
            </h2>
          </div>
          <div className="divide-y divide-dark-700/50">
            {/* Email */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-dark-800 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-dark-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white">{profile.email}</p>
                    <p className="text-[11px] text-dark-500">Email address</p>
                  </div>
                </div>
                {isCredentials && (
                  <button
                    onClick={() => setShowEmailChange(!showEmailChange)}
                    className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    Change
                  </button>
                )}
              </div>

              {showEmailChange && (
                <div className="mt-3 pl-12 space-y-2 animate-slide-up">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="New email address"
                    className="w-full px-4 py-2.5 rounded-xl bg-dark-800 border border-dark-700/50 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500/50 transition-all"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleChangeEmail}
                      disabled={emailLoading}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-medium transition-all disabled:opacity-50"
                    >
                      {emailLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      Confirm
                    </button>
                    <button
                      onClick={() => {
                        setShowEmailChange(false);
                        setNewEmail("");
                      }}
                      className="px-4 py-2 rounded-lg text-dark-400 hover:text-white text-xs transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Password */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-dark-800 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-dark-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white">Password</p>
                    <p className="text-[11px] text-dark-500">
                      {isCredentials
                        ? "Change via OTP verification"
                        : "Managed by Google"}
                    </p>
                  </div>
                </div>
                {isCredentials && (
                  <button
                    onClick={() =>
                      setShowPasswordChange(!showPasswordChange)
                    }
                    className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    Change
                  </button>
                )}
              </div>

              {showPasswordChange && isCredentials && (
                <div className="mt-3 pl-12 space-y-3 animate-slide-up">
                  {!otpSent ? (
                    <>
                      <p className="text-xs text-dark-400">
                        We&apos;ll send a verification code to your email to
                        confirm the password change.
                      </p>
                      <button
                        onClick={handleRequestOtp}
                        disabled={passwordLoading}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-medium transition-all disabled:opacity-50"
                      >
                        {passwordLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Mail className="w-3 h-3" />
                        )}
                        Send OTP
                      </button>
                    </>
                  ) : (
                    <>
                      {devOtp && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          Dev mode OTP: <strong>{devOtp}</strong>
                        </div>
                      )}
                      <input
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        className="w-full px-4 py-2.5 rounded-xl bg-dark-800 border border-dark-700/50 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500/50 transition-all tracking-widest text-center font-mono"
                      />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password (min 6 chars)"
                        className="w-full px-4 py-2.5 rounded-xl bg-dark-800 border border-dark-700/50 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500/50 transition-all"
                      />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full px-4 py-2.5 rounded-xl bg-dark-800 border border-dark-700/50 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500/50 transition-all"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleChangePassword}
                          disabled={passwordLoading}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-medium transition-all disabled:opacity-50"
                        >
                          {passwordLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          Change Password
                        </button>
                        <button
                          onClick={() => {
                            setShowPasswordChange(false);
                            setOtpSent(false);
                            setOtpCode("");
                            setDevOtp("");
                            setNewPassword("");
                            setConfirmPassword("");
                          }}
                          className="px-4 py-2 rounded-lg text-dark-400 hover:text-white text-xs transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
