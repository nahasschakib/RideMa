import express from "express"
import dotenv from "dotenv"
import http from "http"
import { Server } from "socket.io"
import mongoose from "mongoose"
import User from "./models/user.model.js"
import Vehicle from "./models/vehicle.model.js"

dotenv.config();

const port = process.env.PORT || 8000;
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
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
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
  await Vehicle.findOneAndUpdate(
    { owner: userId, status: "approved" },
    { $set: { ...locationPayload, isAvailable: true } }
  )

  if (clientId) {
    try {
      const client = await User.findById(clientId)
      if (client?.socketId) {
        io.to(client.socketId).emit("location-update", { latitude, longitude })
      }
    } catch {}
  }
})

socket.on("join-ride",(bookingId)=>{
  console.log("join-ride",bookingId)
  socket.join(`ride-${bookingId}`)
})

socket.on("driver-location-update",({bookingId,latitude,longitude,status})=>{
io.to(`ride-${bookingId}`).emit("driver-location",{
latitude,
longitude,
})
})

socket.on("chat-message",(data)=>{
  io.to(`ride-${data.bookingId}`).emit("chat-message",data)
})

socket.on("join-support", (userId) => {
  socket.join(`support-${userId}`);
  console.log(`[support] User ${userId} joined support room`);
});

socket.on("support-message", (data) => {
  // Broadcast dans la room support de l'utilisateur
  io.to(`support-${data.userId}`).emit("support-message", data);
  console.log(`[support] Message from ${data.sender} to user ${data.userId}`);
});

socket.on("disconnect", async () => {
  if (!socket.userId) return;
  await User.findByIdAndUpdate(socket.userId, {
    socketId: null,
    isOnline: false
  })
  await Vehicle.findOneAndUpdate(
    { owner: socket.userId, status: "approved" },
    { $set: { isAvailable: false } }
  )
})
})

server.listen(port, () => {
  console.log(`Socket server is running on port ${port}`);
  dbConnect();
})


