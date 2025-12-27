import React from "react"
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs"
import Link from "next/link"
import Image from "next/image"
import { Button } from "./ui/button"
import { LayoutDashboard, PenBox } from "lucide-react"
import { checkUser } from "@/lib/checkUser"
import { UserControl } from "./user-control"

const Header = async () => {
  await checkUser()

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="container mx-auto flex items-center justify-between px-4 py-4">

        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/cover.png"
            alt="Rupify Logo"
            width={100}
            height={100}
            className="h-12 w-32 object-contain"
          />
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-4">
          <SignedIn>
            <Link href="/dashboard">
              <Button variant="outline" className="gap-2">
                <LayoutDashboard size={18} />
                <span className="hidden md:inline">Dashboard</span>
              </Button>
            </Link>

            <Link href="/transaction/create">
              <Button className="gap-2">
                <PenBox size={18} />
                <span className="hidden md:inline">Add Transaction</span>
              </Button>
            </Link>
          </SignedIn>

          <SignedOut>
            <SignInButton forceRedirectUrl="/dashboard">
              <Button variant="outline">Login</Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <UserControl showName />
          </SignedIn>
        </div>
      </nav>
    </header>
  )
}

export default Header
