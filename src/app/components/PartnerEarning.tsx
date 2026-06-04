"use client";
import axios from "axios";
import { ResponsiveContainer, BarChart, Bar, Cell, CartesianGrid, XAxis, YAxis } from "recharts";
import { BarChart2, Star, TrendingDown, TrendingUp, Zap } from "lucide-react";
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

type EarningProps = {
  date: string;
  earnings: number;
};

function PartnerEaring() {
  const [earningData, setEarningData] = useState<EarningProps[]>([]);
  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const { data } = await axios.get("/api/partner/earning");
        const last7DaysData: EarningProps[] = data.slice(-7);
        setEarningData(last7DaysData);
      } catch (error) {
        console.log("Failed to fetch earnings", error);
      }
    };
    fetchEarnings();
  }, []);

  const total = earningData.reduce((a, d) => a + d.earnings, 0);
  const avg = earningData.length ? Math.round(total / earningData.length) : 0;
  const max = earningData.length
    ? Math.max(...earningData.map((d) => d.earnings))
    : 0;
  const bestDay = earningData.find((d) => d.earnings === max)?.date || "N/A";
  const todayEarning = earningData.length
    ? earningData[earningData.length - 1].earnings
    : 0;
  const yesterdayEarning =
    earningData.length > 1 ? earningData[earningData.length - 2].earnings : 0;
  const delta = yesterdayEarning
    ? (((todayEarning - yesterdayEarning) / yesterdayEarning) * 100).toFixed(2)
    : "0.00";
  const deltaPositive = parseFloat(delta) >= 0;
  const deltaPct = deltaPositive ? `+${delta}%` : `${delta}%`;

  const fmt = (value: number) => `${value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;

  const metrics = [
    {
      label: "Meilleur jour",
      value: fmt(max),
      sub: bestDay ?? "-",
      icon: <Star size={14} />,
      color: "text-yellow-500",
      bg: "bg-yellow-50",
    },
    {
      label: "Moy. journalière",
      value: fmt(avg),
      sub: "7 derniers jours",
      icon: <BarChart2 size={14} />,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "Aujourd'hui",
      value: earningData.length ? fmt(todayEarning) : "N/A",
      sub: earningData.length > 1 ? `${deltaPct} vs hier` : "-",
      icon: <Zap size={14} />,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm w-full">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <span
            className="inline-block text-[11px] font-semibold tracking-widest uppercase
            text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-2"
          >
            Tableau de bord du partenaire
          </span>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Revenus journaliers
          </h2>
          <p className="mt-0.5 text-sm text-gray-400">
            Performances des 7 derniers jours
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase mb-1">
            Total hebdomadaire
          </p>

          <motion.div
            key={total}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-900 font-mono tracking-tight"
          >
            {fmt(total)}
          </motion.div>
          <div className={`flex items-center justify-end gap-1 text-xs font-semibold mt-1 ${
            deltaPositive ? "text-emerald-500" : "text-red-500"}`}>
            {deltaPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} className="rotate-180"/>}
           <span className="sr-only">Changement par rapport à hier:</span>
              {deltaPositive ? "En hausse" : "En baisse"} de {Math.abs(parseFloat(delta))}%

          </div>
        </div>
      </div>
        <div className="grid grid-cols-3 mb-6 gap-6">
            {metrics.map((m,i) => (
              <motion.div 
                key={m.label} 
                initial={{opacity:0, y:12}}
                animate={{opacity:1, y:0}}
                transition={{delay: i*0.7, duration:0.4 }}
                className="bg-gray-50 rounded-2xl p-4">
                <div className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase
                    tracking-wider mb-2 ${m.color}`}>
                 <span className={`${m.bg} p-1 rounded-lg ${m.color}`}>{m.icon}</span> 
                    {m.label}
                </div>
                              
                  <p className="text-lg font-bold text-gray-900 font-mono leading-none ">{m.value}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{m.sub}</p>
               
              </motion.div>
            ))}
          </div>
<AnimatePresence>
    <motion.div
    initial={{opacity: 0, scaleY: 0.92}}
    animate={{opacity: 1, scaleY: 1}}
    transition={{duration:0.45, ease:"easeOut"}}
    className="h-56"
    
    >
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
            data={earningData}
            barCategoryGap={"30%"}
            >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#11d69e"/>
            <XAxis dataKey="date" tick={{fontSize: 11, fill: "#11d69e", fontWeight: 500}}
            axisLine={false} 
            tickLine={false}/>
            <YAxis 
            tickFormatter={fmt} 
            tick={{fontSize: 11, fill: "#11d69e", fontWeight: 500}}
            axisLine={false} 
            tickLine={false}/>
           
            <Bar 
            dataKey="earnings" fill="#11d69e" radius={[8,8,3,3]}
             />
             {earningData.map((d,i)=>{
                const isToday = i === earningData.length - 1;
                const isBest = d.earnings === max && !isToday;
                                
                return(
                    <Cell
                    key={`cell-${i}`}
                    fill={
                        isToday
                         ? "#10b981" 
                         : isBest 
                         ? "#8b5cf6" 
                         : "#bfdbfe"
                        }
                    />
                )
             })}


            </BarChart>
        </ResponsiveContainer>

    </motion.div>
</AnimatePresence>

        </div>
      );
    }

export default PartnerEaring;
