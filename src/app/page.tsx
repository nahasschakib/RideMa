
import Footer from "./components/Footer";
import PublicHome from "./components/PublicHome";
import { auth } from "@/auth";
import PartnerDashboard from "./components/PartnerDashboard";
import Navbar from "./components/Navbar";
import dbConnect from "@/lib/db";
import User from "@/models/user.model";
import GeoUpdater from "./components/GeoUpdater";

export default async function Home() {
  const session = await auth();
  await dbConnect();
  const user = await User.findOne({ email: session?.user?.email });
  const plainUser = JSON.parse(JSON.stringify(user));

  return (
    <div className="min-h-full w-full bg-white">
      {plainUser && <GeoUpdater userId={plainUser?._id} />}

      {plainUser?.role === "partner" ? (
        <>
          <Navbar />
          <PartnerDashboard />
        </>
      ) : (
        <>
          <Navbar />
          <PublicHome />
        </>
      )}

      <Footer />
    </div>
  );
}
