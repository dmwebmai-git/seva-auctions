
'use client'

import { useState, useEffect } from 'react'
import { TimeRemaining } from '@/lib/types'

interface CountdownTimerProps {
  deadline: Date
  className?: string
  compact?: boolean
  inline?: boolean
}

function calculateTimeRemaining(deadline: Date): TimeRemaining {
  const total = deadline.getTime() - new Date().getTime()
  
  if (total <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: true
    }
  }

  const days = Math.floor(total / (1000 * 60 * 60 * 24))
  const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((total % (1000 * 60)) / 1000)

  return {
    days,
    hours,
    minutes,
    seconds,
    expired: false
  }
}

export function CountdownTimer({ deadline, className = '', compact = false, inline = false }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTimeRemaining(calculateTimeRemaining(deadline))
  }, [deadline])

  useEffect(() => {
    if (!mounted) return

    const timer = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(deadline))
    }, 1000)

    return () => clearInterval(timer)
  }, [deadline, mounted])

  if (!mounted) {
    return (
      <div className={`text-[#94B957] ${className}`}>
        <div className="text-sm font-semibold">
          Loading...
        </div>
      </div>
    )
  }

  if (timeRemaining.expired) {
    return (
      <div className={`text-red-600 font-semibold ${className}`}>
        EXPIRED
      </div>
    )
  }

  const timeUnits = [
    { label: 'D', value: timeRemaining.days },
    { label: 'H', value: timeRemaining.hours },
    { label: 'M', value: timeRemaining.minutes },
    { label: 'S', value: timeRemaining.seconds },
  ]

  // Show different formats based on time remaining
  const formatTime = () => {
    if (timeRemaining.days > 0) {
      return `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m`
    } else if (timeRemaining.hours > 0) {
      return `${timeRemaining.hours}h ${timeRemaining.minutes}m ${timeRemaining.seconds}s`
    } else if (timeRemaining.minutes > 0) {
      return `${timeRemaining.minutes}m ${timeRemaining.seconds}s`
    } else {
      return `${timeRemaining.seconds}s`
    }
  }

  const isUrgent = timeRemaining.days === 0 && timeRemaining.hours < 2

  // Single-line inline format, e.g. "6:10:30:02" (days:hours:minutes:seconds)
  if (inline) {
    const pad = (n: number) => n.toString().padStart(2, '0')
    return (
      <span className={`text-xs font-medium ${isUrgent ? 'text-red-600' : 'text-[#524C4C]'} ${className}`}>
        {timeRemaining.days}:{pad(timeRemaining.hours)}:{pad(timeRemaining.minutes)}:{pad(timeRemaining.seconds)}
      </span>
    )
  }

  return (
    <div className={`seva-countdown ${isUrgent ? 'text-red-600' : 'text-[#94B957]'} ${className}`}>
      {/* Mobile friendly format */}
      <div className="md:hidden text-sm font-semibold">
        {formatTime()}
      </div>

      {/* Desktop grid format */}
      <div className={`hidden md:flex ${compact ? 'space-x-1.5' : 'space-x-2'}`}>
        {timeUnits.map((unit, index) => (
          <div key={unit.label} className="flex items-center">
            <div className={`text-center ${isUrgent ? 'text-red-600' : 'text-[#524C4C]'}`}>
              <div className={`${compact ? 'text-sm font-medium' : 'text-lg font-bold'} leading-none`}>
                {unit.value.toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-gray-500 uppercase">
                {unit.label}
              </div>
            </div>
            {index < timeUnits.length - 1 && (
              <div className={`mx-1 ${isUrgent ? 'text-red-600' : 'text-[#524C4C]'} ${compact ? 'font-medium' : 'font-bold'}`}>
                :
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
