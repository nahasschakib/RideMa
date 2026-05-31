import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest){
    try {
        await dbConnect()
        const session = await auth()
        if(!session || !session.user.email){
            return NextResponse.json({message:"Unauthorized"},{status:401})
        }
        const user = await User.findOne({email:session.user.email})
        const booking = await Booking.findOne({
            driver: user._id,
            bookingStatus: { $in: ["confirmed", "started", "completed"] }
        })
        .sort({ updatedAt: -1 })
        .populate("user", "name email")
        .populate("driver", "name")
        .populate("vehicle", "type model number")

        if(!booking) return NextResponse.json(null,{status:200})
        return NextResponse.json(booking,{status:200})

    } catch (error) {
        return NextResponse.json({message:`get active ride for partner error: ${error}`},{status:500})
    }
}