import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create admin user (john@doe.com / johndoe123) - required by guidelines
  const hashedPassword = await bcrypt.hash('johndoe123', 10)

  const adminUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: { role: 'super_admin' },
    create: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@doe.com',
      password: hashedPassword,
      streetAddress: '123 Admin Street',
      phoneNumber: '+1-555-0123',
      acceptTerms: true,
      role: 'super_admin',
    },
  })
  console.log('✅ Admin user created:', adminUser.email)

  // Create a test user
  const testUserPassword = await bcrypt.hash('password123', 10)
  const testUser = await prisma.user.upsert({
    where: { email: 'test@sevaconnect.com' },
    update: {},
    create: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@sevaconnect.com',
      password: testUserPassword,
      streetAddress: '456 Market Street',
      phoneNumber: '+1-555-0456',
      acceptTerms: true,
      role: 'user',
    },
  })
  console.log('✅ Test user created:', testUser.email)

  // Create default terms and conditions
  const termsContent = `
        <h2>Terms and Conditions</h2>

        <h3>1. Acceptance of Terms</h3>
        <p>By using the Seva Auctions platform, you agree to be bound by these Terms and Conditions.</p>

        <h3>2. User Accounts</h3>
        <p>You must provide accurate and complete information when creating an account. You are responsible for maintaining the security of your account credentials.</p>

        <h3>3. Bidding and Auctions</h3>
        <p>All bids are binding. By placing a bid, you agree to purchase the item at that price if you are the winning bidder.</p>

        <h3>4. Buy It Now</h3>
        <p>Buy It Now purchases are immediate and final. No refunds are provided for Buy It Now purchases.</p>

        <h3>5. Payment</h3>
        <p>Payment must be made immediately upon winning an auction or making a Buy It Now purchase. We use Stripe for secure payment processing.</p>

        <h3>6. Item Details</h3>
        <p>All items are subject to availability and the booking or redemption restrictions specified in each listing. Follow the redemption instructions provided to claim your item or experience.</p>

        <h3>7. User Conduct</h3>
        <p>Users must behave respectfully and not engage in shill bidding, fraud, or any other prohibited activities.</p>

        <h3>8. Privacy Policy</h3>
        <p>We respect your privacy and handle your personal information in accordance with applicable laws.</p>

        <h3>9. Limitation of Liability</h3>
        <p>Seva Auctions is not liable for any issues with the items, providers, or experiences beyond the auction platform itself.</p>

        <h3>10. Changes to Terms</h3>
        <p>We reserve the right to modify these terms at any time. Continued use of the platform constitutes acceptance of modified terms.</p>

        <p><strong>Last updated:</strong> ${new Date().toLocaleDateString('en-US', { timeZone: 'UTC' })}</p>
      `
  await prisma.termsAndConditions.upsert({
    where: { id: 'default-terms' },
    update: { content: termsContent },
    create: {
      id: 'default-terms',
      content: termsContent,
      version: '1.0',
      isActive: true,
    },
  })
  console.log('✅ Terms and conditions created')

  // Create content pages
  const contentPages = [
    {
      slug: 'about-us',
      title: 'About Us',
      content: `
        <h1>About Seva Auctions</h1>
        <p>Welcome to Seva Auctions, an online marketplace where extraordinary items and experiences meet meaningful impact. From luxury travel and unforgettable events to one-of-a-kind experiences and premium products, every auction connects you with something special while supporting charitable causes.</p>

        <h2>Our Mission</h2>
        <p>To make remarkable items and experiences accessible through innovative auction technology while creating positive impact in communities around the world.</p>

        <h2>Why Choose Seva Auctions?</h2>
        <ul>
          <li>A diverse catalog spanning travel, sports, entertainment, dining, technology, and more</li>
          <li>Dual bidding system: traditional auctions and instant buy options</li>
          <li>Every purchase supports charitable organizations</li>
          <li>Transparent, secure bidding process</li>
          <li>World-class customer service</li>
        </ul>

        <h2>Our Story</h2>
        <p>Founded by people who believe in the power of generosity, Seva Auctions brings together exceptional offerings and great causes — so every bid helps make a difference.</p>
      `,
      isActive: true,
    },
    {
      slug: 'how-it-works',
      title: 'How It Works',
      content: `
        <h1>How Seva Auctions Works</h1>
        <p>Our platform makes it easy to bid on and purchase exceptional items and experiences. Here's your step-by-step guide:</p>

        <h2>1. Browse &amp; Discover</h2>
        <p>Explore our curated catalog across many categories. Use our filters to find items and experiences that match your interests.</p>

        <h2>2. Two Ways to Purchase</h2>

        <h3>Option A: Auction Bidding</h3>
        <ul>
          <li>Place competitive bids on listings that interest you</li>
          <li>Monitor real-time auction progress</li>
          <li>Receive notifications if you're outbid</li>
          <li>Win by having the highest bid when time expires</li>
        </ul>

        <h3>Option B: Buy It Now</h3>
        <ul>
          <li>Skip the auction and purchase instantly</li>
          <li>Secure your item or experience immediately</li>
          <li>Perfect for last-minute opportunities</li>
        </ul>

        <h2>3. Secure Payment</h2>
        <p>Complete your purchase using our secure Stripe payment processing. All transactions are protected and encrypted.</p>

        <h2>4. Redeem Your Item</h2>
        <p>Receive redemption instructions and any contact details needed to claim your item or schedule your experience.</p>

        <h2>5. Support Great Causes</h2>
        <p>Every purchase contributes to charitable organizations. See the specific cause each listing supports on its detail page.</p>

        <h2>Bidding Tips</h2>
        <ul>
          <li>Set a maximum budget before you start bidding</li>
          <li>Monitor auctions closely as they near completion</li>
          <li>Consider the "Buy It Now" option for listings you really want</li>
          <li>Read all listing details and restrictions carefully</li>
        </ul>
      `,
      isActive: true,
    },
    {
      slug: 'nonprofits',
      title: 'Nonprofit Partners',
      content: `
        <h1>Supporting Great Causes</h1>
        <p>At Seva Auctions, every auction supports a charitable cause. We're proud to partner with organizations making a positive impact in communities worldwide.</p>

        <h2>Our Impact</h2>
        <p>Our community has raised significant funds for a wide range of charitable organizations through auction purchases.</p>

        <h2>Featured Nonprofit Partners</h2>

        <div class="nonprofit-card">
          <h3>Community Foundations</h3>
          <p>Supporting grassroots organizations making a difference in their local communities.</p>
        </div>

        <div class="nonprofit-card">
          <h3>Wounded Warrior Project</h3>
          <p>Honoring and empowering wounded warriors through innovative programs and services.</p>
        </div>

        <div class="nonprofit-card">
          <h3>Youth &amp; Education Initiatives</h3>
          <p>Building character and opportunity for young people through mentorship and access to enriching experiences.</p>
        </div>

        <h2>How It Works</h2>
        <p>When you bid on or purchase a listing, a percentage of the proceeds goes directly to the designated nonprofit partner. Each listing clearly identifies which organization benefits from your purchase.</p>

        <h2>Partner With Us</h2>
        <p>Are you a nonprofit organization interested in partnering with Seva Auctions? We're always looking to expand our network of charitable partners.</p>

        <p>Contact us at partnerships@sevaauctions.com to learn about opportunities.</p>
      `,
      isActive: true,
    },
    {
      slug: 'partner-with-us',
      title: 'Partner With Us',
      content: `
        <h1>Partner With Seva Auctions</h1>
        <p>Join our growing network of sellers, providers, and charitable partners. Together, we can create unforgettable experiences while making a positive impact.</p>

        <h2>Seller &amp; Provider Partnerships</h2>
        <p>Share your exceptional items and experiences with our engaged community of bidders.</p>

        <h3>Benefits for Partners:</h3>
        <ul>
          <li>Reach new customers through our targeted platform</li>
          <li>Flexible listing creation and pricing</li>
          <li>Marketing support and promotion</li>
          <li>Support charitable causes in your community</li>
          <li>No upfront costs or fees</li>
        </ul>

        <h3>What We Look For:</h3>
        <ul>
          <li>High-quality items and experiences</li>
          <li>Outstanding customer service standards</li>
          <li>Unique offerings across any category</li>
          <li>Commitment to supporting charitable causes</li>
        </ul>

        <h2>Nonprofit Partnerships</h2>
        <p>Expand your fundraising reach through our auction platform.</p>

        <h3>Benefits for Nonprofits:</h3>
        <ul>
          <li>New revenue stream through auctions</li>
          <li>Exposure to an engaged, philanthropic audience</li>
          <li>Transparent reporting and regular payouts</li>
          <li>Marketing support for your cause</li>
        </ul>

        <h2>Get Started</h2>
        <p>Ready to partner with us? We'd love to hear from you!</p>

        <div class="contact-info">
          <h3>Contact Information</h3>
          <p><strong>Seller Partnerships:</strong> sellers@sevaauctions.com</p>
          <p><strong>Nonprofit Partnerships:</strong> nonprofits@sevaauctions.com</p>
          <p><strong>General Inquiries:</strong> partnerships@sevaauctions.com</p>
        </div>

        <h2>Application Process</h2>
        <ol>
          <li>Submit your partnership application</li>
          <li>Schedule a consultation call</li>
          <li>Complete our partner verification process</li>
          <li>Set up your first auction listing</li>
          <li>Launch and promote your offering</li>
        </ol>
      `,
      isActive: true,
    },
  ]

  for (const page of contentPages) {
    await prisma.contentPage.upsert({
      where: { slug: page.slug },
      update: { title: page.title, content: page.content, isActive: page.isActive },
      create: page,
    })
    console.log(`✅ Content page created: ${page.title}`)
  }

  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
