import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest } from "next/server";
import PartnerBank from "@/models/partnerBank.model";
import PartnerDocs from "@/models/partnerDocs.model";



export async function POST(
  req: NextRequest,
  context:{params:Promise<{id:string}>}) {
    try {
       const session = await auth();
  
  if (!session || !session.user?.email || session.user.role !== "admin") {
    return Response.json(
      { message: "Non authentifié" },
      { status: 401 }
    );
  }
  await dbConnect();
  const partnerId =(await context.params).id
  const partner=await User.findById(partnerId)

    if (!partner || partner.role !== "partner") {
      return Response.json(
        {message:"Partenaire non trouvé"},
      {status:404}
     )
    }
    if (partner.partnerStatus === "approved") {
      return Response.json(
        {message:" Partenaire Déjà approuvé"},
      {status:400}
     )
    }

    const partnerDocs = await PartnerDocs.findOne({owner:partner._id})
    const partnerBank = await PartnerBank.findOne({owner:partner._id})
     
      if(!partnerDocs || !partnerBank){
         return Response.json(
          {message:" Partenaire n'a pas complete toutes les etapes"},
          {status:400}
        )
      }

     partner.partnerStatus = "approved";
     partner.videoKycStatus="pending"
     partner.partnerOnBoardingSteps = 4;
    await partner.save()
    partnerDocs.status="approved"
    await partnerDocs.save()
    partnerBank.status="verified"
    await partnerBank.save()

return Response.json(
      {message: "Partenaire approuvé"},
      { status: 200 }
    );
   
    } catch (error) {
      return Response.json({
        message:`Partner approved error ${error}`
      },{status:500})
    }
  }

 
