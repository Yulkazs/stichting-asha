import { NextResponse } from "next/server";
import dbConnect from "../../../lib/mongodb";
import User from "../../../lib/models/User";
import PasswordReset from "../../../lib/models/PasswordReset";
import { hash } from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token en wachtwoord zijn verplicht" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find the token record
    const resetRequest = await PasswordReset.findOne({
      token,
      used: false,
      expires: { $gt: new Date() }
    });

    if (!resetRequest) {
      return NextResponse.json(
        { error: "Ongeldige of verlopen token" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await hash(password, 12);

    // Update the user's password
    const user = await User.findOneAndUpdate(
      { email: resetRequest.email },
      { password: hashedPassword }
    );

    if (!user) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden" },
        { status: 404 }
      );
    }

    // Mark the token as used
    resetRequest.used = true;
    await resetRequest.save();

    // Record activity
    try {
      const { recordActivity } = await import('../../../lib/utils/activityUtils');
      await recordActivity({
        type: 'update',
        entityType: 'user',
        entityId: user._id,
        entityName: user.name || user.email,
        performedBy: user._id,
        performedByName: user.name || user.email
      });
    } catch (err) {
      console.error("Failed to record password reset activity:", err);
      // Continue with the password reset even if activity logging fails
    }

    return NextResponse.json({ 
      success: true,
      message: "Wachtwoord is succesvol gereset" 
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Er is iets misgegaan. Probeer het later opnieuw." },
      { status: 500 }
    );
  }
}