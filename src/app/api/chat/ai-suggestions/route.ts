import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import axios from "axios";

const geminiUrl = process.env.GEMINI_API_URL!

export async function GET(request:NextRequest) {
    try{
        await dbConnect()
        const data = await axios.post(geminiUrl,{
            "contents": [{ "parts": [{ "text": "Explain how AI works in a few words" }] }]
        })
        console.log("Gemini response:", data.data)
        return NextResponse.json({ data: data.data })
    }catch(error){
        console.log(error)
        return NextResponse.json({message:`Get AI suggestions error: ${error}`},{status:500})
    }
}