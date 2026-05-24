import express from "express"
import dotenv from "dotenv"
import http from "http"
import { Server } from "socket.io"
import mongoose from "mongoose"
import User from "./models/user.model.js"
import Vehicle from "./models/vehicle.model.js"

dotenv.config();

const port = process.env.PORT || 5000;
const mongodbUrl = process.env.MONGODB_URL;

const dbConnect =async ()=>{
  try{
    await mongoose.connect(mongodbUrl);
    console.log("Connected to MongoDB");
  }catch(error){
    console.error("Error connecting to MongoDB:", error);
}
}

const app = express();
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
cors:{
  origin: process.env.NEXT_BASE_URL,
 }
})

app.post("/emit", async (req,res)=>{
  const { userId, event, data }= req.body;
  try{
    const user = await User.findById(userId);
    if(user && user.socketId){
      io.to(user.socketId).emit(event, data);
      res.json({ success: true });
    }else{
      res.json({ success: false, message: "User not connected" });
    }
  }catch(error){
    return res.status(500).json({ success: false,"error": error.message });
  }

})


io.on("connection", (socket) => {

socket.on("identity",async (userId) => {
socket.userId=userId  
await User.findByIdAndUpdate(userId,{
  socketId:socket.id,
  isOnline:true
})
})

socket.on("update-location", async ({ userId, clientId, latitude, longitude }) => {
  const locationPayload = {
    location: { type: "Point", coordinates: [longitude, latitude] }
  }
  await User.findByIdAndUpdate(userId, locationPayload)
  await Vehicle.findOneAndUpdate({ owner: userId, status: "approved" }, locationPayload)

  if (clientId) {
    try {
      const client = await User.findById(clientId)
      if (client?.socketId) {
        io.to(client.socketId).emit("location-update", { latitude, longitude })
      }
    } catch {}
  }
})



socket.on("disconnect",async ()=>{
  if(!socket.userId) return;
  await User.findByIdAndUpdate(socket.userId,{
  socketId:null,
  isOnline:false
})

})
})

server.listen(port, () => {
  console.log(`Socket server is running on port ${port}`);
  dbConnect();
})


