import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/authOptions";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  // Verify the requested email matches the authenticated user
  if (email !== session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { rows } = await sql`
      SELECT 
        id,
        place_id,
        place_name,
        place_address,
        vote_type,
        question_type,
        created_at
      FROM votes 
      WHERE user_email = ${email}
      ORDER BY created_at DESC
    `;
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch votes" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, vote_type } = await req.json();
  if (!id || (vote_type !== "yes" && vote_type !== "no")) {
    return NextResponse.json({ error: "Missing or invalid id/vote_type" }, { status: 400 });
  }
  // Check ownership
  const { rows } = await sql`SELECT user_email FROM votes WHERE id = ${id}`;
  if (!rows.length || rows[0].user_email !== session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Update vote
  await sql`UPDATE votes SET vote_type = ${vote_type} WHERE id = ${id}`;
  return NextResponse.json({ success: true });
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
  // Check ownership
  const { rows } = await sql`SELECT user_email FROM votes WHERE id = ${id}`;
  if (!rows.length || rows[0].user_email !== session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Delete vote
  await sql`DELETE FROM votes WHERE id = ${id}`;
  return NextResponse.json({ success: true });
} 