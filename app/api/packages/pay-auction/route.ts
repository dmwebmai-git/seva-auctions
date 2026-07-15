
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

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

    // Verify user won this auction
    const wonPackage = await prisma.wonPackage.findUnique({
      where: {
        userId_packageId: {
          userId: session.user.id,
          packageId: packageId,
        }
      },
      include: {
        package: true,
      }
    })

    if (!wonPackage) {
      return NextResponse.json(
        { success: false, error: 'You have not won this auction' },
        { status: 403 }
      )
    }

    if (wonPackage.paymentStatus === 'completed') {
      return NextResponse.json(
        { success: false, error: 'Payment has already been completed' },
        { status: 400 }
      )
    }

    const winningBid = Number(wonPackage.winningBid)
    const baseUrl = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'https://sevaconnectgolf.com'

    // Create Stripe checkout session for auction payment
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: wonPackage.package.title,
              description: `Auction win - ${wonPackage.package.subHeader || wonPackage.package.courseAddress}`,
              images: wonPackage.package.imageUrl ? [wonPackage.package.imageUrl] : []
            },
            unit_amount: Math.round(winningBid * 100)
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${baseUrl}/package/${packageId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/package/${packageId}/pay`,
      customer_email: session.user.email,
      metadata: {
        packageId: packageId,
        userId: session.user.id,
        packageTitle: wonPackage.package.title,
        transactionType: 'auction'
      }
    })

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url
    })

  } catch (error) {
    console.error('Error creating auction payment session:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create payment session' },
      { status: 500 }
    )
  }
}
