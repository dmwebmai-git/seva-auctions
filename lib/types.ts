
// Extend the default session type
import { DefaultSession } from 'next-auth'
import { DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      firstName?: string
      lastName?: string
    } & DefaultSession['user']
  }

  interface User {
    role: string
    firstName?: string
    lastName?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    role: string
    firstName?: string
    lastName?: string
  }
}

// Golf Package Types
export interface GolfPackage {
  id: string
  title: string
  subHeader?: string | null
  courseAddress: string
  imageUrl: string
  additionalImages: string[]
  startingBid: number
  currentBid: number
  buyNowPrice: number
  bidIncrement: number
  bidDeadline: Date
  totalBids: number
  status: 'active' | 'sold' | 'expired'
  category: string
  isDemo: boolean
  attributes?: any
  packageDetails?: string | null
  bookingRestrictions?: string | null
  fairMarketValue: number
  supportsText?: string | null
  orgDisplay?: string | null
  supportsImages: string[]
  supportsLinks: string[]
  orgSharePercent?: number
  sponsorName?: string | null
  sponsorThanksText?: string | null
  sponsorWebUrl?: string | null
  sponsorSevaUrl?: string | null
  viewCount?: number
  state?: string | null
  city?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Bid {
  id: string
  amount: number
  userId: string
  packageId: string
  isWinning: boolean
  createdAt: Date
  user?: {
    firstName?: string | null
    lastName?: string | null
    email: string
  }
}

export interface PackageWithBids extends GolfPackage {
  bids: Bid[]
  _count: {
    bids: number
  }
}

// Form Types
export interface SignupFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  streetAddress: string
  phoneNumber: string
  acceptTerms: boolean
}

export interface LoginFormData {
  email: string
  password: string
}

// Filter Types
export interface PackageFilters {
  search?: string
  category?: string
  state?: string
  city?: string
  minPrice?: number
  maxPrice?: number
  sort?: 'ending-soon' | 'newly-listed' | 'highest-bid' | 'lowest-bid'
}

// Admin Types
export interface PackageFormData {
  title: string
  subHeader?: string
  category: string
  attributes?: Record<string, any>
  courseAddress: string
  imageFile?: File
  additionalImageFiles?: File[]
  startingBid: number
  buyNowPrice: number
  bidIncrement: number
  bidDuration: number // in hours
  packageDetails?: string
  bookingRestrictions?: string
  fairMarketValue: number
  supportsText?: string
  orgDisplay?: string
  supportsImages?: string[]
  supportsLinks?: string[]
  orgSharePercent?: number
  sponsorName?: string
  sponsorThanksText?: string
  sponsorWebUrl?: string
  sponsorSevaUrl?: string
  state?: string
  city?: string
}

// Terms and Conditions
export interface TermsAndConditions {
  id: string
  content: string
  version: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Content Page
export interface ContentPage {
  id: string
  slug: string
  title: string
  content: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Stripe Types
export interface StripeCheckoutData {
  packageId: string
  amount: number
  type: 'bid' | 'buy-now'
  userId: string
}

export interface PaymentSuccessData {
  packageId: string
  userId: string
  amount: number
  stripePaymentIntentId: string
}

// Notification Types
export interface BidNotification {
  id: string
  userId: string
  packageId: string
  packageTitle: string
  outbidAmount: number
  newHighBid: number
  createdAt: Date
  read: boolean
}

// AWS S3 Types
export interface S3UploadResult {
  url: string
  key: string
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Search and Filter Types
export interface SearchResult {
  packages: PackageWithBids[]
  totalCount: number
  totalPages: number
  currentPage: number
  filters: {
    categories: string[]
    states: string[]
    cities: string[]
    priceRange: {
      min: number
      max: number
    }
  }
}

// Time remaining utility type
export interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  expired: boolean
}
