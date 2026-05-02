import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
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
      return Response.json(
        { message: "Partenaire non trouvé" },
        { status: 400 },
      );
    }

    const roomId = `kyc-${partner._id}-${Date.now()}`;
    partner.videoKycRoomId = roomId;
    partner.videoKycStatus = "in_progress";
    partner.partnerOnBoardingSteps = 4;

    await partner.save();

    return NextResponse.json({ roomId });
  } catch (error) {
        return NextResponse.json({ message: "video kyc start error", error}
        ,{ status: 500 },
    );
  }
}
