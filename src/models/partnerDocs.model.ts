import mongoose from "mongoose";


export interface IPartnerDocs {
    owner:mongoose.Types.ObjectId,
    cnieUrl:string,
    fanUrl:string,
    licenseUrl:string,
    status:"approved"|"rejected"|"pending",
    rejectionReason:string,
    createdAt:Date,
    updatedAt:Date

}
const partnerDocsSchema= new mongoose.Schema<IPartnerDocs>({
owner:{
    type:mongoose.Types.ObjectId,
    ref:"User",
    required:true
},
    cnieUrl:String,
    fanUrl:String,
    licenseUrl:String,

status:{
    type:String,
    enum:["approved","rejected","pending"],
    default:"pending"
},
rejectionReason:{
    type:String,
},



},{timestamps:true})

const PartnerDocs= mongoose.models.PartnerDocs || mongoose.model<IPartnerDocs>("PartnerDocs",partnerDocsSchema);
export default PartnerDocs;