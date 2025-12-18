'use server'
import { Account, AccountType, RecurringInterval, Transaction, TransactionStatus, TransactionType } from "@/generated/prisma"
import prisma from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"


interface SerializedAccount {
  id: string
  name: string
  type: AccountType
  balance: number
  isDefault: boolean
}

interface SerializedTransaction{
  id: string
  type: TransactionType
  amount: number
  category: string
  date: string // ISO string (important!)
  receiptUrl?: string | null
  description?: string | null
  status: TransactionStatus
  isRecurring: boolean
  recurringInterval?: RecurringInterval 
  nextRecurringDate?: string | null
}

const serializeAccount = (obj:Account) =>{
    const serialized:SerializedAccount = {
        id: obj.id,
        name: obj.name,
        type: obj.type,
        balance: obj.balance.toNumber(),
        isDefault: obj.isDefault,
    }


    return serialized
}

const serializeTransactions = (obj:Transaction)=>{
    const serializedTransaction:SerializedTransaction = {
        id: obj.id,
        type: obj.type,
        amount: obj.amount.toNumber(),
        category: obj.category,
        date: obj.date.toISOString(),
        receiptUrl: obj.receiptUrl,
        description: obj.description,
        status: obj.status,
        isRecurring: obj.isRecurring,
        recurringInterval: obj.recurringInterval
                          ? obj.recurringInterval
                          : undefined,
        nextRecurringDate:obj.nextRecurringDate 
                          ? obj.nextRecurringDate?.toISOString()
                          : undefined

    }
    return serializedTransaction
}


export async function updateDefaultAccount(accountId:string){
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

         await prisma.account.updateMany({
                where:{
                    userId:user.id,
                    isDefault:true
                },
                data:{
                    isDefault:false
                }
            })

        const account = await prisma.account.update({
            where:{
                id:accountId,
                userId:user.id,
            },
            data:{
                isDefault:true
            }
        })

        revalidatePath('/dashboard')
        return {
            success:true,
            data:serializeAccount(account)
        }
}

catch(error){
     if(error instanceof Error){
            throw new Error(error.message)
        }
        throw new Error('Something went wrong while updating default account')
}
}

export async function getAccountWithTransactions(accountId:string){
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

        const account = await prisma.account.findUnique({
            where:{
                id:accountId,
                userId:user.id
            },
            include:{
                transactions:{
                    orderBy:{
                        date:'desc'
                    }
                },
                _count:{
                    select:{
                        transactions:true
                    }
                }
            }
        })

        if(!account){
            return null
        }

        return{
            ...serializeAccount(account),
            transactions:account.transactions.map(serializeTransactions),
            transactionCount:account._count.transactions
        }
}


export async function bulkDeleteTransactions(transactionIds:string[]){
    try {
        
        const { userId } = await auth()

        if(!userId) throw new Error('Unauthorized')

        const user = await prisma.user.findUnique({
            where:{
                clerkUserId:userId
            }
        })

        if(!user){
            throw new Error('User not found')
        }

        const selectedTransactionsForDeletion = await prisma.transaction.findMany({
            where:{
                id:{
                    in:transactionIds
                },
                userId:user.id
            }
        })

        
        const accountBalanceChanges = selectedTransactionsForDeletion.reduce((acc:Record<string,number>,transaction:Transaction)=>{
            const change = 
            transaction.type === 'EXPENSE'
            ? transaction.amount.toNumber()//agar expense hai to usse hatane se humare paas paise badhenge 
            : -transaction.amount.toNumber()//isse hatane se paise ghatenge 

            acc[transaction.accountId] = (acc[transaction.accountId] || 0) + change

            return acc
        },{})

        //Delete the transactions and update the account balance of the account 
        await prisma.$transaction(async(tx)=>{
            await tx.transaction.deleteMany({
                where:{
                    id:{
                        in:transactionIds
                    }
                }
            })

            for(const[accountId, balanceChange] of Object.entries(accountBalanceChanges)){
                await tx.account.update({
                    where:{
                        id:accountId
                    },
                    data:{
                        balance:{
                            increment:balanceChange
                        }
                    }
                })
            }
        })

        revalidatePath('/dashboard')
        revalidatePath('/account/[id]')

        return {
            success:true
        }

    } catch (error) {
        
        if(error instanceof Error){
            throw new Error(error.message)
        }
        throw new Error('Something went wrong while deleting transactions')
    }
}