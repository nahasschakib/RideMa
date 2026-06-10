// src/app/api/admin/reviews/partner/[id]/route.ts
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/user.model";
import Vehicle from "@/models/vehicle.model";
import PartnerDocs from "@/models/partnerDocs.model";
import PartnerBank from "@/models/partnerBank.model";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user?.email || session.user.role !== "admin") {
      return Response.json({ message: "Non authentifié" }, { status: 401 });
    }

    await dbConnect();

    const partnerId = (await context.params).id;

    const partner = await User.findById(partnerId);

    if (!partner || partner.role !== "partner") {
      return Response.json({ message: "Partenaire non trouvé" }, { status: 404 });
    }

    const vehicle = await Vehicle.findOne({ owner: partnerId });
    const documents = await PartnerDocs.findOne({ owner: partnerId });
    const bank = await PartnerBank.findOne({ owner: partnerId });


    return Response.json({ partner, vehicle, documents, bank }, { status: 200 });

  } catch (error) {
    return Response.json(
      { message: `Erreur serveur: ${error}` },
      { status: 500 }
    );
  }
}