import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get("input");

  if (!input) {
    return NextResponse.json(
      { error: "Input is required" },
      { status: 400 }
    );
  }

  const url = "https://places.googleapis.com/v1/places:autocomplete";
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey!,
    },
    body: JSON.stringify({
      input,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    console.error("Google Places API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
} 