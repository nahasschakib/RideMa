"use client"
import React from 'react'
import {motion } from "motion/react"

type AnimatedType={
  title:string,
  icon:React.ReactNode,
  children:React.ReactNode
}

function AnimatedCard({title,icon,children}:AnimatedType) {
  return (
    <motion.div
    whileHover={{y:-4}}
    className='bg-white rounded-4xl p-8 shadow-xl space-y-6'
    >
      <div className='flex items-center gap-2 font-semibold'>
        {icon}
        {title}
      </div>
      {children}


    </motion.div>
  )
}

export default AnimatedCard