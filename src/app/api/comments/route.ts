import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/authOptions";

// POST: Create a new comment
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { place_id, place_name, place_address, comment_text } = await req.json();
  
  if (!place_id || !comment_text || !place_name || !place_address) {
    return NextResponse.json({ 
      error: "Missing place_id, place_name, place_address, or comment_text" 
    }, { status: 400 });
  }

  if (comment_text.trim().length === 0) {
    return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
  }

  if (comment_text.length > 1000) {
    return NextResponse.json({ error: "Comment too long (max 1000 characters)" }, { status: 400 });
  }

  try {
    await sql`
      INSERT INTO comments (place_id, place_name, place_address, comment_text, user_email)
      VALUES (${place_id}, ${place_name}, ${place_address}, ${comment_text.trim()}, ${session.user.email})
    `;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

// GET: Fetch comments for a place
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const place_id = searchParams.get("place_id");
  
  if (!place_id) {
    return NextResponse.json({ error: "Missing place_id" }, { status: 400 });
  }

  try {
    const { rows } = await sql`
      SELECT 
        c.id,
        c.place_id,
        c.comment_text,
        c.user_email,
        c.created_at,
        COALESCE(up.display_name, c.user_email) as display_name
      FROM comments c
      LEFT JOIN user_profiles up ON c.user_email = up.email
      WHERE c.place_id = ${place_id}
      ORDER BY c.created_at DESC
    `;
    
    // Add user info for display
    const commentsWithUserInfo = rows.map(comment => ({
      ...comment,
      isOwnComment: session?.user?.email === comment.user_email
    }));
    
    return NextResponse.json(commentsWithUserInfo);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
} 