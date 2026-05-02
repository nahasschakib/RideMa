import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session || !session.user?.email || session.user.role !== "admin") {
      return Response.json(
        { message: "utilisateur non autorisé" },
        { status: 400 },
      );
    }

    await dbConnect();
    const { rejectionReason } = await req.json();
    const partnerId = (await context.params).id;
    const partner = await User.findById(partnerId);
    if (!partner || partner.role !== "partner") {
      return Response.json(
        { message: "partenaire non trouve" },
        { status: 400 },
      );
    }

    partner.partnerStatus = "rejected";
    partner.rejectionReason = rejectionReason;
    await partner.save();

    return Response.json(
      { message: "Partenaire rejeté avec succès" },
      { status: 200 },
    );
  } catch (error) {
    return Response.json(
      { message: `le partenaire obtient une erreur ${error}` },
      { status: 500 },
    );
  }
}
