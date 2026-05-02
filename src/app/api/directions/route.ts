import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const originLat = searchParams.get("originLat");
  const originLng = searchParams.get("originLng");
  const destLat = searchParams.get("destLat");
  const destLng = searchParams.get("destLng");

  console.log("Directions params:", { originLat, originLng, destLat, destLng });

  if (!originLat || !originLng || !destLat || !destLng) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    console.log("API Key exists:", !!apiKey);

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&key=${apiKey}&language=fr`;
    
    const res = await fetch(url);
    const data = await res.json();

    console.log("Google response status:", data.status);
    console.log("Google response:", JSON.stringify(data).slice(0, 200));

    if (data.status !== "OK") {
      throw new Error(`Directions API error: ${data.status}`);
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    return NextResponse.json({
      polyline: route.overview_polyline.points,
      distance: leg.distance.text,
      distanceValue: leg.distance.value,
      duration: leg.duration.text,
      durationValue: leg.duration.value,
    });

  } catch (error) {
    console.error("Directions error:", error);
    return NextResponse.json(
      { error: "Itinéraire introuvable", details: String(error) },
      { status: 500 }
    );
  }
}