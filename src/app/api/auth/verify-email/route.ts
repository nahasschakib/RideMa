import  User  from '@/models/user.model';
import dbConnect from "@/lib/db"


export async function POST(req:Request) {
    try {
        await dbConnect()
        const {email,otp}= await req.json()
          if(!email || !otp){
                return Response.json(
                    {message:"Courriel et Code OTP sont requis."},
                    {status:400}
                )
            }
            const user=await User.findOne({email})
             if(!user){
                return Response.json(
                    {message:" Utilisateur Introuvable."},
                    {status:400}
                )
            }
               if(user.isEmailVerified){
                return Response.json(
                    {message:"Email déjà vérifié ."},
                    {status:400}
                )
            }
              if(!user.otpExpiredAt || user.otpExpiredAt < new Date()){
                return Response.json(
                    {message:"Le code OTP a expiré."},
                    {status:400}
                )
            }
              if(!user.otp || user.otp!=otp){
                return Response.json(
                    {message:"Le code OTP invalide"},
                    {status:400}
                )
            }
            user.isEmailVerified=true
            user.otp=undefined
            user.otpExpiredAt=undefined

            await user.save()
             return Response.json(
                    {message:"l'e-mail est vérifié "},
                    {status:200}
                )
    } catch (error) {
        return Response.json(
                    {message:`vérifier l'erreur email ${error} `},
                    {status:500}
                )
    }
}