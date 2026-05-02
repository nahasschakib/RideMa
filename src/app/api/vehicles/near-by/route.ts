import dbConnect from "@/lib/db";
import Vehicle from "@/models/vehicle.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest){
    try {
        await dbConnect()
        const {latitude,longitude,vehicleType}=await req.json()
        if(!latitude || !longitude){
            return NextResponse.json({
                message:"coordinates not found"
            },{status:400})
        }

        const vehicles = await Vehicle.find({
            type:vehicleType,
            status:"approved",
            isAvailable:true,
            location:{
                $near:{
                    $geometry:{
                        type:"Point",
                        coordinates:[longitude,latitude]
                    },
                    $maxDistance:10000
                }
            }
        }).lean()

        return NextResponse.json(vehicles,{status:200})

    } catch (error) {
         return NextResponse.json({
                message:`near by vehicles error ${error}`
            },{status:500})
    }
}