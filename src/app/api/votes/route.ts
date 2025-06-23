import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/authOptions";

// POST: Submit a vote
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { place_id, place_name, place_address, vote_type, user_email, question_type } = await req.json();
  if (!place_id || !vote_type || !user_email || !question_type) {
    return NextResponse.json({ error: "Missing place_id, vote_type, user_email, or question_type" }, { status: 400 });
  }
  if (vote_type !== "yes" && vote_type !== "no") {
    return NextResponse.json({ error: "Invalid vote_type" }, { status: 400 });
  }
  if (question_type !== "dog" && question_type !== "pet") {
    return NextResponse.json({ error: "Invalid question_type" }, { status: 400 });
  }
  // Prevent duplicate votes by the same user for the same place and question
  const { rows } = await sql`SELECT id FROM votes WHERE place_id = ${place_id} AND user_email = ${user_email} AND question_type = ${question_type}`;
  if (rows.length > 0) {
    return NextResponse.json({ error: "You have already voted for this question at this place." }, { status: 409 });
  }
  await sql`
    INSERT INTO votes (place_id, place_name, place_address, vote_type, user_email, question_type)
    VALUES (${place_id}, ${place_name}, ${place_address}, ${vote_type}, ${user_email}, ${question_type})
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
  // Get counts for both questions
  const { rows } = await sql`SELECT question_type, vote_type, COUNT(*) as count FROM votes WHERE place_id = ${place_id} GROUP BY question_type, vote_type`;
  type VoteRow = { question_type: string; vote_type: string; count: string };
  const result = {
    dog: { yes: 0, no: 0 },
    pet: { yes: 0, no: 0 },
  };
  for (const row of rows as VoteRow[]) {
    if (row.question_type === "dog" && row.vote_type === "yes") result.dog.yes = Number(row.count);
    if (row.question_type === "dog" && row.vote_type === "no") result.dog.no = Number(row.count);
    if (row.question_type === "pet" && row.vote_type === "yes") result.pet.yes = Number(row.count);
    if (row.question_type === "pet" && row.vote_type === "no") result.pet.no = Number(row.count);
  }
  return NextResponse.json(result);
} 