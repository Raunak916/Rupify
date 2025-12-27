"use client"
import Link from "next/link"
import React, { useEffect, useRef } from "react"
import { Button } from "./ui/button"
import Image from "next/image"

const HeroSection = () => {
  const imageRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const imageElement = imageRef.current
    if (!imageElement) return

    const handleScroll = () => {
      const threshold = 100
      const scrollPosition = window.scrollY

      if (scrollPosition > threshold) {
        imageElement.classList.add("scrolled")
      } else {
        imageElement.classList.remove("scrolled")
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <section className="px-4 pb-20">
      <div className="container mx-auto text-center">
        <h1 className="gradient-title mb-2 pb-6 text-5xl md:text-8xl lg:text-[105px]">
          Manage your finances <br /> with Intelligence
        </h1>

        <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
          Rupify is a new way to manage your finances.
          An AI powered platform to help you manage your finances with real time insights.
        </p>

        <div>
          <Link href="/dashboard">
            <Button size="lg" className="px-8">
              Get Started
            </Button>
          </Link>
        </div>

        <div className="hero-image-wrapper">
          <div ref={imageRef} className="hero-image">
            <Image
              src="/banner.jpeg"
              width={1280}
              height={720}
              priority
              alt="Dashboard Preview"
              className="mx-auto rounded-lg border border-border shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
