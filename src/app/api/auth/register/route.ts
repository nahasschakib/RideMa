import dbConnect from "@/lib/db";
import { sendMail } from "@/lib/sendMail";
import User from "@/models/user.model";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest){
try {
    const {name,email,password}= await req.json()
    await dbConnect()
    let user = await User.findOne({email})
    if(user && user.isEmailVerified){
        return NextResponse.json(
            {message:"Email existe déjà"},
            {status:400}
        )
    }

    const otp = Math.floor(100000+Math.random()*900000).toString()
    const otpExpiredAt = new Date(Date.now()+10*60*1000)

     if(password.length < 6){
        return NextResponse.json(
            {message:"Mot de passe doit comporter au moins 6 caractères."},
            {status:400}
        )
    }
    const hashedPassword = await bcrypt.hash(password,10)
     if(user && !user.isEmailVerified){
        user.name=name;
        user.password=hashedPassword;
        user.email=email;
        user.otp=otp;
        user.ExpiredAt=otpExpiredAt
        await user.save()
     }else{
         user = await User.create({
        name,
        email,
        password: hashedPassword,
        otp,
        otpExpiredAt 
    })
    }

    await sendMail(
        email,
        "Votre e-mail de vérification OTP",
        `<h2> Votre e-mail de vérification OTP est <strong>${otp}</strong></h2>`
    )
   
     return NextResponse.json(
            {message:"Utilisateur créé avec succès"},
            {status:201}
        )
         
} catch (error) {
    return NextResponse.json(
        {message:`Error creating user: ${error}`},
        {status:500}
    )
}
}