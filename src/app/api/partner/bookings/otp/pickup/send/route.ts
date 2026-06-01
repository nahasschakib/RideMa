import dbConnect from "@/lib/db";
import { sendMail } from "@/lib/sendMail";
import Booking from "@/models/booking.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest){
    try {
        await dbConnect()
        const {bookingId}= await req.json()
        const booking = await Booking.findById(bookingId).populate("user")
        if(!booking){
            return NextResponse.json({
                message:"Réservation introuvable"
            },{status:400})
        }

         const otp = Math.floor(1000+Math.random()*9000).toString()
         booking.pickUpOtp=otp
         booking.pickUpOtpExpires=new Date(Date.now()+5*60*1000)
         await booking.save()

         if(booking.user.email){
            await sendMail(booking.user.email,"Votre code OTP de retrait - MARIDE",
               `
                <div style ="font-family:sans-serif;padding:20px">
                <h2> MaRide OTP</h2>
                <p>Votre code OTP de retrait est :</p>

                <h1 style="letter-spacing:6px">${otp}</h1>

                <p>Ce code OTP est valable pendant 5 minutes.</p>

                <p>Partagez ce code OTP avec votre chauffeur pour démarrer la course.</p>

                <br/>
                <b>MARIDE</b>
                </div>`
            )
         }
         return NextResponse.json(
            {message:"Récupérer le code OTP envoyé au démarrage"},
            {status:200}
         )

    } catch (error) {
         return NextResponse.json(
            {message: "Erreur lors de la récupération du code OTP",error},
            {status:500}
         )
    }
}