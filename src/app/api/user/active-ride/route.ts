import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
import "@/models/user.model";
import "@/models/vehicle.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest){
    try {
        await dbConnect()
        const session = await auth()
        if(!session || !session.user.email){
            return NextResponse.json({message:"Unauthorized"},{status:401})
        }

        const {bookingId}=await req.json()
        const booking= await Booking.findById(bookingId).populate("user vehicle driver")

       
        return NextResponse.json(booking,{status:200})

    } catch (error) {
        return NextResponse.json({message:`get active ride user error: ${error}`},{status:500})
    }
}