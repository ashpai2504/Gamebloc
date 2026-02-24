import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { UserModel, MessageModel } from "@/lib/models";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// GET /api/profile/[userId] — Get public profile for any user

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await UserModel.findById(userId).lean();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Check if this is the requesting user's own profile
    const session = await getServerSession(authOptions);
    const isOwnProfile = session?.user && (session.user as any).id === userId;

    // Compute team activity
    const messages = await MessageModel.find(
      { userId: new mongoose.Types.ObjectId(userId), type: "text" },
      { gameId: 1 }
    ).lean();

    const gameCountMap: Record<string, number> = {};
    for (const msg of messages) {
      gameCountMap[msg.gameId] = (gameCountMap[msg.gameId] || 0) + 1;
    }

    let teamActivity: any[] = [];

    if (Object.keys(gameCountMap).length > 0) {
      let allGames: any[] = [];
      try {
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const res = await fetch(`${baseUrl}/api/games`, { cache: "no-store" });
        const result = await res.json();
        if (result.success) allGames = result.data.games;
      } catch {}

      const gameMap: Record<string, any> = {};
      for (const g of allGames) gameMap[g.id] = g;

      const teamCounts: Record<string, { count: number; logo: string }> = {};
      for (const [gameId, msgCount] of Object.entries(gameCountMap)) {
        const game = gameMap[gameId];
        if (!game) continue;
        for (const side of ["homeTeam", "awayTeam"] as const) {
          const name = game[side]?.name;
          const logo = game[side]?.logo || "";
          if (name) {
            if (!teamCounts[name]) teamCounts[name] = { count: 0, logo };
            teamCounts[name].count += msgCount;
          }
        }
      }

      const hiddenSet = new Set(user.hiddenActivityTeams || []);

      teamActivity = Object.entries(teamCounts)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 5)
        .map(([teamName, data]) => ({
          teamName,
          teamLogo: data.logo,
          count: data.count,
          hidden: hiddenSet.has(teamName),
        }))
        .filter((ta) => !ta.hidden || isOwnProfile); // Hide hidden ones from public
    }

    const totalMessages = messages.length;

    return NextResponse.json({
      success: true,
      data: {
        _id: user._id.toString(),
        username: user.username,
        avatar: user.avatar || "",
        bio: user.bio || "",
        favoriteTeams: user.favoriteTeams || [],
        teamActivity,
        totalMessages,
        joinedAt: user.createdAt.toISOString(),
        // Only expose private fields for own profile
        ...(isOwnProfile
          ? {
              email: user.email,
              provider: user.provider,
              hiddenActivityTeams: user.hiddenActivityTeams || [],
            }
          : {}),
      },
    });
  } catch (error) {
    console.error("[Profile API] GET /[userId] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
