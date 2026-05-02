import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/user.model";
import Vehicle from "@/models/vehicle.model";
import { NextRequest } from "next/server";

const VEHICLE_REGEX = /^\d{1,5}-[A-Z]{1,3}-\d{1,2}$/;

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await auth();

    if (!session || !session.user?.email) {
      return Response.json(
        { message: "utilisateur non autorisé" },
        { status: 401 },
      );
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return Response.json(
        { message: "utilisateur non trouvable" },
        { status: 404 },
      );
    }

    const { type, number, vehicleModel } = await request.json();

    // ✅ Le numéro est requis sauf pour les vélos
    if (!type || !vehicleModel || (type !== "vélo" && !number)) {
      return Response.json({ message: "données manquantes" }, { status: 400 });
    }

    // ✅ Les vélos n'ont pas de plaque au Maroc → on bypass la regex
    if (type !== "vélo" && !VEHICLE_REGEX.test(number)) {
      return Response.json(
        { message: "numéro de véhicule invalide" },
        { status: 400 },
      );
    }

    const vehicleNumber =  number.toUpperCase()
    

    const existingVehicle = await Vehicle.findOne({ owner: user._id });
    if (existingVehicle) {
      existingVehicle.type = type;
      existingVehicle.number = vehicleNumber;
      existingVehicle.model = vehicleModel;
      existingVehicle.status = "pending";
      await existingVehicle.save();

      if (user.partnerOnBoardingSteps < 2){
        user.partnerOnBoardingSteps = 2;
        user.partnerStatus="pending"
        await user.save()
      }
      else{
        user.partnerOnBoardingSteps = 3
        user.partnerStatus="pending"
        await user.save()
       }
           
      return Response.json(existingVehicle, { status: 200 });
    }
    if (vehicleNumber) {
      const duplicateVehicle = await Vehicle.findOne({ number: vehicleNumber });
      if (duplicateVehicle) {
        return Response.json(
          { message: "numéro de véhicule déjà utilisé" },
          { status: 400 },
        );
      }
    }

    const newVehicle = await Vehicle.create({
      owner: user._id,
      type,
      number: vehicleNumber,
      model: vehicleModel,
    });

    if (user.partnerOnBoardingSteps < 1) {
      user.partnerOnBoardingSteps = 1
     }
     user.role ='partner'
     user.partnerStatus="pending"
     await user.save();
    
    return Response.json(newVehicle.toObject(), { status: 201 });
  } catch (error) {
    console.error("POST /api/partner/onboarding/vehicle error:", error);
    return Response.json(
      { message: "Erreur lors de l'enregistrement du véhicule" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await auth();

    if (!session || !session.user?.email) {
      return Response.json(
        { message: "utilisateur non autorisé" },
        { status: 401 },
      );
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return Response.json(
        { message: "utilisateur non trouvable" },
        { status: 404 },
      );
    }

    const vehicle = await Vehicle.findOne({ owner: user._id });
    if (!vehicle) {
      return Response.json(
        { message: "Véhicule non trouvé", vehicle: null },
        { status: 404 },
      );
    }

    // ✅ .toObject() pour sérialiser proprement le document Mongoose
    return Response.json({ vehicle: vehicle.toObject() }, { status: 200 });
  } catch (error) {
    console.error("GET /api/partner/onboarding/vehicle error:", error);
    return Response.json(
      { message: "Erreur lors de la récupération du véhicule" },
      { status: 500 },
    );
  }
}
