
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover'
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { packageId } = body

    if (!packageId) {
      return NextResponse.json(
        { success: false, error: 'Auction ID is required' },
        { status: 400 }
      )
    }

    // Get the package
    const packageItem = await prisma.golfPackage.findUnique({
      where: { id: packageId }
    })

    if (!packageItem) {
      return NextResponse.json(
        { success: false, error: 'Auction not found' },
        { status: 404 }
      )
    }

    // Demo auctions cannot be purchased
    if (packageItem.isDemo) {
      return NextResponse.json(
        { success: false, error: 'This is a demo auction and cannot be purchased' },
        { status: 400 }
      )
    }

    // Check if auction is still active
    if (packageItem.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'This auction is no longer available' },
        { status: 400 }
      )
    }

    // Check if auction has expired
    if (new Date(packageItem.bidDeadline) <= new Date()) {
      return NextResponse.json(
        { success: false, error: 'This auction has expired' },
        { status: 400 }
      )
    }

    const buyNowPrice = Number(packageItem.buyNowPrice)
    const baseUrl = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000'

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: packageItem.title,
              description: packageItem.subHeader || `Golf package at ${packageItem.courseAddress}`,
              images: packageItem.imageUrl ? [packageItem.imageUrl] : []
            },
            unit_amount: Math.round(buyNowPrice * 100) // Convert to cents
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${baseUrl}/package/${packageId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/package/${packageId}`,
      customer_email: session.user.email,
      metadata: {
        packageId: packageId,
        userId: session.user.id,
        packageTitle: packageItem.title,
        transactionType: 'buy-now'
      }
    })

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url
    })

  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
