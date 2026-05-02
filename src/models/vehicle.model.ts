import mongoose from "mongoose";


export type vehicleType=
    "car"|"motocycle"|"scooter"|"vélo"|"truck"|"bus"|"van"|"other"

export interface IVehicle {
    owner:mongoose.Types.ObjectId,
    type:vehicleType,
    model:string,
    number:string,
    baseFare?:number,
    imageUrl?:string,
    pricePerKM?:number,
    waitingCharge?:number,
    status:"approved"|"rejected"|"pending",
    rejectionReason?:string,
    isActive:boolean,
    isAvailable:boolean,
    location?:{
        type:"Point";
        coordinates:[number,number];
    },
    createdAt:Date,
    updatedAt:Date
}

const vehicleSchema= new mongoose.Schema<IVehicle>({
owner:{
    type:mongoose.Types.ObjectId,
    ref:"User",
    required:true
},
type:{
    type:String,
    enum:["car","motocycle","scooter","vélo","truck","bus","van","other"],
    required:true,
},
number:{
    type:String,
    required:true,
    unique:true,
   },
model:{
    type:String,
    required:true,
},
baseFare:{
    type:Number,
},
imageUrl:{
    type:String,
},
pricePerKM:{
    type:Number,
},
waitingCharge:{
    type:Number,
},
status:{
    type:String,
    enum:["approved","rejected","pending"],
    default:"pending"
},
rejectionReason:{
    type:String,
},
isActive:{
    type:Boolean,
    default:true,
},
isAvailable:{
    type:Boolean,
    default:false,
},
location:{
    type:{
        type:String,
        enum:["Point"],
    },
    coordinates:[Number],
},


},{timestamps:true})

vehicleSchema.index({ location: "2dsphere" });

const Vehicle = mongoose.models.Vehicle || mongoose.model<IVehicle>("Vehicle", vehicleSchema);
export default Vehicle;