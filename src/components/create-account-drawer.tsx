"use client"
import React, { useEffect, useState } from 'react'
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from './ui/drawer'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { accountSchema } from '../app/lib/schema'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem ,SelectTrigger, SelectValue } from './ui/select'
import { Switch } from './ui/switch'
import { Button } from './ui/button'
import z from 'zod'
import useFetch from '../hooks/use-fetch'
import { createAccount } from '../actions/dashboard'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface CreateAccountDrawerProps {
    children: React.ReactNode,
}
const CreateAccountDrawer = ({children}:CreateAccountDrawerProps) => {

    const [open,setOpen] = useState(false)

    const{register,
        handleSubmit,
        formState:{errors},
        setValue,
        control,
        watch,
        reset
    } = useForm({
        resolver:zodResolver(accountSchema),
        defaultValues:{
            name:"",
            type:"CURRENT",
            balance:"",
            isDefault:false
        }
    })
    type AccountFormData = z.infer<typeof accountSchema>

    const{
        data:newAccount,
        error,
        fn:createAccountfn,
        loading:createAccountLoading
    } = useFetch(createAccount)

    useEffect(()=>{
        if(newAccount && !createAccountLoading){
            toast.success("Account created successfully")
            reset()
            setOpen(false)
        }
    },[newAccount, createAccountLoading])

    useEffect(()=>{
         if (error instanceof Error) {
              toast.error(error.message)
           } else if (error) {
              toast.error("Failed to create Account")
          }
    },[error])

    const onSubmit = async(data:AccountFormData) => {
        await createAccountfn(data)
    }
  return (
    <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent>
            <DrawerHeader>
                <DrawerTitle>Create New Account</DrawerTitle>
            </DrawerHeader>
            <div className='px-4 pb-4'>
                <form className='space-y-4' onSubmit={handleSubmit(onSubmit)}>

                    {/* account name */}
                    <div className='space-y-2'>
                        <label htmlFor="name" className='text-sm font-medium'>Account Name </label>
                        <Input id='name' placeholder='eg.Main Checking'
                        {...register('name')} />

                        {errors.name && (
                        <span className='text-sm text-red-500'>{errors.name.message}</span>
                    )}
                    </div>

                    {/* account type */}
                    <div className='space-y-2 '>
                        <label htmlFor="type" className='text-sm font-medium'>Account Type </label>
                    <Controller control={control} name='type' render={({field})=>(
                        <Select onValueChange={field.onChange}
                            defaultValue={field.value}>
                            <SelectTrigger id='type'>
                                <SelectValue placeholder= "Select Account Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CURRENT">Current</SelectItem>
                                <SelectItem value="SAVINGS">Savings</SelectItem>
                            </SelectContent>
                        </Select>
                        )}/>

                        {errors.type && (
                        <span className='text-sm text-red-500'>{errors.type.message}</span>
                    )}
                    </div>

                    {/* balance */}
                    <div className='space-y-2'>
                        <label htmlFor="balance" className='text-sm font-medium'>Account Balance </label>
                        <Input id='balance'
                         placeholder='0.00'
                         step={'0.01'}//how will it be updated
                         type='number'
                        {...register('balance')} />

                        {errors.balance && (
                        <span className='text-sm text-red-500'>{errors.balance.message}</span>
                    )}
                    </div>

                    {/* isDefault */}
                    
                    <div className='flex items-center justify-between rounded-lg border p-3'>
                        <div className='space-y-0.5'>
                           <label htmlFor="isDefault" className='text-sm font-medium cursor-pointer'> Set as Default </label>   
                           <p className='text-sm text-gray-600'>This account will be used by  default for all transactions</p>   
                        </div>
                        <Switch id='default'
                        onCheckedChange = {(checked)=>setValue('isDefault',checked)}
                        checked={watch('isDefault')}/>   
                    </div>


                    <div className='flex gap-2'>
                        <DrawerClose asChild>
                            <Button type='button' variant={'outline'} className='flex-1'>Cancel</Button>
                        </DrawerClose>
                         <Button type='submit' className='flex-1' disabled={createAccountLoading}>
                            {
                                createAccountLoading ? (
                                    <>
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    Creating..
                                    </>
                                ) : (
                                    "Create Account"
                                )
                            }
                         </Button>
                    </div>
                </form>
            </div>
        </DrawerContent>
    </Drawer>
  )
}

export default CreateAccountDrawer;