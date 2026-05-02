import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/user.model";

export async function GET() {
  try {
    await dbConnect();

    const session = await auth();
    if (!session || !session.user?.email) {
      return Response.json(
        { message: " non autorisé" },
        { status: 401 },
      );
    }

    const partner = await User.findOne({ email: session.user.email });
    if (!partner) {
      return Response.json(
        { message: " non trouvable" },
        { status: 404 },
      );
    }
    if(partner.videoKycStatus!=="rejected"){
        return Response.json(
        { message: "Vous pouvez pas envoyer une requete a ce moment" },
        { status: 404 },
      );
    }
    partner.videoKycStatus="pending"
    partner.videoKycRejectionReason=undefined
    partner.videoKycRoomId=undefined
    await partner.save()
     return Response.json(
        { success: true},
        { status: 200 },
      );

  } catch (error) {
     return Response.json(
        { message:`Kyc request error ${error}`  },
        { status: 404 },
      );
  }
}
