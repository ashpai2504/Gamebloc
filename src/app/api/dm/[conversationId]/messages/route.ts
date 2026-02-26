import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { DMConversationModel, DMMessageModel } from "@/lib/models";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// GET /api/dm/[conversationId]/messages — paginated message history
export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { conversationId } = params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const before = searchParams.get("before");

    await dbConnect();

    // Verify the user is a participant
    const conversation = await DMConversationModel.findOne({
      _id: conversationId,
      participants: new mongoose.Types.ObjectId(userId),
    }).lean();

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    const query: any = {
      conversationId: new mongoose.Types.ObjectId(conversationId),
    };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await DMMessageModel.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    messages.reverse();

    // Mark incoming messages as read
    await DMMessageModel.updateMany(
      {
        conversationId: new mongoose.Types.ObjectId(conversationId),
        senderId: { $ne: new mongoose.Types.ObjectId(userId) },
        readBy: {
          $not: { $elemMatch: { $eq: new mongoose.Types.ObjectId(userId) } },
        },
      },
      { $push: { readBy: new mongoose.Types.ObjectId(userId) } }
    );

    return NextResponse.json({
      success: true,
      data: {
        messages: messages.map((msg) => ({
          _id: msg._id.toString(),
          conversationId: msg.conversationId.toString(),
          sender: {
            _id: msg.senderId.toString(),
            username: msg.senderUsername,
            avatar: msg.senderAvatar || undefined,
          },
          content: msg.content,
          createdAt: msg.createdAt.toISOString(),
          readBy: msg.readBy.map((id) => id.toString()),
        })),
        hasMore: messages.length === limit,
      },
    });
  } catch (error) {
    console.error("[DM] Error fetching messages:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/dm/[conversationId]/messages — send a DM
export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { conversationId } = params;
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Message content is required" },
        { status: 400 }
      );
    }
    if (content.length > 1000) {
      return NextResponse.json(
        { success: false, error: "Message is too long (max 1000 characters)" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify participant
    const conversation = await DMConversationModel.findOne({
      _id: conversationId,
      participants: new mongoose.Types.ObjectId(userId),
    }).lean();

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    const user = session.user as any;

    const message = await DMMessageModel.create({
      conversationId: new mongoose.Types.ObjectId(conversationId),
      senderId: new mongoose.Types.ObjectId(userId),
      senderUsername: user.username || user.name || "User",
      senderAvatar: user.avatar || user.image || "",
      content: content.trim(),
      readBy: [new mongoose.Types.ObjectId(userId)],
    });

    // Update conversation preview
    await DMConversationModel.findByIdAndUpdate(conversationId, {
      lastMessage: content.trim().substring(0, 100),
      lastMessageAt: new Date(),
      lastSenderId: new mongoose.Types.ObjectId(userId),
    });

    return NextResponse.json({
      success: true,
      data: {
        _id: message._id.toString(),
        conversationId: message.conversationId.toString(),
        sender: {
          _id: message.senderId.toString(),
          username: message.senderUsername,
          avatar: message.senderAvatar || undefined,
        },
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        readBy: message.readBy.map((id) => id.toString()),
      },
    });
  } catch (error) {
    console.error("[DM] Error sending message:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    );
  }
}
