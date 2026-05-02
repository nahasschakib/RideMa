import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import PartnerDocs from "@/models/partnerDocs.model";
import User from "@/models/user.model";
import { NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// 🔥 CONFIG CLOUDINARY
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

interface UpdatePayload {
  status: string;
  cnieUrl?: string;
  fanUrl?: string;
  licenseUrl?: string;
}

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

    const formData = await req.formData();

    const identityFile = formData.get("identity");
    const drivingLicenseFile = formData.get("drivingLicense");
    const vehicleRegistrationFile = formData.get("vehicleRegistration");

    // 🔍 DEBUG
    console.log("FILES:", {
      identityFile,
      drivingLicenseFile,
      vehicleRegistrationFile,
    });

    // ✅ VALIDATION ROBUSTE
    if (
      !(identityFile instanceof Blob) ||
      !(drivingLicenseFile instanceof Blob) ||
      !(vehicleRegistrationFile instanceof Blob)
    ) {
      return Response.json(
        { message: "Tous les fichiers sont requis et doivent être valides" },
        { status: 400 }
      );
    }

    // 🚀 UPLOAD PARALLÈLE (plus rapide)
 const [cnieUrl, licenseUrl, fanUrl] = await Promise.all([
  uploadToCloudinary(identityFile),
  uploadToCloudinary(drivingLicenseFile),        // → licenseUrl
  uploadToCloudinary(vehicleRegistrationFile),   // → fanUrl
]);

    const updatePayload: UpdatePayload = {
      status: "pending",
      cnieUrl,
      fanUrl,
      licenseUrl,
    };

    const partnerDocs = await PartnerDocs.findOneAndUpdate(
  { owner: user._id },
  { $set: updatePayload },
  { upsert: true, returnDocument: "after" }  // ← correct option
)

    if (user.partnerOnBoardingSteps < 2) {
      user.partnerOnBoardingSteps = 2;
     }else{
      user.partnerOnBoardingSteps=3
     }
     user.partnerStatus="pending"

     await user.save();

    return Response.json(partnerDocs.toObject(), { status: 201 });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erreur serveur";
    console.error("🔥 ERROR:", error);

    return Response.json(
      {
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

// 🔥 FONCTION CLOUDINARY CORRIGÉE
async function uploadToCloudinary(file: Blob): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "partner-docs" }, (error, result) => {
        if (error || !result) {
          console.error("Cloudinary error:", error);
          return reject(error);
        }
        resolve(result.secure_url);
      })
      .end(buffer);
  });
}
