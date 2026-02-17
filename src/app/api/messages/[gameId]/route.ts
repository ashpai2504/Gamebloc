import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { MessageModel } from "@/lib/models";

export const dynamic = "force-dynamic";

// GET /api/messages/[gameId] - Fetch messages for a game
export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const { gameId } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const before = searchParams.get("before"); // cursor-based pagination

    await dbConnect();

    const query: any = { gameId };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const total = await MessageModel.countDocuments({ gameId });

    const messages = await MessageModel.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Reverse to get chronological order
    messages.reverse();

    return NextResponse.json({
      success: true,
      data: {
        messages: messages.map((msg) => ({
          _id: msg._id.toString(),
          gameId: msg.gameId,
          user: {
            _id: msg.userId.toString(),
            username: msg.username,
            avatar: msg.userAvatar,
          },
          content: msg.content,
          type: msg.type,
          createdAt: msg.createdAt.toISOString(),
        })),
        hasMore: total > (before ? messages.length : page * limit),
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/messages/[gameId] - Send a message (requires auth)
export async function POST(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "You must be signed in to send messages" },
        { status: 401 }
      );
    }

    const { gameId } = params;
    const body = await request.json();
    const { content, type = "text" } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Message content is required" },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { success: false, error: "Message too long (max 500 characters)" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = session.user as any;

    const message = await MessageModel.create({
      gameId,
      userId: user.id,
      username: user.username || user.name,
      userAvatar: user.avatar || user.image,
      content: content.trim(),
      type,
    });

    return NextResponse.json({
      success: true,
      data: {
        _id: message._id.toString(),
        gameId: message.gameId,
        user: {
          _id: message.userId.toString(),
          username: message.username,
          avatar: message.userAvatar,
        },
        content: message.content,
        type: message.type,
        createdAt: message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    );
  }
}
