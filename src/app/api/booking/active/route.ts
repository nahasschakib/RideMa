import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000

export async function GET(req:NextRequest){
    try {
        await dbConnect()
        const session = await auth()
        if(!session?.user?.id){
            return NextResponse.json({booking:null})
        }
        const user= await User.findOne({email:session.user.email})
        const booking = await Booking.findOne({
            user:user.id,
            bookingStatus:{$in:["requested", "awaiting_payment", "confirmed", "started"]}
        })
        if(!booking){
           return NextResponse.json({booking:null})
        }

        // Un booking "confirmed" sans transition vers "started" depuis plus de 2h est stale.
        // On l'expire côté serveur pour débloquer l'UI du client.
        if (
            booking.bookingStatus === "confirmed" &&
            booking.updatedAt &&
            Date.now() - new Date(booking.updatedAt).getTime() > TWO_HOURS_MS
        ) {
            await Booking.updateOne({ _id: booking._id }, { $set: { bookingStatus: "expired" } })
            return NextResponse.json({ booking: null })
        }

        return NextResponse.json({booking})
    } catch (error) {
          return NextResponse.json({
                message:`get active booking error ${error}`
            },{status:500})
    }
}
