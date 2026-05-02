"use client"
import { useSession } from 'next-auth/react'
import React from 'react'
import useGetAdmin from './hooks/useGetAdmin'

function InitUser() {
 const {status}=useSession()
 useGetAdmin(status=="authenticated")
  return null
}

export default InitUser
