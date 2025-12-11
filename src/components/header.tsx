import React from 'react'
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'

const Header = () => {
  return (
    <div className='flex justify-between'>
        {/* agar user signed out hai  */}
        <SignedOut>
              <SignInButton />
              <SignUpButton />
        </SignedOut>
        
        {/* agar user signed in hai */}
        <SignedIn>
              <UserButton />
        </SignedIn>
    </div>
  )
}

export default Header