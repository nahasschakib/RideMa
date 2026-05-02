import { NextRequest, NextResponse } from "next/server";

interface Prediction {
  placePrediction: {
    placeId: string;
    text: { text: string };
    structuredFormat: {
      mainText: { text: string };
      secondaryText: { text: string };
      placeId: string;
      name:string;
      city?:string;
      state?:string;
      country?:string;
      countryCode?:string;
      lat:number;
      long:number;
       description: string;
        };
  };
}

interface PlacesResponse {
  suggestions: Prediction[];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");
  const language = searchParams.get("language") || "fr";
  const limit = Number(searchParams.get("limit")) || 5;

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    // ✅ Nouveau endpoint Places API (New)
    const res = await fetch(
      `https://places.googleapis.com/v1/places:autocomplete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey!,
        },
        body: JSON.stringify({
          input: query,
          languageCode: language,
          includedRegionCodes: ["ma"], // Limité au Maroc
        }),
      }
    );

    const data: PlacesResponse = await res.json();

    if (!data.suggestions) {
      return NextResponse.json({ predictions: [] });
    }

    const predictions = data.suggestions
      .slice(0, limit)
      .map((s) => ({
        placeId: s.placePrediction.placeId,
        description: s.placePrediction.text.text,
        mainText: s.placePrediction.structuredFormat.mainText.text,
        secondaryText: s.placePrediction.structuredFormat.secondaryText?.text ?? "",
      }));

    return NextResponse.json({ predictions });

  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Recherche échouée" },
      { status: 500 }
    );
  }
}