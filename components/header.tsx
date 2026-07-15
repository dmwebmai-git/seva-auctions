
'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Menu, 
  X, 
  Search,
  User,
  Settings,
  LogOut,
  Heart
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { canAccessAdmin } from '@/lib/roles'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession() || {}

  // Don't show header on auth pages
  if (pathname?.startsWith('/auth')) {
    return null
  }

  const navigation = [
    { name: 'Auctions', href: '/' },
    { name: 'About Us', href: '/about' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Nonprofits', href: '/nonprofits' },
    { name: 'Partner With Us', href: '/partner' },
  ]

  return (
    <header className="seva-header">
      <div className="seva-container">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="relative w-10 h-10">
                <Image
                  src="/logo.png"
                  alt="Seva Auctions logo"
                  fill
                  sizes="40px"
                  className="object-contain"
                  priority
                />
              </div>
              <div className="hidden sm:block">
                <div className="text-[#524C4C] font-bold text-lg">Seva Auctions</div>
                <div className="text-gray-500 text-xs">Bid for a Cause</div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'text-[#FF9A17] border-b-2 border-[#FF9A17] pb-1'
                      : 'text-[#524C4C] hover:text-[#94B957]'
                  }`}
                >
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Search - Desktop only */}
            <div className="hidden lg:flex items-center">
              <Button variant="ghost" size="icon" className="text-[#524C4C] hover:bg-gray-100">
                <Search className="w-5 h-5" />
              </Button>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              {session ? (
                <div
                  onMouseEnter={() => setUserMenuOpen(true)}
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-[#524C4C] hover:bg-gray-100 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="hidden md:inline">
                        {session.user?.firstName || session.user?.email?.split('@')[0]}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200 shadow-lg">
                    {canAccessAdmin(session.user?.role) && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center cursor-pointer text-[#524C4C] focus:bg-gray-100 focus:text-[#94B957]">
                          <Settings className="w-4 h-4 mr-2" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/profile?tab=saved" className="flex items-center cursor-pointer text-[#524C4C] focus:bg-gray-100 focus:text-[#94B957]">
                        <Heart className="w-4 h-4 mr-2" />
                        Saved Auctions
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center cursor-pointer text-[#524C4C] focus:bg-gray-100 focus:text-[#94B957]">
                        <User className="w-4 h-4 mr-2" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="flex items-center cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </div>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost" className="text-[#524C4C] hover:bg-gray-100">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button className="seva-button-primary">
                      Join Seva
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-[#524C4C] hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </nav>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white border-t border-gray-200"
          >
            <div className="seva-container py-4 space-y-3">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                      isActive
                        ? 'text-[#FF9A17] bg-gray-100'
                        : 'text-[#524C4C] hover:text-[#94B957] hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                )
              })}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
