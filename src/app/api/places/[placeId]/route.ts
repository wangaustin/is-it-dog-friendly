import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Extract placeId from the URL path
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const placeId = segments[segments.length - 1];

  if (!placeId) {
    return NextResponse.json({ error: "Place ID is required" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const googleUrl = `https://places.googleapis.com/v1/places/${placeId}`;

  const res = await fetch(googleUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey!,
      "X-Goog-FieldMask": "id,displayName,formattedAddress"
    },
  });

  if (!res.ok) {
    const error = await res.json();
    console.error("Google Places API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch place details" },
      { status: 500 }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
} 