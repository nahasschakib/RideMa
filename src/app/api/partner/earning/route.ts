import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
import { NextResponse } from "next/server";

export async function GET() {
try{
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    await dbConnect();

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const bookings= await Booking.find({
        driver: session.user.id,
        paymentStatus:{$in:["paid","cash"]},
        createdAt:{$gte:sevenDaysAgo}
    }).select("partnerAmount createdAt").sort({createdAt:1})

    const earningMap:Record<string,number>={}

    bookings.forEach(b=>{
        const date=new Date(b.createdAt).toLocaleDateString("fr-FR",{
            day:"2-digit",
            month:"short",
            })

            if(!earningMap[date]){
                earningMap[date]=0
            }
            earningMap[date]+=b.partnerAmount || 0
    });

    const earnings=Object.entries(earningMap).map(([date,earnings])=>({
        date,
        earnings
    }))
    return NextResponse.json(earnings, { status: 200 });
}catch(error){
 return NextResponse.json(
    { message: "Failed to fetch partner earnings error",error },
    { status: 500 });
}
}