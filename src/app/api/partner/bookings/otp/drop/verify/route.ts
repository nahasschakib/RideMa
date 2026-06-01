
import dbConnect from "@/lib/db";
import { sendMail } from "@/lib/sendMail";
import Booking from "@/models/booking.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest){
    try {
        await dbConnect()
        const {bookingId,otp}= await req.json()
        const booking = await Booking.findById(bookingId).populate("user")
        if(!booking){
            return NextResponse.json({
                message:"Réservation introuvable"
            },{status:400})
        }

        if(!booking.dropOtp){
             return NextResponse.json({
                message:"Le code OTP non généré"
            },{status:400})
        }
        if(booking.dropOtp != otp){
             return NextResponse.json({message:"Le code OTP incorrect"},
                {status:400}
             )
        }

          if(booking.dropOtpExpires < new Date()){
             return NextResponse.json({message:"Le code OTP expiré"},{
                status:400
             })
        }

         
         booking.BookingStatus="completed"
         booking.dropOtp=""
         booking.dropExpires=undefined
         await booking.save()

         return NextResponse.json(
            {message:"le code OTP de dépôt  vérifié "},
            {status:200}
         ) 

    } catch (error) {
         return NextResponse.json(
            {message: "Erreur de vérification du code OTP",error},
            {status:500}
         )
    }
}