'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Clock, DollarSign, Users } from 'lucide-react'
import Link from 'next/link'
import { CATEGORIES } from '@/lib/categories'

interface SiteSettings {
  raisedForCharity: string
  activeAuctions: string
  premiumCourses: string
  happyGolfers: string
}

// Rotating backdrop images drawn from the live auction categories
const HERO_IMAGES = [
  'https://assets.vogue.com/photos/67699491eff780a095e5fe1b/master/w_1600%2Cc_limit/Soneva-Secret-Overwater-Hideaway-3-1600x900.jpg',
  'https://www.datocms-assets.com/164287/1769723333-ferrari-488-3.jpg?auto=compress%2Cformat',
  'https://media.cntraveller.com/photos/69e79ba9837f2dc69d19c372/16:9/w_2560%2Cc_limit/villa-la-vedetta-maremma-tuscany-april-2026-pr-global.jpg',
  'https://golfstayandplays.com/wp-content/uploads/2021/02/Pebble-Beach-Golf-Links-7th-Hole-Photo-Credit-Bart-Keagy-1.jpg',
  'https://www.dylanstours.com/wp-content/uploads/2025/10/Common-Questions-About-Napa-Valley-Wine-Tasting.webp',
]

// Emoji glyph per category slug for the quick-access pills
const CATEGORY_EMOJI: Record<string, string> = {
  'travel-leisure': '✈️',
  'golf-country-club': '⛳',
  'sports-athletics': '🏀',
  'entertainment-arts': '🎭',
  'outdoor-adventure': '🏔️',
  'automotive': '🏎️',
  'food-wine': '🍷',
  'technology-electronics': '💻',
  'health-wellness': '🧘',
  'unique-experiences': '🎈',
}

// Homepage quick-access categories: explicit display order + custom labels.
// The href still targets each category's real stored name for correct filtering.
const HERO_CATEGORIES: { slug: string; label: string }[] = [
  { slug: 'entertainment-arts', label: 'Entertainment & Arts' },
  { slug: 'food-wine', label: 'Food & Drink' },
  { slug: 'golf-country-club', label: 'Golf Auctions' },
  { slug: 'health-wellness', label: 'Health & Wellness' },
  { slug: 'sports-athletics', label: 'Sports & Outdoors' },
  { slug: 'technology-electronics', label: 'Technology' },
  { slug: 'travel-leisure', label: 'Travel & Leisure' },
  { slug: 'unique-experiences', label: 'Unique Experiences' },
]

// Animated number that counts up from 0 while preserving any prefix/suffix
function CountUp({ value, duration = 1600 }: { value: string; duration?: number }) {
  const [display, setDisplay] = useState(value)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const match = value.match(/^([^\d]*)([\d.,]+)(.*)$/)
    if (!match) {
      setDisplay(value)
      return
    }
    const prefix = match[1] || ''
    const numericRaw = match[2].replace(/,/g, '')
    const suffix = match[3] || ''
    const target = parseFloat(numericRaw)
    const decimals = numericRaw.includes('.') ? (numericRaw.split('.')[1]?.length ?? 0) : 0

    if (isNaN(target)) {
      setDisplay(value)
      return
    }

    const run = () => {
      if (started.current) return
      started.current = true
      const start = performance.now()
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
        const current = target * eased
        const formatted = decimals > 0 ? current.toFixed(decimals) : Math.round(current).toLocaleString()
        setDisplay(`${prefix}${formatted}${suffix}`)
        if (progress < 1) requestAnimationFrame(tick)
        else setDisplay(value)
      }
      requestAnimationFrame(tick)
    }

    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      run()
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          run()
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [value, duration])

  return <span ref={ref}>{display}</span>
}

export function HeroSection() {
  const [settings, setSettings] = useState<SiteSettings>({
    raisedForCharity: '$127K',
    activeAuctions: '48',
    premiumCourses: '95+',
    happyGolfers: '2.3K',
  })
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setSettings({
            raisedForCharity: data.raisedForCharity || '$127K',
            activeAuctions: data.activeAuctions || '48',
            premiumCourses: data.premiumCourses || '95+',
            happyGolfers: data.happyGolfers || '2.3K',
          })
        }
      })
      .catch((error) => {
        console.error('Error fetching settings:', error)
      })
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % HERO_IMAGES.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative overflow-hidden">
      {/* Crossfading image backdrop */}
      <div className="absolute inset-0">
        <AnimatePresence>
          <motion.div
            key={activeImage}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 1.4 }, scale: { duration: 6, ease: 'linear' } }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${HERO_IMAGES[activeImage]})` }}
          />
        </AnimatePresence>
      </div>

      {/* Single uniform overlay across the entire image for consistent legibility */}
      <div className="absolute inset-0 bg-[#332E28]/75" />

      <div className="seva-container relative z-10 py-14 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.2 }}
                className="w-20 h-20 bg-gradient-to-br from-[#FF9A17] to-[#FFC266] rounded-full flex items-center justify-center shadow-lg shadow-black/20"
              >
                <Trophy className="w-10 h-10 text-white" />
              </motion.div>
            </div>

            <h1 className="seva-heading-xl text-white mb-6 max-w-4xl mx-auto drop-shadow-md">
              Bid on{' '}
              <span className="bg-gradient-to-r from-[#FFC266] to-[#FF9A17] bg-clip-text text-transparent">
                Extraordinary
              </span>{' '}
              Experiences That Support Great Causes
            </h1>

            <p className="text-xl text-gray-100 mb-8 max-w-4xl mx-auto leading-relaxed drop-shadow">
              Discover one-of-a-kind auctions across travel, sports, dining, technology and more.
              Bid smart or buy instantly — every listing supports a great cause.
            </p>

            {/* Category quick-access pills — two rows of four */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-5xl mx-auto"
            >
              {HERO_CATEGORIES.map(({ slug, label }) => {
                const cat = CATEGORIES.find((c) => c.slug === slug)
                if (!cat) return null
                return (
                  <Link
                    key={slug}
                    href={`/?category=${encodeURIComponent(cat.name)}#packages`}
                    className="group inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/15 hover:bg-white text-white hover:text-[#524C4C] backdrop-blur-md border border-white/30 text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg whitespace-nowrap"
                  >
                    <span aria-hidden="true">{CATEGORY_EMOJI[slug] ?? '✨'}</span>
                    {label}
                  </Link>
                )
              })}
            </motion.div>
          </div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-5 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20"
          >
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Clock className="w-6 h-6 text-[#FFC266]" />
              </div>
              <div className="text-2xl font-bold text-white mb-0.5">
                <CountUp value={settings.activeAuctions} />
              </div>
              <div className="text-xs text-gray-200">Active Auctions</div>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-2">
                <DollarSign className="w-6 h-6 text-[#FFC266]" />
              </div>
              <div className="text-2xl font-bold text-white mb-0.5">
                <CountUp value={settings.raisedForCharity} />
              </div>
              <div className="text-xs text-gray-200">Raised for Charity</div>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Trophy className="w-6 h-6 text-[#FFC266]" />
              </div>
              <div className="text-2xl font-bold text-white mb-0.5">
                <CountUp value={settings.premiumCourses} />
              </div>
              <div className="text-xs text-gray-200">Exclusive Listings</div>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Users className="w-6 h-6 text-[#FFC266]" />
              </div>
              <div className="text-2xl font-bold text-white mb-0.5">
                <CountUp value={settings.happyGolfers} />
              </div>
              <div className="text-xs text-gray-200">Happy Bidders</div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative slide indicators */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {HERO_IMAGES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Show backdrop ${i + 1}`}
            onClick={() => setActiveImage(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === activeImage ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
