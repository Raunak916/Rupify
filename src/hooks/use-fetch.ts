"use client"
import { useState } from "react"
import { toast } from "sonner"
import { z } from "zod"



const useFetch = (cb:(...args:any[])=>Promise<any>)=>{
    const [data, setData] = useState<unknown>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const fn = async(...args:any[])=>{
        setLoading(true)
        setError(null)

        try {
            const response = await cb(...args)
            setData(response)
            setError(null)
        } 
         catch (err) {
             if (err instanceof Error) {
                 setError(err)
                 toast.error(err.message)
             } else {
                 const unknownError = new Error("Something went wrong")
                 setError(unknownError)
               toast.error("Something went wrong")
            }
        }
        finally{
            setLoading(false)
        }
    }
        
    return{data, loading, error, fn, setData}
}

export default useFetch;