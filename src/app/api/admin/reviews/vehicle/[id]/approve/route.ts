import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/user.model";
import Vehicle from "@/models/vehicle.model";
import { NextRequest } from "next/server";

export async function GET (
    req: NextRequest,
      context: { params: Promise<{ id: string }> }
    ) {
        try {
               const session = await auth();
            
                if (!session || !session.user?.email || session.user.role !== "admin") {
                  return Response.json({ message: "Non authentifié" }, { status: 401 });
                }
            
                await dbConnect();
            
                const vehicleId = (await context.params).id;
            
                const vehicle = await Vehicle.findById(vehicleId).populate("owner");
            
                if (!vehicle) {
                  return Response.json({ message: "Vehicule non trouvé" }, { status: 404 });
                }

                vehicle.status="approved"
                vehicle.rejectionReason=undefined
                vehicle.isAvailable=true
                vehicle.location={ type:"Point", coordinates:[-7.612335, 33.5754] }
                await vehicle.save()

                const partner = await User.findById(vehicle.owner)
                if(!partner){
                    return Response.json({ message: "Partenaire non trouvé" }, { status: 404 }); 
                }
                partner.partnerOnBoardingSteps=7
                await partner.save()

                  return Response.json(
                    vehicle, 
                     { status: 200 });
                
            
            
        } catch (error) {
              return Response.json(
                { message: `vehicle approve error ${error}` },
                 { status: 500 });
                }
        }
    
