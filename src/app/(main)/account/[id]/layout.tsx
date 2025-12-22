import React, { Suspense } from 'react'
import { BarLoader } from 'react-spinners'
import AccountPage from './page'


type Props = {
    params:Promise<{
        id:string
    }>
}
const AccountsLayout = ({params}:Props) => {
  return (
    <div className='px-5'>
        <Suspense fallback = {<BarLoader className='mt-4'
        width={'100%'}
        color='#9333ea' />}>
           <AccountPage params={params}/>
        </Suspense>
    </div>
  )
}

export default AccountsLayout