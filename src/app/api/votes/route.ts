import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

// POST: Submit a vote
export async function POST(req: NextRequest) {
  const { place_id, place_name, place_address, vote_type } = await req.json();
  if (!place_id || !vote_type) {
    return NextResponse.json({ error: "Missing place_id or vote_type" }, { status: 400 });
  }
  if (vote_type !== "yes" && vote_type !== "no") {
    return NextResponse.json({ error: "Invalid vote_type" }, { status: 400 });
  }
  await sql`
    INSERT INTO votes (place_id, place_name, place_address, vote_type)
    VALUES (${place_id}, ${place_name}, ${place_address}, ${vote_type})
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
  const { rows } = await sql`
    SELECT vote_type, COUNT(*) as count
    FROM votes
    WHERE place_id = ${place_id}
    GROUP BY vote_type
  `;
  const result = { yes: 0, no: 0 };
  for (const row of rows as any[]) {
    if (row.vote_type === "yes") result.yes = Number(row.count);
    if (row.vote_type === "no") result.no = Number(row.count);
  }
  return NextResponse.json(result);
} 