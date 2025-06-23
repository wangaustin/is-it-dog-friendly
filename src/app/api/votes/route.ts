import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// POST: Submit a vote
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { place_id, place_name, place_address, vote_type, user_email } = await req.json();
  if (!place_id || !vote_type || !user_email) {
    return NextResponse.json({ error: "Missing place_id, vote_type, or user_email" }, { status: 400 });
  }
  if (vote_type !== "yes" && vote_type !== "no") {
    return NextResponse.json({ error: "Invalid vote_type" }, { status: 400 });
  }
  // Prevent duplicate votes by the same user for the same place
  const { rows } = await sql`SELECT id FROM votes WHERE place_id = ${place_id} AND user_email = ${user_email}`;
  if (rows.length > 0) {
    return NextResponse.json({ error: "You have already voted for this place." }, { status: 409 });
  }
  await sql`
    INSERT INTO votes (place_id, place_name, place_address, vote_type, user_email)
    VALUES (${place_id}, ${place_name}, ${place_address}, ${vote_type}, ${user_email})
  `;
  return NextResponse.json({ success: true });
}

// GET: Fetch vote counts for a place
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const place_id = searchParams.get("place_id");
  if (!place_id) {
    return NextResponse.json({ error: "Missing place_id" }, { status: 400 });
  }
  const { rows } = await sql`SELECT vote_type, COUNT(*) as count FROM votes WHERE place_id = ${place_id} GROUP BY vote_type`;
  type VoteRow = { vote_type: string; count: string };
  let yes = 0;
  let no = 0;
  for (const row of rows as VoteRow[]) {
    if (row.vote_type === "yes") yes = Number(row.count);
    if (row.vote_type === "no") no = Number(row.count);
  }
  return NextResponse.json({ yes, no });
} 