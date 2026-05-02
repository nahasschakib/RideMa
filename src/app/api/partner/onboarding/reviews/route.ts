// import { auth } from "@/auth";
// import dbConnect from "@/lib/db";
// import User from "@/models/user.model";
// import { NextRequest } from "next/server";

// export async function POST(req: NextRequest) {
//   try {
//     await dbConnect();
//     const session = await auth();

//     if (!session || !session.user?.email) {
//       return Response.json(
//         { message: "utilisateur non autorisé" },
//         { status: 401 },
//       );
//     }

//     const user = await User.findOne({ email: session.user.email });
//     if (!user) {
//       return Response.json(
//         { message: "utilisateur non trouvable" },
//         { status: 404 },
//       );
//     }
// }catch (error) {
//     console.error("POST /api/partner/onboarding/vehicle error:", error);
//     return Response.json(
//       { message: "Erreur lors de l'enregistrement du véhicule" },
//       { status: 500 },
//     );
//   }
// }
