import { getUserAccounts } from '@/actions/dashboard'
import React from 'react'
import AddTransactionForm from '../_components/add-transaction-form'
import { defaultCategories } from '@/data/categories'

const AddTransactionPage = async() => {
    const accounts = await getUserAccounts()//has all the serialized accounts
  return (
    <div className='max-w-3xl mx-auto px-5'>
        <h1 className='text-5xl gradient-title mb-8'>Add Transaction</h1>

        {/* Transactionform  */}
        <AddTransactionForm accounts = {accounts} categories = {defaultCategories}/>
    </div>
  )
}

export default AddTransactionPage