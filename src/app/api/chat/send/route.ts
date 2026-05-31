import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ChatMessage from "@/models/chatMessages.model";

export async function POST(request:NextRequest) {
    try{
        await dbConnect()
        const {bookingId,text,sender} = await request.json()
        if(!bookingId || !text || !sender || !["user","driver"].includes(sender)){
            return new Response("Invalid request", { status: 400 })
        }
        const msg = await ChatMessage.create({
            bookingId,
            text,
            sender
        })
        return NextResponse.json({message:"Message sent",msg},{status:200})

    }catch(error){
         console.log(error)
        return NextResponse.json(
            {message:`Error sending message ${error}`},
            {status:500})
    }

}