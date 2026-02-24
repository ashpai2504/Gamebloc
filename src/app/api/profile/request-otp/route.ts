import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { UserModel, OtpModel } from "@/lib/models";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// POST /api/profile/request-otp — Generate and "send" OTP for password change
// In production you'd email this; for now we store it and return a success message.

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
    await dbConnect();

    const user = await UserModel.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (user.provider === "google") {
      return NextResponse.json(
        { success: false, error: "Google accounts cannot change password" },
        { status: 400 }
      );
    }

    // Delete any existing OTPs for this user
    await OtpModel.deleteMany({ userId: user._id });

    // Generate 6-digit OTP
    const code = crypto.randomInt(100000, 999999).toString();

    await OtpModel.create({
      userId: user._id,
      code,
      purpose: "password_change",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // In production, send via email:
    // await sendEmail(user.email, "Your Gamebloc OTP", `Your code: ${code}`);
    console.log(`[OTP] Password change OTP for ${user.email}: ${code}`);

    return NextResponse.json({
      success: true,
      message: "OTP sent to your email address",
      // Include code in dev so you can test (remove in prod)
      ...(process.env.NODE_ENV !== "production" ? { _devCode: code } : {}),
    });
  } catch (error) {
    console.error("[Request OTP] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}
