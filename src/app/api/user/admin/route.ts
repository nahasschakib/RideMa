import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/user.model";

export async function GET(req:Request){
try {
    await dbConnect()
    const session = await auth()
    if(!session || !session.user){
        return Response.json(
            {message:"Utilisateur non authentifié"},
            {status:400}
        )
    }
    const user = await User.findOne({email:session.user.email})
    if(!user){
        return Response.json(
            {message:"utilisateur introuvable"},
            {status:400}
        )
    }
    return Response.json(
          user,
            {status:200}
        )
} catch (error) {
    return Response.json(
            {message:`obtenez-moi une erreur ${error}`},
            {status:500}
        )
}
}