"use server";

import { Account, AccountType } from '@/generated/prisma';
import { Decimal } from '@/generated/prisma/runtime/library';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';


interface Props_server{
    name:string,
    type:AccountType,
    balance:string,
    isDefault:boolean
}
interface SerializedAccount {
  id: string
  name: string
  type: AccountType
  balance: number
  isDefault: boolean
}

// const serializeTransaction = (obj)=>{
//     // TODO
// }

const serializeAccount = (obj:Account) =>{
    const serialized:SerializedAccount = {
        id: obj.id,
        name: obj.name,
        type: obj.type,
        balance: obj.balance.toNumber(),
        isDefault: obj.isDefault,
    }
//       return {
//         name: obj.name,
//         type: obj.type,
//         userId: obj.userId,
//         isDefault: obj.isDefault,
//         balance: obj.balance.toNumber(),
//   };

    return serialized
}

export async function createAccount(data:Props_server):Promise<{
    success:boolean
    data:SerializedAccount
}>{
    try {
        //clerk check
        const { userId } = await auth()

        if(!userId) throw new Error('Unauthorized')

        //Db check
        const user = await prisma.user.findUnique({
            where:{
                clerkUserId:userId
            }
        })

        if(!user){
            throw new Error('User not found')
        }
        //if we reach to this line , that simply means the user is logged In and also inside our db 

        // so now the user is eligible to create an account 

        //Convert balance to float before saving
        //parseFloat() expects a string
        const balanceFloat = parseFloat(data.balance)
        if(isNaN(balanceFloat)){
            throw new Error("Invalid balance ammount")
        }

        //we have to check if this the user's first account 
        const existingAccounts = await prisma.account.findMany({
            //this id here is not clerkUserId
            //but id (the primary key)
            where:{userId:user.id}
        })
        

        const shouldBeDefault = existingAccounts.length === 0?true : data.isDefault

        //if no account then first is the default account 
        //or let's say user wants some nth  account of his to be default account 

        if(shouldBeDefault){
            await prisma.account.updateMany({
                where:{
                    userId:user.id,
                    isDefault:true
                },
                data:{
                    isDefault:false
                }
            })
        }

        //now we create new account 
        const account = await prisma.account.create({
            data:{
                name:data.name,
                type:data.type,
                balance:new Decimal(balanceFloat),
                userId:user.id,
                isDefault:shouldBeDefault,
            }
        })


        //nextjs doesnt support decimal values
        //so before sending , kindly serialize 

        const serializedAccount = serializeAccount(account);

        revalidatePath('/dashboard')
        return{
            success:true,
            data:serializedAccount
        }
    } catch (error) {
        if(error instanceof Error){
            throw new Error(error.message)
        }
        throw new Error('Something went wrong while creating account')
    }

}

    export async function getUserAccounts(){
        const { userId } = await auth()

        if(!userId) throw new Error('Unauthorized')

        //Db check
        const user = await prisma.user.findUnique({
            where:{
                clerkUserId:userId
            }
        })

        if(!user){
            throw new Error('User not found')
        }

        const accounts = await prisma.account.findMany({
            where:{
                userId:user.id
            },
            orderBy:{
                createdAt:'desc'
            },
            include:{
                _count:{
                    select:{
                        transactions:true
                    }
                }
            }
        })

        const serializedAccount = accounts.map(serializeAccount)//array of serialized accounts 

        return serializedAccount

        
    }