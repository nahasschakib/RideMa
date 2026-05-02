import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
    req:NextRequest,
    context:{params:Promise<{id:string}>}
){
    try {
        const id = (await context.params).id
        await dbConnect()
        const booking = await Booking.findById(id)
        console.log("booking status:", booking?.bookingStatus)

        const cancellable = ["requested","awaiting_payment","confirmed"]
        if(!booking || !cancellable.includes(booking.bookingStatus)){
            return NextResponse.json(
                {message:"invalid"},
                {status:400}
            )
        }
        booking.bookingStatus="cancelled"

        await booking.save()
        return NextResponse.json(
                {success:"true"},
                {status:200}
            )
    } catch (error) {
        return NextResponse.json(
                {message:`cancelled booking error ${error}`},
                {status:500}
            )
    }
}
