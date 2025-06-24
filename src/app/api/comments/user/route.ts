import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/authOptions";

// GET: Fetch all comments for the authenticated user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { rows } = await sql`
      SELECT 
        c.id,
        c.place_id,
        c.place_name,
        c.place_address,
        c.comment_text,
        c.user_email,
        c.created_at,
        COALESCE(up.display_name, c.user_email) as display_name
      FROM comments c
      LEFT JOIN user_profiles up ON c.user_email = up.email
      WHERE c.user_email = ${session.user.email}
      ORDER BY c.created_at DESC
    `;
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, comment_text } = await req.json();
  
  if (!id || !comment_text) {
    return NextResponse.json({ error: "Missing id or comment_text" }, { status: 400 });
  }

  if (comment_text.trim().length === 0) {
    return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
  }

  if (comment_text.length > 1000) {
    return NextResponse.json({ error: "Comment too long (max 1000 characters)" }, { status: 400 });
  }

  try {
    // Check ownership
    const { rows } = await sql`SELECT user_email FROM comments WHERE id = ${id}`;
    if (!rows.length || rows[0].user_email !== session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update comment
    await sql`UPDATE comments SET comment_text = ${comment_text.trim()} WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    // Check ownership
    const { rows } = await sql`SELECT user_email FROM comments WHERE id = ${id}`;
    if (!rows.length || rows[0].user_email !== session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete comment
    await sql`DELETE FROM comments WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
} 