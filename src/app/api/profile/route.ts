import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { UserModel, MessageModel } from "@/lib/models";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// ─── Helper: compute team activity from messages ────────────────────────────

async function computeTeamActivity(userId: string) {
  await dbConnect();

  // Get all unique gameIds this user has messaged in
  const messages = await MessageModel.find(
    { userId: new mongoose.Types.ObjectId(userId), type: "text" },
    { gameId: 1 }
  ).lean();

  // Count messages per gameId
  const gameCountMap: Record<string, number> = {};
  for (const msg of messages) {
    gameCountMap[msg.gameId] = (gameCountMap[msg.gameId] || 0) + 1;
  }

  // Fetch game data from ESPN to map gameId → teams
  // We'll fetch current games from our own API
  const gameIds = Object.keys(gameCountMap);
  if (gameIds.length === 0) return [];

  // Fetch all games from our games API (internal)
  let allGames: any[] = [];
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
    
    const res = await fetch(`${baseUrl}/api/games`, { 
      cache: "no-store",
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    
    const result = await res.json();
    if (result.success) {
      allGames = result.data.games;
    }
  } catch (error) {
    console.error("[Team Activity] Failed to fetch games:", error);
    // Return empty if fetch fails
  }

  // Build a map: gameId → { homeTeam, awayTeam }
  const gameMap: Record<string, any> = {};
  for (const g of allGames) {
    gameMap[g.id] = g;
  }

  // Count per team name (aggregate across all matches)
  const teamCounts: Record<string, { count: number; logo: string }> = {};

  for (const [gameId, msgCount] of Object.entries(gameCountMap)) {
    const game = gameMap[gameId];
    if (!game) continue;

    const homeName = game.homeTeam?.name;
    const awayName = game.awayTeam?.name;
    const homeLogo = game.homeTeam?.logo || "";
    const awayLogo = game.awayTeam?.logo || "";

    if (homeName) {
      if (!teamCounts[homeName]) teamCounts[homeName] = { count: 0, logo: homeLogo };
      teamCounts[homeName].count += msgCount;
    }
    if (awayName) {
      if (!teamCounts[awayName]) teamCounts[awayName] = { count: 0, logo: awayLogo };
      teamCounts[awayName].count += msgCount;
    }
  }

  // Sort by count desc, top 5
  return Object.entries(teamCounts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)
    .map(([teamName, data]) => ({
      teamName,
      teamLogo: data.logo,
      count: data.count,
    }));
}

// ─── GET /api/profile — Get own profile ─────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    await dbConnect();
    const userId = (session.user as any).id;
    const user = await UserModel.findById(userId).lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Ensure new fields exist (migration for existing users)
    if (!user.favoriteTeams) user.favoriteTeams = [];
    if (!user.hiddenActivityTeams) user.hiddenActivityTeams = [];
    if (!user.bio) user.bio = "";

    // Compute team activity (gracefully handle failures)
    let rawActivity: any[] = [];
    try {
      rawActivity = await computeTeamActivity(userId);
    } catch (error) {
      console.error("[Profile] Failed to compute team activity:", error);
    }
    
    const hiddenSet = new Set(user.hiddenActivityTeams || []);
    const teamActivity = rawActivity.map((ta) => ({
      ...ta,
      hidden: hiddenSet.has(ta.teamName),
    }));

    return NextResponse.json({
      success: true,
      data: {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        avatar: user.avatar || "",
        bio: user.bio || "",
        provider: user.provider,
        favoriteTeams: user.favoriteTeams || [],
        hiddenActivityTeams: user.hiddenActivityTeams || [],
        teamActivity,
        joinedAt: user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[Profile API] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// ─── PUT /api/profile — Update own profile ──────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    await dbConnect();
    const userId = (session.user as any).id;
    const body = await request.json();

    const updateFields: Record<string, any> = {};

    // Bio
    if (body.bio !== undefined) {
      if (typeof body.bio !== "string" || body.bio.length > 160) {
        return NextResponse.json(
          { success: false, error: "Bio must be 160 characters or less" },
          { status: 400 }
        );
      }
      updateFields.bio = body.bio;
    }

    // Username
    if (body.username !== undefined) {
      const username = body.username.trim();
      if (username.length < 3 || username.length > 20) {
        return NextResponse.json(
          { success: false, error: "Username must be 3-20 characters" },
          { status: 400 }
        );
      }
      // Check uniqueness
      const existing = await UserModel.findOne({
        username,
        _id: { $ne: userId },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: "Username is already taken" },
          { status: 409 }
        );
      }
      updateFields.username = username;
    }

    // Favorite teams (max 3)
    if (body.favoriteTeams !== undefined) {
      if (!Array.isArray(body.favoriteTeams) || body.favoriteTeams.length > 3) {
        return NextResponse.json(
          { success: false, error: "You can select up to 3 favorite teams" },
          { status: 400 }
        );
      }
      updateFields.favoriteTeams = body.favoriteTeams.map((t: any) => ({
        teamId: t.teamId || "",
        name: t.name || "",
        shortName: t.shortName || "",
        logo: t.logo || "",
      }));
    }

    // Hidden activity teams
    if (body.hiddenActivityTeams !== undefined) {
      if (!Array.isArray(body.hiddenActivityTeams)) {
        return NextResponse.json(
          { success: false, error: "Invalid hidden teams format" },
          { status: 400 }
        );
      }
      updateFields.hiddenActivityTeams = body.hiddenActivityTeams;
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: updatedUser._id.toString(),
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar || "",
        bio: updatedUser.bio || "",
        provider: updatedUser.provider,
        favoriteTeams: updatedUser.favoriteTeams || [],
        hiddenActivityTeams: updatedUser.hiddenActivityTeams || [],
      },
    });
  } catch (error) {
    console.error("[Profile API] PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
