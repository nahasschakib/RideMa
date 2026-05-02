
import Footer from "./components/Footer";
import PublicHome from "./components/PublicHome";
import AdminDashboard from "./components/AdminDashboard";
import { auth } from "@/auth";
import PartnerDashboard from "./components/PartnerDashboard";
import Navbar from "./components/Navbar";
import dbConnect from "@/lib/db";
import User from "@/models/user.model";
import GeoUpdater from "./components/GeoUpdater";

export default async function Home() {
  const session= await auth();
  await dbConnect()
  const user= await User.findOne({email:session?.user?.email})
    return (
    <div className="min-h-full w-full bg-white">
      {user && <GeoUpdater userId={user.id}/>}

      {user?.role=="partner" ?
      <>
      <Navbar/>
      <PartnerDashboard />
      </>

      :
      (user?.role=="admin" ?
      <AdminDashboard />
        :
       <>
       <Navbar/>
       <PublicHome />
       </>

      )
    }
      <Footer />
    </div>
  );
}
