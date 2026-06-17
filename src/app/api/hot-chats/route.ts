import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { MessageModel } from "@/lib/models";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/hot-chats — Ranks game chats by message volume in a recent window.
// Used by the World Cup "Hot Chats Today" rail. Includes finished matches —
// ranking is purely by how much a chat was talked in within the window.
//
// Query params:
//   hours    window size in hours (default 24, clamped 1–168)
//   limit    max chats to return (default 10, clamped 1–50)
//   gameIds  optional comma-separated list to scope the ranking to games the
//            caller can actually render (recommended). When omitted, ranks all.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const hours = Math.min(
      168,
      Math.max(1, parseInt(searchParams.get("hours") || "24") || 24)
    );
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "10") || 10)
    );
    const gameIds = (searchParams.get("gameIds") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    await dbConnect();

    const match: Record<string, unknown> = { createdAt: { $gte: since } };
    if (gameIds.length > 0) {
      match.gameId = { $in: gameIds };
    }

    const hotChats: { _id: string; count: number }[] =
      await MessageModel.aggregate([
        { $match: match },
        { $group: { _id: "$gameId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit },
      ]);

    return NextResponse.json({
      success: true,
      data: {
        hotChats: hotChats.map((h) => ({ gameId: h._id, count: h.count })),
        since: since.toISOString(),
        hours,
      },
    });
  } catch (error) {
    console.error("Error in /api/hot-chats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load hot chats" },
      { status: 500 }
    );
  }
}
