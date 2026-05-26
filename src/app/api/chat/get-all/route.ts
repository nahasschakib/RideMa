import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ChatMessage from "@/models/chatMessages.model";

export async function POST(request:NextRequest) {
    try{
        await dbConnect()
        const {bookingId} = await request.json()
        const msgs = await ChatMessage.find({
            bookingId
        }).sort({createdAt:-1})
        return NextResponse.json({message:"Message sent",msgs},{status:200})
        

    }catch(error){
        return NextResponse.json({message:`Get All messages ${error}`},{status:500})
    }

}