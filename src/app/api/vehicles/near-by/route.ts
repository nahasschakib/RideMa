import dbConnect from "@/lib/db";
import Vehicle from "@/models/vehicle.model";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { latitude, longitude, vehicleType, womenOnly } = await req.json();

    if (!latitude || !longitude) {
      return NextResponse.json({ message: "coordinates not found" }, { status: 400 });
    }

    const vehicles = await Vehicle.find({
      type: vehicleType,
      status: "approved",
      isAvailable: true,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [longitude, latitude] },
          $maxDistance: 10000,
        },
      },
    }).lean();

    if (!womenOnly) {
      return NextResponse.json(vehicles, { status: 200 });
    }

    // Filtrer uniquement les chauffeures femmes
    const ownerIds = vehicles.map((v: Record<string, unknown>) => v.owner);
    const femaleDrivers = await User.find({
      _id: { $in: ownerIds },
      gender: 'female',
    }).select('_id').lean();

    const femaleDriverIds = new Set(femaleDrivers.map((d: Record<string, unknown>) => d._id?.toString()));
    const filtered = vehicles.filter((v: Record<string, unknown>) =>
      femaleDriverIds.has(v.owner?.toString())
    );

    return NextResponse.json(filtered, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: `near by vehicles error ${error}` }, { status: 500 });
  }
}