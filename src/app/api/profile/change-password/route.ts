import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { UserModel, OtpModel } from "@/lib/models";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

// POST /api/profile/change-password — Verify OTP and change password

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
    const { otp, newPassword } = await request.json();

    if (!otp || !newPassword) {
      return NextResponse.json(
        { success: false, error: "OTP and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

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

    // Verify OTP
    const otpRecord = await OtpModel.findOne({
      userId: user._id,
      code: otp.trim(),
      purpose: "password_change",
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    // Clean up used OTP
    await OtpModel.deleteMany({ userId: user._id });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("[Change Password] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to change password" },
      { status: 500 }
    );
  }
}
