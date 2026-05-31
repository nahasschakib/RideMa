"use client";
import axios from "axios";
import { Send, Sparkles, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import {AnimatePresence, motion} from "motion/react"
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

interface RideChatProps {
  currentRole: "user" | "driver" | "admin";
  bookingId: string;
  userName: string;
  driverName: string;
}

type message={
  bookingId:string,
  sender:"user" | "driver" ,
  text:string,
  createdAt:Date
}

function RideChat({
  currentRole,
  bookingId,
  userName,
  driverName,
}: RideChatProps) {
  const otherName = currentRole == "user" ? driverName : userName;
  const myName = currentRole == "user" ? userName : driverName;
  const [messages, setMessages] = useState<message[]>([]);
  const [lastMessage, setLastMessage] = useState("");
  const [text,setText]=useState("");
  const {userData}= useSelector((state:RootState)=>state.user)
  const [suggestions,setSuggestions]=useState<string[]>([]);
  const [showAI,setShowAI]=useState(false)
  const [aiLoading,setAiLoading]=useState(false)
  

  const sendMsg= async ()=>{
    try {
      const {data}= await axios.post("/api/chat/send",{
        sender:currentRole,
        text,
        bookingId
      })
      console.log(data)
      setMessages([...messages,data])
     }catch (error) {
      console.log(error)
    }
  }
  const getAllMsgs= async ()=>{
    try {
      const {data}= await axios.post("/api/chat/get-all",{
        bookingId
      })
      console.log(data);
      const msgs: message[] = data.msgs ?? [];
      setMessages(msgs);
      if (msgs.length > 0) setLastMessage(msgs[msgs.length - 1].text);
      
    }catch (error) {
      console.log(error)
    }
  }

  const formatTime=(dateInput:Date | string)=>{
     const date = new Date(dateInput)
     return date.toLocaleTimeString([],{
      hour:"2-digit",
      minute:"2-digit"
     })
  }

    useEffect(() => {
  const load = async () => {
    await getAllMsgs();
     };
  load();
}, []);

   const getAlSuggestions= async ()=>{
    setAiLoading(true)
    setShowAI(true)
    try {
      const {data}= await axios.post("/api/chat/ai-suggestions",{
      role:currentRole,
      lastMessage
      })
      setSuggestions(data.data ?? [])
      setAiLoading(false)
    }catch (error) {
      console.log(error)
      setAiLoading(false)
    }
  }



   return (
    <div className="flex flex-col h-full min-h-0 bg-white rounded-2xl overflow-hidden border border-zinc-100">
      <div className="flex bg-white py-3 px-4 shrink-0 items-center gap-3 border-b border-zinc-100">
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-xl bg-zinc-950 flex items-center justify-center text-xs font-bold text-white">
            {otherName.charAt(0).toUpperCase()}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-zinc-900 leading-none">{otherName}</p>
          <p className="text-[11px] text-emerald-500 font-semibold mt-0.5">En ligne</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-4 space-y-3 bg-zinc-50"
        style={{scrollbarWidth:"none", msOverflowStyle:"none"}}>
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>

        {(messages ?? []).length===0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center">
              <Send size={18} className="text-zinc-400"/>
            </div>
            <p className="text-sm text-zinc-400">Aucun message pour le moment</p>
            <p className="text-xs text-zinc-300">Lancez la conversation ci-dessous</p>
          </div>
        )}

        {(messages ?? []).length > 0 && (
          (messages ?? []).map((m,i)=>{
            const isMine = m.sender=== currentRole
            return (
              <motion.div
              key={i}
              initial={{opacity: 0, y: 8, scale: 0.97}}
              animate={{opacity: 1, y: 0, scale:1}}
              transition={{duration: 0.18, ease:[0.22, 1, 0.36, 1]}}
              className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[72%] px-3.5 py-2.5 text=sm leading-relaxed
                  rounded-2xl shadow-sm ${isMine
                  ? "bg-zinc-950 text-white rounded-br-sm"
                  : "bg-white border border-zinc-200 text-zinc-900 rounded-bl-sm"}`}>
                    <p className="wrap-break-word">{m.text}</p>
                    <span className="text-[8px] text-gray-200">{formatTime(m.createdAt)}</span>
                </div>

              </motion.div>

            )
          })
        )}
    </div>
    <AnimatePresence>
        {showAI && (messages ?? []).length > 0 && (
          <motion.div
          initial={{opacity: 0, height: 0}}
          animate={{opacity: 1, height: "auto"}}
          exit={{opacity: 0, height: 0}}
          className="shrink-0 overflow-hidden border-t border-zinc-100 bg-white"
          >
            <div className="px-4 pt-3 pb-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={12} className="text-violet-500" />
                  <span className="text-[11px] font-semibold text-zinc-500 uppercase
                  tracking-wider">AI suggestions</span>
                </div>
                 <button onClick={()=>setShowAI(false)}>
                  <X size={14} className="text-zinc-400 hover:text-zinc-600"/>
                 </button>
              </div>

              {aiLoading ? (
                <div className="flex flex-col gap-1.5">
                  {[1,2,3].map((s,i)=>(
                    <div
                    key={i} 
                    className="h-9 bg-zinc-100 rounded-xl animate-pulse"/>
                  ))}
                </div>
              ):(
                <div className="flex flex-col gap-1.5">
                  {suggestions.map((s,i)=>(
                    <motion.div
                    key={i}
                    whileTap={{scale: 0.98}}
                    onClick={()=>{setText(s);setShowAI(false)}}
                    className="text-left text-sm text-zinc-700 bg-zinc-50 hover:bg-violet-50
                    hover:text-violet-700 border border-zinc-100 
                    hover:border-violet-200 px-3 py-2 rounded-xl transition-all"
                     >
                      {s}

                    </motion.div>
                   ))}
                   <button
                   onClick={()=>getAlSuggestions()}
                   className="text-[11px] text-violet-500 hover:text-violet-700
                   font-semibold text-center mt-1 transition-colors">
                   Actualiser les suggestions
                   </button>
                </div>
              )}
            </div>

          </motion.div>
        )}
    </AnimatePresence>

    <div className="shrink-0 px-4 pb-4 pt-2 bg-white">
      <div className="flex items-center gap-2 bg-zinc-100 rounded-2xl pl-3 pr-1.5 py-1.5">
        {(messages ?? []).length > 0 && (
          <motion.button
          whileTap={{scale: 0.9}}
          onClick={()=>getAlSuggestions()}
          className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center
            transition-all ${showAI
            ? "bg-violet-600 text-white"
           : "bg-white text-violet-500 hover:bg-violet-50 border border-zin-200"}`}
          
          >
            <Sparkles size={14} 
            onClick={() => { getAlSuggestions(); setShowAI(true); }}
            className="bg-violet-600"/>

          </motion.button>
        )}

        <input 
        type="text"
        value={text}
        placeholder="Message..."
        onChange={(e)=>setText(e.target.value)}
        className="flex-1 bg-transparent text-sm text-zinc-900
        placeholder:text-zinc-400 focus:outline-none ml-2 py-1.5 min-w-0"/>
        <motion.button
        whileTap={{scale:0.88}}
        onClick={()=>sendMsg()}
        disabled={!text.trim()}
        className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
          text.trim()
          ? "bg-zinc-950 text-white hover:bg-zinc-800"
         : "bg-transparent text-zinc-300 cursor-not-allowed"
         }`}
        >
          <Send size={14}/>
        </motion.button>
      </div>
    </div>
     

    </div>
  );
}

export default RideChat;
