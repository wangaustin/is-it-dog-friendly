import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/authOptions";

// GET: Fetch user profile
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { rows } = await sql`
      SELECT display_name, email, created_at
      FROM user_profiles 
      WHERE email = ${session.user.email}
    `;
    
    if (rows.length === 0) {
      // Create profile if it doesn't exist
      await sql`
        INSERT INTO user_profiles (email, display_name, created_at)
        VALUES (${session.user.email}, ${session.user.name || session.user.email.split('@')[0]}, NOW())
      `;
      
      return NextResponse.json({
        display_name: session.user.name || session.user.email.split('@')[0],
        email: session.user.email
      });
    }
    
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PATCH: Update user profile
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { display_name } = await req.json();
  
  if (!display_name || display_name.trim().length === 0) {
    return NextResponse.json({ error: "Display name cannot be empty" }, { status: 400 });
  }

  if (display_name.length > 50) {
    return NextResponse.json({ error: "Display name too long (max 50 characters)" }, { status: 400 });
  }

  try {
    const { rows } = await sql`
      UPDATE user_profiles 
      SET display_name = ${display_name.trim()}
      WHERE email = ${session.user.email}
      RETURNING display_name, email
    `;
    
    if (rows.length === 0) {
      // Create profile if it doesn't exist
      await sql`
        INSERT INTO user_profiles (email, display_name, created_at)
        VALUES (${session.user.email}, ${display_name.trim()}, NOW())
      `;
    }
    
    return NextResponse.json({ 
      display_name: display_name.trim(), 
      email: session.user.email 
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
} 