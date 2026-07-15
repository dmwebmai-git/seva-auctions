
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const activeTerms = await prisma.termsAndConditions.findFirst({
      where: {
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (activeTerms) {
      return NextResponse.json({
        success: true,
        content: activeTerms.content,
        version: activeTerms.version,
        updatedAt: activeTerms.updatedAt
      })
    }

    // Return default terms if none exist in database
    const defaultTerms = `
      <h2>Terms and Conditions</h2>
      
      <h3>1. Acceptance of Terms</h3>
      <p>By using Seva Connect Golf auction platform, you agree to be bound by these Terms and Conditions.</p>
      
      <h3>2. User Accounts</h3>
      <p>You must provide accurate and complete information when creating an account. You are responsible for maintaining the security of your account credentials.</p>
      
      <h3>3. Bidding and Auctions</h3>
      <p>All bids are binding. By placing a bid, you agree to purchase the golf auction at that price if you are the winning bidder.</p>
      
      <h3>4. Buy It Now</h3>
      <p>Buy It Now purchases are immediate and final. No refunds are provided for Buy It Now purchases.</p>
      
      <h3>5. Payment</h3>
      <p>Payment must be made immediately upon winning an auction or making a Buy It Now purchase. We use Stripe for secure payment processing.</p>
      
      <h3>6. Golf Auction Details</h3>
      <p>Golf auctions are subject to availability and booking restrictions as specified in each listing. Contact the golf course directly to make your reservation.</p>
      
      <h3>7. User Conduct</h3>
      <p>Users must behave respectfully and not engage in shill bidding, fraud, or any other prohibited activities.</p>
      
      <h3>8. Privacy Policy</h3>
      <p>We respect your privacy and handle your personal information in accordance with applicable laws.</p>
      
      <h3>9. Limitation of Liability</h3>
      <p>Seva Connect Golf is not liable for any issues with golf courses or auctions beyond the auction platform itself.</p>
      
      <h3>10. Changes to Terms</h3>
      <p>We reserve the right to modify these terms at any time. Continued use of the platform constitutes acceptance of modified terms.</p>
      
      <p><strong>Last updated:</strong> ${new Date().toLocaleDateString()}</p>
    `

    return NextResponse.json({
      success: true,
      content: defaultTerms,
      version: '1.0',
      updatedAt: new Date()
    })
  } catch (error) {
    console.error('Get terms error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
