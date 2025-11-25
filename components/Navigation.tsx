'use client'

import { motion } from 'framer-motion'
import { MessageSquare, Users, Briefcase, Star } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavigationProps {
  activeSection?: string | null
  setActiveSection?: (section: string | null) => void
}

export default function Navigation({ activeSection, setActiveSection }: NavigationProps) {
  const pathname = usePathname()
  
  const navItems = [
    { id: 'chat', label: 'AI Chat', icon: MessageSquare, href: '/ai-chat' },
    { id: 'services', label: 'Services', icon: Briefcase, href: '/#services' },
    { id: 'team', label: 'Team', icon: Users, href: '/#team' },
    { id: 'clients', label: 'Clients', icon: Star, href: '/#clients' },
  ]

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.href.startsWith('/#')) {
      // Scroll to section on home page
      if (pathname === '/') {
        const section = item.href.replace('/#', '')
        setActiveSection?.(section)
        const element = document.getElementById(section)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      } else {
        // Navigate to home page section
        window.location.href = item.href
      }
    }
  }

  const isActive = (item: typeof navItems[0]) => {
    if (item.id === 'chat') {
      return pathname?.startsWith('/ai-chat')
    }
    return pathname === '/' && activeSection === item.id
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold gradient-text cursor-pointer"
            >
              Facevoice AI
            </motion.div>
          </Link>
          
          <div className="flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item)
              
              if (item.href.startsWith('/ai-chat')) {
                return (
                  <Link key={item.id} href={item.href}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg glass transition-all ${
                        active
                          ? 'text-coral-light border-coral-red border-2'
                          : 'text-coral hover:glass-strong'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="hidden sm:inline">{item.label}</span>
                    </motion.button>
                  </Link>
                )
              }
              
              return (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleNavClick(item)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg glass transition-all ${
                    active
                      ? 'text-coral-light border-coral-red border-2'
                      : 'text-coral hover:glass-strong'
                  }`}
                >
                  <Icon size={20} />
                  <span className="hidden sm:inline">{item.label}</span>
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}

