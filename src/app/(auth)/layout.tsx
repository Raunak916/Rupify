import React from 'react'

interface Props{
    children: React.ReactNode
}

const AuthLayout = ({children}:Props) => {
  return (
    <div className='flex justify-center pt-40'>
        {children}
    </div>
  )
}


export default AuthLayout;
// This is the nested layout page just for (auth) page and not for the whole app 