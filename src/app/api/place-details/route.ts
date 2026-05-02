import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get("placeId");

  if (!placeId) {
    return NextResponse.json({ error: "Missing placeId" }, { status: 400 });
  }

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    const res = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?fields=location,addressComponents&languageCode=fr`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey!,
        },
      }
    );

    const data = await res.json();

    if (!data.location) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }

    const country =
      data.addressComponents?.find((c: { types: string[] }) =>
        c.types.includes("country")
      )?.longText ?? "";

    return NextResponse.json({
      lat: data.location.latitude,
      long: data.location.longitude,
      country,
    });
  } catch (error) {
    console.error("Place details error:", error);
    return NextResponse.json({ error: "Échec de récupération" }, { status: 500 });
  }
}
