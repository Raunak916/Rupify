"use client"
import Link from 'next/link'
import React, { useEffect, useRef } from 'react'
import { Button } from './ui/button'
import Image from 'next/image'

const HeroSection = () => {

    const imageRef = useRef<HTMLDivElement | null>(null)
    useEffect(()=>{
        const imageElement = imageRef?.current

        if(!imageElement) return

        const handleScroll = ()=>{
            const theresold = 100
            const scrollPosition = window.scrollY

            if(scrollPosition > theresold){
                imageElement.classList.add('scrolled')
            }
            else{
                imageElement.classList.remove('scrolled')
            }
        }

        window.addEventListener("scroll",handleScroll)

        return ()=>{
            window.removeEventListener("scroll",handleScroll)
        }
    },[])


  return (
    <div className='pb-20 px-4'>
        <div className='container mx-auto text-center'>
            <h1 
            className='text-5xl mb-2 md:text-8xl lg:text-[105px] pb-6 gradient-title'>
                Manage your finances <br /> with Intelligence
            </h1>
            <p
            className='text-xl text-gray-600 mb-8 max-w-2xl mx-auto'>
                Rupify is a new way to manage your finances.
                An Ai powered platform to help you manage your finances with real time insights
            </p>
            <div>

                < Link href={'/dashboard'}>
                 <Button size={'lg'} className = 'px-8'>
                     Get Started
                 </Button>
                </Link>
                
            </div>
            
            <div className='hero-image-wrapper'>
                <div ref={imageRef} className='hero-image'>
                    <Image 
                     src={'/banner.jpeg'}
                     width={1280} 
                     height={720}
                     priority
                     alt='Dashboard Preview'
                     className='rounded-lg shadow-2xl border mx-auto'/>
                </div>
            </div>
        </div>
    </div>
  )
}

export default HeroSection