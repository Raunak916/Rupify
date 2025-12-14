"use client"
import React, { useState } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from './ui/drawer'

interface CreateAccountDrawerProps {
    children: React.ReactNode,
}
const CreateAccountDrawer = ({children}:CreateAccountDrawerProps) => {

    const [open,setOpen] = useState(false)
  return (
    <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent>
            <DrawerHeader>
                <DrawerTitle>Are you absolutely sure?</DrawerTitle>
            </DrawerHeader>
        </DrawerContent>
    </Drawer>
  )
}

export default CreateAccountDrawer