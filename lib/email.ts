
export async function sendNotificationEmail({
  notificationId,
  recipientEmail,
  subject,
  htmlBody,
  replyTo,
}: {
  notificationId: string
  recipientEmail: string
  subject: string
  htmlBody: string
  replyTo?: string
}) {
  try {
    const appUrl = process.env.NEXTAUTH_URL || ''
    const appName = 'Seva Connect Golf'
    let senderEmail = 'noreply@mail.abacusai.app'
    try {
      senderEmail = `noreply@${new URL(appUrl).hostname}`
    } catch {}

    const response = await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        app_id: process.env.WEB_APP_ID,
        notification_id: notificationId,
        subject,
        body: htmlBody,
        is_html: true,
        recipient_email: recipientEmail,
        sender_email: senderEmail,
        sender_alias: appName,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    })

    const result = await response.json()
    if (!result.success && !result.notification_disabled) {
      console.error('Failed to send notification email:', result)
    }
    return result
  } catch (error) {
    console.error('Error sending notification email:', error)
    return { success: false }
  }
}

export function buildAuctionWonEmail({
  packageTitle,
  winningBid,
  paymentUrl,
  courseAddress,
}: {
  packageTitle: string
  winningBid: number
  paymentUrl: string
  courseAddress: string
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
      <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background: #6BA593; color: white; padding: 12px 24px; border-radius: 50%; font-size: 28px;">🏆</div>
        </div>
        <h1 style="color: #524C4C; text-align: center; margin-bottom: 8px;">Congratulations!</h1>
        <p style="color: #6BA593; text-align: center; font-size: 18px; font-weight: 600; margin-bottom: 24px;">You Won the Auction!</p>
        
        <div style="background: #f0faf6; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <p style="margin: 8px 0; color: #333;"><strong>Auction:</strong> ${packageTitle}</p>
          <p style="margin: 8px 0; color: #333;"><strong>Location:</strong> ${courseAddress}</p>
          <p style="margin: 8px 0; color: #333;"><strong>Winning Bid:</strong> $${winningBid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        
        <p style="color: #666; margin-bottom: 24px;">Please complete your payment within 48 hours to secure your auction.</p>
        
        <div style="text-align: center;">
          <a href="${paymentUrl}" style="display: inline-block; background: #6BA593; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Complete Payment</a>
        </div>
        
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">
          If you have any questions, please contact us at support@sevaconnectgolf.com
        </p>
      </div>
    </div>
  `
}

export function buildOutbidEmail({
  packageTitle,
  previousBid,
  newBid,
  packageUrl,
}: {
  packageTitle: string
  previousBid: number
  newBid: number
  packageUrl: string
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
      <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="color: #524C4C; margin-bottom: 16px;">You've Been Outbid!</h2>
        
        <div style="background: #fef2f2; padding: 16px; border-radius: 8px; border-left: 4px solid #ef4444; margin-bottom: 20px;">
          <p style="margin: 4px 0; color: #333;"><strong>${packageTitle}</strong></p>
          <p style="margin: 4px 0; color: #666;">Your bid: $${previousBid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p style="margin: 4px 0; color: #666;">New highest bid: $${newBid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        
        <p style="color: #666; margin-bottom: 20px;">Don't miss out! Place a higher bid to stay in the running.</p>
        
        <div style="text-align: center;">
          <a href="${packageUrl}" style="display: inline-block; background: #6BA593; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Place New Bid</a>
        </div>
      </div>
    </div>
  `
}

export function buildPaymentConfirmationEmail({
  packageTitle,
  amountPaid,
  courseAddress,
  transactionType,
}: {
  packageTitle: string
  amountPaid: number
  courseAddress: string
  transactionType: 'auction' | 'buy-now'
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
      <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; border-radius: 50%; font-size: 28px;">✓</div>
        </div>
        <h1 style="color: #524C4C; text-align: center; margin-bottom: 8px;">Payment Confirmed!</h1>
        <p style="color: #22c55e; text-align: center; font-size: 16px; font-weight: 600; margin-bottom: 24px;">Your auction is secured</p>
        
        <div style="background: #f0faf6; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <p style="margin: 8px 0; color: #333;"><strong>Auction:</strong> ${packageTitle}</p>
          <p style="margin: 8px 0; color: #333;"><strong>Location:</strong> ${courseAddress}</p>
          <p style="margin: 8px 0; color: #333;"><strong>Amount Paid:</strong> $${amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p style="margin: 8px 0; color: #333;"><strong>Type:</strong> ${transactionType === 'auction' ? 'Auction Win' : 'Buy Now'}</p>
        </div>
        
        <p style="color: #666;">Please contact the golf course directly to schedule your tee time. Present this confirmation email when booking.</p>
        
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">
          If you have questions, contact us at support@sevaconnectgolf.com
        </p>
      </div>
    </div>
  `
}

export function buildAdminSaleAlertEmail({
  packageTitle,
  buyerEmail,
  amount,
  transactionType,
}: {
  packageTitle: string
  buyerEmail: string
  amount: number
  transactionType: 'auction' | 'buy-now'
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
      <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="color: #524C4C; margin-bottom: 16px;">💰 New Sale!</h2>
        
        <div style="background: #f0faf6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 8px 0;"><strong>Auction:</strong> ${packageTitle}</p>
          <p style="margin: 8px 0;"><strong>Buyer:</strong> ${buyerEmail}</p>
          <p style="margin: 8px 0;"><strong>Amount:</strong> $${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p style="margin: 8px 0;"><strong>Type:</strong> ${transactionType === 'auction' ? 'Auction Win' : 'Buy Now'}</p>
        </div>
      </div>
    </div>
  `
}
