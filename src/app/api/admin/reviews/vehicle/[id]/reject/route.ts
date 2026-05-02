import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/user.model";
import Vehicle from "@/models/vehicle.model";
import { NextRequest } from "next/server";

export async function POST (
    req: NextRequest,
      context: { params: Promise<{ id: string }> }
    ) {
        try {
               const session = await auth();
            
                if (!session || !session.user?.email || session.user.role !== "admin") {
                  return Response.json({ message: "Non authentifié" }, { status: 401 });
                }

                const {reason}=await req.json()
            
                await dbConnect();
            
                const vehicleId = (await context.params).id;
            
                const vehicle = await Vehicle.findById(vehicleId).populate("owner");
            
                if (!vehicle) {
                  return Response.json({ message: "Vehicule non trouvé" }, { status: 404 });
                }

                vehicle.status="rejected"
                vehicle.rejectionReason=reason
                await vehicle.save()

                return Response.json(
                    vehicle, 
                     { status: 200 });
                
            
            
        } catch (error) {
              return Response.json(
                { message: `vehicle rejected error ${error}` },
                 { status: 500 });
                }
        }
    
