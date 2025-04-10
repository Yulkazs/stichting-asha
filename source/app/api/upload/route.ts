import { NextResponse } from "next/server";
import connectDB from "../../lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    // Ensure database connection
    await connectDB();

    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authenticatie vereist" }, 
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Geen bestand ontvangen." }, { status: 400 });
    }

    // Read file as buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Return file details for database storage
    return NextResponse.json({ 
      filename: file.name,
      contentType: file.type,
      size: buffer.length,
      data: buffer.toString('base64'), // Convert to base64 for storage
      message: "Bestand gereed voor opslag"
    });
  } catch (err) {
    console.error("Upload fout:", err);
    return NextResponse.json({ 
      error: "Upload is mislukt.", 
      details: err instanceof Error ? err.message : 'Onbekende fout'
    }, { status: 500 });
  }
}