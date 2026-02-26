import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { DMConversationModel, DMMessageModel, UserModel } from "@/lib/models";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// GET /api/dm/conversations — all conversations for current user
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    await dbConnect();

    const conversations = await DMConversationModel.find({
      participants: new mongoose.Types.ObjectId(userId),
    })
      .sort({ lastMessageAt: -1 })
      .lean();

    if (conversations.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Collect all other participant IDs
    const otherIds = [
      ...new Set(
        conversations
          .flatMap((c) => c.participants.map((p) => p.toString()))
          .filter((id) => id !== userId)
      ),
    ];

    const users = await UserModel.find({ _id: { $in: otherIds } })
      .select("_id username avatar")
      .lean();

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    // Get unread counts in one aggregation
    const unreadAgg = await DMMessageModel.aggregate([
      {
        $match: {
          conversationId: { $in: conversations.map((c) => c._id) },
          senderId: { $ne: new mongoose.Types.ObjectId(userId) },
          readBy: { $not: { $elemMatch: { $eq: new mongoose.Types.ObjectId(userId) } } },
        },
      },
      { $group: { _id: "$conversationId", count: { $sum: 1 } } },
    ]);

    const unreadMap = new Map(
      unreadAgg.map((r) => [r._id.toString(), r.count])
    );

    const result = conversations.map((conv) => {
      const otherParticipants = conv.participants
        .filter((p) => p.toString() !== userId)
        .map((p) => {
          const u = userMap.get(p.toString());
          return {
            _id: p.toString(),
            username: u?.username || "Unknown",
            avatar: u?.avatar || undefined,
          };
        });

      return {
        _id: conv._id.toString(),
        participants: otherParticipants,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt?.toISOString(),
        lastSenderId: conv.lastSenderId?.toString(),
        unreadCount: unreadMap.get(conv._id.toString()) || 0,
        createdAt: (conv as any).createdAt?.toISOString(),
      };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[DM] Error fetching conversations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// POST /api/dm/conversations — create or retrieve a 1-on-1 conversation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { targetUserId } = await request.json();

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: "targetUserId is required" },
        { status: 400 }
      );
    }
    if (targetUserId === userId) {
      return NextResponse.json(
        { success: false, error: "Cannot start a conversation with yourself" },
        { status: 400 }
      );
    }

    await dbConnect();

    const targetUser = await UserModel.findById(targetUserId)
      .select("_id username avatar")
      .lean();

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Sorted key for uniqueness
    const key = [userId, targetUserId].sort().join("_");
    const currentUserObjId = new mongoose.Types.ObjectId(userId);
    const targetUserObjId = new mongoose.Types.ObjectId(targetUserId);

    const conversation = await DMConversationModel.findOneAndUpdate(
      { key },
      {
        $setOnInsert: {
          participants: [currentUserObjId, targetUserObjId],
          lastMessageAt: new Date(),
        },
      },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json({
      success: true,
      data: {
        _id: conversation._id.toString(),
        participants: [
          {
            _id: targetUser._id.toString(),
            username: targetUser.username,
            avatar: targetUser.avatar || undefined,
          },
        ],
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt?.toISOString(),
        lastSenderId: conversation.lastSenderId?.toString(),
        unreadCount: 0,
        createdAt: (conversation as any).createdAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error("[DM] Error creating conversation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
