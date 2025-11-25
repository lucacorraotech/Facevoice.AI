'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import Hero from '@/components/Hero'
import Services from '@/components/Services'
import Team from '@/components/Team'
import Clients from '@/components/Clients'
import LiquidGlass from '@/components/LiquidGlass'
import ThemeSwitcher from '@/components/ThemeSwitcher'

export default function Home() {
  const [activeSection, setActiveSection] = useState<string | null>(null)

  useEffect(() => {
    if (activeSection && activeSection !== 'chat') {
      const element = document.getElementById(activeSection)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [activeSection])

  return (
    <main className="min-h-screen relative">
      <LiquidGlass />
      <ThemeSwitcher />
      <Navigation 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
      />
      
      <Hero />
      <Services />
      <Team />
      <Clients />
    </main>
  )
}

