"use client";
import { IVehicle } from "@/models/vehicle.model";
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ImagePlus } from "lucide-react";
import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";

type PropsType = {
  open: boolean;
  onClose: () => void;
  data: IVehicle | null ;
};

function PricingModal({ open, onClose, data }: PropsType) {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(data?.imageUrl || null);
const [baseFare, setBaseFare] = useState(data?.baseFare?.toString() || "");
const [pricePerKM, setPricePerKM] = useState(data?.pricePerKM?.toString() || "");
const [waitingCharge, setWaitingCharge] = useState(data?.waitingCharge?.toString() || "");
  const [loading,setLoading]=useState(false)
  const router = useRouter()

 

  
  const handleSubmit=async()=>{
    setLoading(true)
    try {
      const formData=new FormData()
      formData.append("baseFare",baseFare)
      formData.append("waitingCharge",waitingCharge)
      formData.append("pricePerKM",pricePerKM)

      if(image){
        formData.append("image",image)
      }

      const {data}= await axios.post("/api/partner/onboarding/pricing",formData)
      console.log(data)
      setLoading(false)
      onClose()
      } catch (error) {
      console.log(error)
      setLoading(false)
    }
  }
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center
          justify-center z-50 px-4"
        >
          <motion.div
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
          >
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Pricing and Vehicle Image</h2>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <label
                htmlFor="imageLabel"
                className="relative h-44 border-2 border-dashed rounded-2xl
                  flex items-center justify-center cursor-pointer"
              >
                {!preview ? (
                  <ImagePlus size={28} />
                ) : (
                  <Image
                    src={preview}
                    className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                    fill
                    alt=""
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  id="imageLabel"
                  hidden
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setImage(e.target.files[0]);
                      setPreview(URL.createObjectURL(e.target.files[0]));
                    }
                  }}
                />
              </label>

              <div>
                <p className="text-sm font-semibold mb-1">Base Fare</p>
                <div className="flex items-center gap-2 border rounded-xl px-4 py-3 bg-white">
                  <span> MAD</span>
                  <input
                    type="text"
                    value={baseFare}
                    placeholder="base Fare"
                    onChange={(e) => setBaseFare(e.target.value)}
                    className="w-full outline-none"
                  />
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-1">Price Per KM</p>
                <div className="flex items-center gap-2 border rounded-xl px-4 py-3 bg-white">
                  <span> MAD</span>
                  <input
                    type="text"
                    value={pricePerKM}
                    placeholder="Price Per KM"
                    onChange={(e) => setPricePerKM(e.target.value)}
                    className="w-full outline-none"
                  />
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-1">Waiting Charge</p>
                <div className="flex items-center gap-2 border rounded-xl px-4 py-3 bg-white">
                  <span> MAD</span>
                  <input
                    type="text"
                    value={waitingCharge}
                    placeholder="waiting charge"
                    onChange={(e) => setWaitingCharge(e.target.value)}
                    className="w-full outline-none"
                  />
                </div>
              </div>

                  <div className="p-6 border-t flex gap-3">
                    <button
                      className="flex-1 border rounded-xl py-2"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button 
                    className="flex-1 bg-black text-white rounded-xl py-2"
                    onClick={handleSubmit}
                    disabled={loading}

                    >{ loading?"Saving...":"Save"}
                    </button>
                  </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PricingModal;
