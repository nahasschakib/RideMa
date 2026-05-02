import { setUserData } from '@/redux/userSlice'
import axios from 'axios'
import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'

function useGetAdmin(enabled:boolean) {
   const dispatch = useDispatch()
  useEffect(()=>{
     if(!enabled){
        return
    }
    const getAdmin=async ()=>{
        try {
         const {data}= await axios.get("/api/user/admin")
        dispatch(setUserData(data))
            
        } catch (error) {
         console.log(error)   
        }
        
    }
    getAdmin()
  },[dispatch, enabled])
}

export default useGetAdmin