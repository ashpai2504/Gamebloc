import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { UserModel } from "@/lib/models";

export const dynamic = "force-dynamic";

// POST /api/profile/change-email — Update email (requires current password)

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const { newEmail } = await request.json();

    if (!newEmail || !newEmail.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Valid email is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if email is already in use
    const existing = await UserModel.findOne({
      email: newEmail.toLowerCase().trim(),
      _id: { $ne: userId },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "This email is already in use" },
        { status: 409 }
      );
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (user.provider === "google") {
      return NextResponse.json(
        { success: false, error: "Cannot change email for Google accounts" },
        { status: 400 }
      );
    }

    user.email = newEmail.toLowerCase().trim();
    await user.save();

    return NextResponse.json({
      success: true,
      data: { email: user.email },
    });
  } catch (error) {
    console.error("[Change Email] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to change email" },
      { status: 500 }
    );
  }
}
