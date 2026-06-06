import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import PartnerBank from "@/models/partnerBank.model";
import User from "@/models/user.model";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await auth();

    if (!session || !session.user?.email) {
      return Response.json({ message: "utilisateur non autorisé" }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return Response.json({ message: "utilisateur non trouvable" }, { status: 404 });
    }

    const { accountHolderName, accountNumber, ribiban, mobileNumber, mobilePaymentId } =
      await req.json();

    // ✅ ribiban et mobilePaymentId sont optionnels
    if (!accountHolderName || !accountNumber || !mobileNumber) {
      return Response.json({ message: "tous les champs requis doivent être remplis" }, { status: 400 });
    }

    const partnerBank = await PartnerBank.findOneAndUpdate(
      { owner: user._id },
      {
        $set: {
          accountHolderName,
          accountNumber,
          ribiban: ribiban || null,
          mobilePaymentId: mobilePaymentId || null,
          status: "added",
        },
      },
      { upsert: true, returnDocument: "after" },
    );

    user.mobileNumber = mobileNumber;
   
      user.partnerOnboardingSteps = 3;
   
    user.partnerStatus="pending"
    user.role = "partner";
    await user.save();

    
    return Response.json(partnerBank.toObject(), { status: 201 });
  } catch (error) {
    console.error("POST /api/partner/onboarding/bank error:", JSON.stringify(error, null, 2));
    // ✅ Afficher le message complet
    console.error(error)
    return Response.json(
      { message: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
}
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await auth();

    if (!session || !session.user?.email) {
      return Response.json({ message: "utilisateur non autorisé" }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return Response.json({ message: "utilisateur non trouvable" }, { status: 404 });
    }

    const partnerBank = await PartnerBank.findOne({ owner: user._id });

    // ✅ Retourne une vraie Response dans tous les cas (plus de return null)
    if (!partnerBank) {
      return Response.json({ message: "informations bancaires non trouvées" }, { status: 404 });
    }

    return Response.json({
      ...partnerBank.toObject(),
      mobileNumber: user.mobileNumber ?? ""
    }, { status: 200 });
  } catch (error) {
    console.error("GET /api/partner/onboarding/bank error:", error);
    return Response.json(
      { message: "Erreur lors de la récupération des informations bancaires" },
      { status: 500 },
    );
  }
}