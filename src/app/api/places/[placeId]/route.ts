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

  // Request outdoorSeating field (and other basic fields)
  const fieldMask = [
    "id",
    "displayName",
    "formattedAddress",
    "types",
    "nationalPhoneNumber",
    "outdoorSeating"
  ].join(",");

  const res = await fetch(googleUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey!,
      "X-Goog-FieldMask": fieldMask
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

  // Scan reviews and editorialSummary for 'dog friendly' or 'pet friendly'
  let isDogFriendlyByGoogle = false;
  const keywords = ["dog friendly", "pet friendly", "dogs allowed", "pets allowed"];

  if (data.reviews && Array.isArray(data.reviews)) {
    for (const review of data.reviews) {
      const text = (review.text?.text || "").toLowerCase();
      if (keywords.some((kw) => text.includes(kw))) {
        isDogFriendlyByGoogle = true;
        break;
      }
    }
  }
  if (!isDogFriendlyByGoogle && data.editorialSummary?.text) {
    const summary = data.editorialSummary.text.toLowerCase();
    if (keywords.some((kw) => summary.includes(kw))) {
      isDogFriendlyByGoogle = true;
    }
  }

  return NextResponse.json({ ...data, isDogFriendlyByGoogle });
} 