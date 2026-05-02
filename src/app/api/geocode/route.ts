// src/app/api/geocode/route.ts

import { NextRequest, NextResponse } from "next/server";

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GeocodeResult {
  types: string[];
  address_components: AddressComponent[];
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface GeocodeResponse {
  status: string;
  results: GeocodeResult[];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing lat/lon" }, { status: 400 });
  }

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}&language=fr`
    );

    const data: GeocodeResponse = await res.json();

    if (data.status !== "OK") {
      throw new Error(`Google API error: ${data.status}`);
    }

    const bestResult =
      data.results.find(
        (r: GeocodeResult) =>
          r.types?.includes("street_address") ||
          r.types?.includes("route") ||
          r.types?.includes("premise")
      ) ?? data.results[0];

    const components = bestResult.address_components;

    const get = (type: string) =>
      components.find((c: AddressComponent) => c.types.includes(type))
        ?.long_name ?? null;

    const getShort = (type: string) =>
      components.find((c: AddressComponent) => c.types.includes(type))
        ?.short_name ?? null;

    const streetNumber = get("street_number");
    const street =
      get("route") ??
      get("sublocality_level_1") ??
      get("neighborhood") ??
      get("sublocality");
    const city = get("locality") ?? get("administrative_area_level_2");
    const state = get("administrative_area_level_1");
    const country = get("country");
    const countryCode = getShort("country")?.toLowerCase() ?? null;
    const postcode = get("postal_code");
    const name = street ?? city;

    const fullStreet = streetNumber ? `${streetNumber} ${street}` : street;

    return NextResponse.json({
      // ✅ Infos de base
      name,
      city,
      state,
      country,
      countryCode,
      postcode,
      street: fullStreet,
      // ✅ Coordonnées
      lat: bestResult.geometry.location.lat,
      long: bestResult.geometry.location.lng,
      // ✅ Adresse formatée
      formattedAddress: [fullStreet, city, postcode, country]
        .filter(Boolean)
        .join(", "),
    });

  } catch (error) {
    console.error("Geocode error:", error);
    return NextResponse.json(
      { error: "Géolocalisation échouée" },
      { status: 500 }
    );
  }
}