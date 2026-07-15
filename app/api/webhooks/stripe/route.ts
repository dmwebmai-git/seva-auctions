
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import Stripe from 'stripe'
import { sendNotificationEmail, buildPaymentConfirmationEmail, buildAdminSaleAlertEmail } from '@/lib/email'
import { syncDonationForPayment, syncAwardPointsForWin } from '@/lib/seva-sync'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const { packageId, userId, transactionType } = session.metadata || {}

      if (!packageId || !userId) {
        console.error('Missing metadata in checkout session')
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
      }

      const packageItem = await prisma.golfPackage.findUnique({
        where: { id: packageId }
      })

      if (!packageItem) {
        console.error('Package not found:', packageId)
        return NextResponse.json({ error: 'Package not found' }, { status: 404 })
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true, lastName: true }
      })

      const isAuction = transactionType === 'auction'
      const amountPaid = isAuction
        ? Number((await prisma.wonPackage.findUnique({
            where: { userId_packageId: { userId, packageId } }
          }))?.winningBid || 0)
        : Number(packageItem.buyNowPrice)

      if (isAuction) {
        // Auction payment: update existing WonPackage record
        await prisma.wonPackage.update({
          where: {
            userId_packageId: { userId, packageId }
          },
          data: {
            paymentStatus: 'completed',
            stripePaymentIntentId: session.payment_intent as string,
          }
        })
      } else {
        // Buy-now: only process if still active
        if (packageItem.status === 'active') {
          await prisma.$transaction(async (tx) => {
            await tx.wonPackage.create({
              data: {
                userId,
                packageId,
                winningBid: Number(packageItem.buyNowPrice),
                paymentStatus: 'completed',
                stripePaymentIntentId: session.payment_intent as string,
              }
            })

            await tx.golfPackage.update({
              where: { id: packageId },
              data: { status: 'sold' }
            })

            await tx.bid.updateMany({
              where: { packageId },
              data: { isWinning: false }
            })
          })
        } else {
          console.log('Package already sold, skipping:', packageId)
          return NextResponse.json({ received: true })
        }
      }

      // Send payment confirmation to buyer
      if (user?.email) {
        try {
          await sendNotificationEmail({
            notificationId: process.env.NOTIF_ID_PAYMENT_CONFIRMATION!,
            recipientEmail: user.email,
            subject: `Payment Confirmed - ${packageItem.title}`,
            htmlBody: buildPaymentConfirmationEmail({
              packageTitle: packageItem.title,
              amountPaid,
              courseAddress: packageItem.courseAddress,
              transactionType: isAuction ? 'auction' : 'buy-now',
            }),
          })
        } catch (e) {
          console.error('Failed to send payment confirmation email:', e)
        }
      }

      // Send sale alert to admin
      try {
        await sendNotificationEmail({
          notificationId: process.env.NOTIF_ID_NEW_SALE_ALERT!,
          recipientEmail: 'dmwebmai@gmail.com',
          subject: `New Sale: ${packageItem.title}`,
          htmlBody: buildAdminSaleAlertEmail({
            packageTitle: packageItem.title,
            buyerEmail: user?.email || 'Unknown',
            amount: amountPaid,
            transactionType: isAuction ? 'auction' : 'buy-now',
          }),
        })
      } catch (e) {
        console.error('Failed to send admin sale alert:', e)
      }

      // For buy-now, the win happens at payment time, so award points here.
      // (Auction wins are awarded earlier, at settlement.) No-op unless a Seva
      // connection with consumer:write is configured and the buyer is linked.
      if (!isAuction) {
        await syncAwardPointsForWin(userId, amountPaid, packageItem.title)
      }

      // Record the give-back to the member's chosen Seva organization now that a
      // winning bid has actually been paid. No-op unless a Seva connection with
      // donation:write (+ consumer:read to resolve the org) is configured and the
      // buyer is linked to Seva with a chosen organization.
      await syncDonationForPayment({
        userId,
        amount: amountPaid,
        packageTitle: packageItem.title,
        paymentIntentId: session.payment_intent as string,
      })

      console.log(`Successfully processed ${isAuction ? 'auction' : 'buy-now'} payment for package:`, packageId)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
