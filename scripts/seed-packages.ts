import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📦 Starting sample listings seeding...')

  const listings = [
    {
      title: 'Maldives Overwater Villa Escape – 5 Nights',
      subHeader: 'Private overwater bungalow with sunset views and full board',
      category: 'Travel & Leisure',
      attributes: {
        destination: 'Maldives',
        nights: 5,
        occupancy: '2 adults',
        travelWindow: 'Valid 12 months, excludes Dec 20 – Jan 5',
        inclusions: 'Overwater villa, daily breakfast & dinner, airport speedboat transfers',
      },
      courseAddress: 'North Malé Atoll, Maldives',
      imageUrl: 'https://assets.vogue.com/photos/67699491eff780a095e5fe1b/master/w_1600%2Cc_limit/Soneva-Secret-Overwater-Hideaway-3-1600x900.jpg',
      startingBid: 2500, currentBid: 3200, buyNowPrice: 6500, bidIncrement: 100,
      bidDeadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), totalBids: 7, status: 'active',
      packageDetails: 'Five unforgettable nights in a private overwater villa, with daily breakfast and dinner and seamless speedboat transfers from the airport.',
      bookingRestrictions: 'Advance reservation required. Subject to availability. Airfare not included.',
      fairMarketValue: 6000,
      supportsText: 'This auction supports clean-ocean conservation initiatives.',
      supportsLinks: ['https://oceanconservancy.org'],
      state: 'International', city: 'Malé',
    },
    {
      title: 'Pebble Beach Golf Links – Premium Round for 4',
      subHeader: "Iconic oceanside finish at America's most scenic course",
      category: 'Golf & Country Club',
      attributes: {
        numberOfPlayers: 4,
        numberOfRounds: 1,
        courseName: 'Pebble Beach Golf Links',
        cartIncluded: 'Yes',
        aboutCourse: 'Host of six U.S. Opens, designed by Jack Neville and Douglas Grant.',
      },
      courseAddress: '1700 17-Mile Dr, Pebble Beach, CA 93953',
      imageUrl: 'https://golfstayandplays.com/wp-content/uploads/2021/02/Pebble-Beach-Golf-Links-7th-Hole-Photo-Credit-Bart-Keagy-1.jpg',
      startingBid: 1200, currentBid: 1450, buyNowPrice: 2500, bidIncrement: 50,
      bidDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), totalBids: 8, status: 'active',
      packageDetails: 'A full 18-hole round for four at the legendary Pebble Beach Golf Links, including carts and access to the practice facilities.',
      bookingRestrictions: 'Advance reservation required. Valid 12 months. Subject to course availability and weather.',
      fairMarketValue: 2200,
      supportsText: 'Supports The First Tee Monterey County youth golf programs.',
      supportsLinks: ['https://thefirstteemonterey.org'],
      state: 'California', city: 'Pebble Beach',
    },
    {
      title: 'NBA Courtside Experience for 2',
      subHeader: 'Courtside seats with VIP arena access',
      category: 'Sports & Athletics',
      attributes: {
        eventName: 'Regular Season NBA Game',
        numberOfTickets: 2,
        seatLocation: 'Courtside, lower bowl',
        eventDate: 'Mutually scheduled during the season',
      },
      courseAddress: 'Downtown Arena District',
      imageUrl: 'https://robbreport.com/wp-content/uploads/2024/04/Basketball_MC10.jpg?w=1024',
      startingBid: 900, currentBid: 1150, buyNowPrice: 2200, bidIncrement: 50,
      bidDeadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), totalBids: 11, status: 'active',
      packageDetails: 'Two courtside seats to a regular-season NBA game with VIP entrance and in-arena hospitality.',
      bookingRestrictions: 'Subject to schedule and availability. Specific game to be confirmed with winner.',
      fairMarketValue: 2000,
      supportsText: 'Proceeds support youth sports access programs.',
      supportsLinks: [],
      state: 'California', city: 'Los Angeles',
    },
    {
      title: 'Broadway Opening Night – 2 Premium Tickets',
      subHeader: 'Orchestra seats to a hit Broadway production',
      category: 'Entertainment & Arts',
      attributes: {
        eventName: 'Award-Winning Broadway Musical',
        numberOfTickets: 2,
        venue: 'Historic Broadway Theater, NYC',
        eventDate: 'Flexible, based on availability',
      },
      courseAddress: 'Theater District, New York, NY',
      imageUrl: 'https://www.dlrgroup.com/media/53_14052_30_N73_header-1536x864.jpg',
      startingBid: 400, currentBid: 560, buyNowPrice: 1100, bidIncrement: 20,
      bidDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), totalBids: 6, status: 'active',
      packageDetails: 'Two premium orchestra seats to a celebrated Broadway production, an unforgettable night in the heart of the Theater District.',
      bookingRestrictions: 'Dates subject to availability. Tickets non-transferable.',
      fairMarketValue: 950,
      supportsText: 'Supports arts education for underserved communities.',
      supportsLinks: [],
      state: 'New York', city: 'New York',
    },
    {
      title: 'Whitewater Rafting Adventure for 4',
      subHeader: 'Guided full-day rafting on scenic mountain rapids',
      category: 'Outdoor & Adventure',
      attributes: {
        activity: 'Whitewater Rafting',
        participants: 4,
        duration: 'Full day (6 hours)',
        difficulty: 'Intermediate (Class III–IV)',
        gearProvided: 'Yes – helmet, paddle, wetsuit and PFD included',
      },
      courseAddress: 'Lehigh Gorge, Pocono Mountains, PA',
      imageUrl: 'https://www.poconowhitewater.com/wp-content/uploads/2026/03/hero-desktop-dam-release-whitewater.jpg',
      startingBid: 300, currentBid: 380, buyNowPrice: 750, bidIncrement: 15,
      bidDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), totalBids: 5, status: 'active',
      packageDetails: 'A guided full-day whitewater rafting adventure for four, with all safety gear and an experienced river guide included.',
      bookingRestrictions: 'Seasonal (spring–fall). Minimum age 12. Weather dependent.',
      fairMarketValue: 640,
      supportsText: 'Supports river and watershed conservation.',
      supportsLinks: [],
      state: 'Pennsylvania', city: 'Jim Thorpe',
    },
    {
      title: 'Exotic Supercar Track Day Experience',
      subHeader: 'Drive a Ferrari on a professional racetrack',
      category: 'Automotive',
      attributes: {
        make: 'Ferrari',
        model: '488 GTB',
        year: 2022,
        experienceType: 'Guided track-day driving experience',
        durationOrMileage: '10 laps with a professional instructor',
      },
      courseAddress: 'Sonoma Raceway, CA',
      imageUrl: 'https://www.datocms-assets.com/164287/1769723333-ferrari-488-3.jpg?auto=compress%2Cformat',
      startingBid: 600, currentBid: 820, buyNowPrice: 1600, bidIncrement: 25,
      bidDeadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), totalBids: 9, status: 'active',
      packageDetails: 'Ten adrenaline-filled laps behind the wheel of a Ferrari 488 GTB on a professional circuit, with instruction from an expert driver.',
      bookingRestrictions: "Valid driver's license required. Minimum age 21. Advance booking required.",
      fairMarketValue: 1400,
      supportsText: 'Supports automotive vocational training scholarships.',
      supportsLinks: [],
      state: 'California', city: 'Sonoma',
    },
    {
      title: 'Napa Valley Private Wine Tasting for 6',
      subHeader: 'Curated tasting at a boutique vineyard estate',
      category: 'Food & Wine',
      attributes: {
        experienceType: 'Private guided wine tasting',
        numberOfGuests: 6,
        cuisineOrVarietal: 'Cabernet Sauvignon & estate reds',
        duration: '2.5 hours',
      },
      courseAddress: 'Napa Valley, CA',
      imageUrl: 'https://www.dylanstours.com/wp-content/uploads/2025/10/Common-Questions-About-Napa-Valley-Wine-Tasting.webp',
      startingBid: 350, currentBid: 470, buyNowPrice: 950, bidIncrement: 20,
      bidDeadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), totalBids: 6, status: 'active',
      packageDetails: 'A private, guided tasting for six at a boutique Napa Valley estate, featuring premium estate-grown reds paired with artisan bites.',
      bookingRestrictions: 'Guests must be 21+. By appointment only. Valid 12 months.',
      fairMarketValue: 850,
      supportsText: 'Supports sustainable agriculture initiatives.',
      supportsLinks: [],
      state: 'California', city: 'Napa',
    },
    {
      title: 'Premium Laptop & Tech Bundle',
      subHeader: 'Latest flagship laptop with accessories',
      category: 'Technology & Electronics',
      attributes: {
        brand: 'Apple',
        model: 'MacBook Pro 16\"',
        condition: 'Brand new, sealed',
        warranty: '1-year manufacturer warranty',
        specs: 'M-series chip, 32GB RAM, 1TB SSD, plus wireless mouse and sleeve',
      },
      courseAddress: 'Ships nationwide',
      imageUrl: 'https://i.ytimg.com/vi/Cp6u92e2f2w/maxresdefault.jpg',
      startingBid: 1000, currentBid: 1280, buyNowPrice: 2600, bidIncrement: 50,
      bidDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), totalBids: 10, status: 'active',
      packageDetails: 'A brand-new flagship laptop bundle including a wireless mouse and protective sleeve — perfect for creators and professionals.',
      bookingRestrictions: 'Ships within the continental US. Allow 5–7 business days for delivery.',
      fairMarketValue: 2400,
      supportsText: 'Supports digital-literacy programs for students.',
      supportsLinks: [],
      state: 'Washington', city: 'Seattle',
    },
    {
      title: 'Luxury Spa & Wellness Retreat for 2',
      subHeader: 'Full-day couples spa with massage and treatments',
      category: 'Health & Wellness',
      attributes: {
        serviceType: 'Couples spa day',
        provider: 'Five-star resort spa',
        sessions: '2 guests, full-day access',
        duration: 'Full day incl. 60-min massage each',
      },
      courseAddress: 'Sedona, AZ',
      imageUrl: 'https://thumbs.dreamstime.com/b/relaxing-spa-treatment-therapist-preparing-massage-table-towels-candles-flower-bowl-serene-scene-showing-arranging-455835612.jpg',
      startingBid: 250, currentBid: 340, buyNowPrice: 700, bidIncrement: 15,
      bidDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), totalBids: 5, status: 'active',
      packageDetails: 'A rejuvenating full-day couples spa retreat including a 60-minute massage each, plus access to thermal pools and relaxation lounges.',
      bookingRestrictions: 'By appointment. Valid 12 months. 48-hour cancellation policy.',
      fairMarketValue: 620,
      supportsText: 'Supports mental-health and wellness charities.',
      supportsLinks: [],
      state: 'Arizona', city: 'Sedona',
    },
    {
      title: 'Sunrise Hot Air Balloon Ride for 2',
      subHeader: 'Champagne sunrise flight over scenic countryside',
      category: 'Unique Experiences',
      attributes: {
        experienceType: 'Hot air balloon flight',
        numberOfGuests: 2,
        duration: '1-hour flight + champagne toast',
        location: 'Temecula Valley, CA',
      },
      courseAddress: 'Temecula Valley, CA',
      imageUrl: 'https://staybook.in/_next/image?url=https%3A%2F%2Fcdn-imgix.headout.com%2Fmedia%2Fimages%2F6d71a1618bc0168fad3de7bbbad57a8b-21210-luxor-luxury-hot-air-balloon-riding-in-luxor-06.jpg%3Fw%3D1120%26h%3D630%26crop%3Dfaces%26auto%3Dcompress%252Cformat%26fit%3Dmin&w=3840&q=75',
      startingBid: 200, currentBid: 290, buyNowPrice: 600, bidIncrement: 10,
      bidDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), totalBids: 6, status: 'active',
      packageDetails: 'A breathtaking sunrise hot air balloon flight for two over rolling vineyards and valleys, finished with a celebratory champagne toast.',
      bookingRestrictions: 'Weather dependent. Advance reservation required. Valid 12 months.',
      fairMarketValue: 540,
      supportsText: 'Supports local community tourism initiatives.',
      supportsLinks: [],
      state: 'California', city: 'Temecula',
    },
    {
      title: 'Tuscany Villa Getaway – 7 Nights',
      subHeader: 'Private countryside villa among vineyards and cypress',
      category: 'Travel & Leisure',
      attributes: {
        destination: 'Tuscany, Italy',
        nights: 7,
        occupancy: 'Up to 6 guests',
        travelWindow: 'Valid 18 months, excludes August',
        inclusions: 'Private villa, welcome wine basket, daily housekeeping',
      },
      courseAddress: 'Val d\'Orcia, Tuscany, Italy',
      imageUrl: 'https://media.cntraveller.com/photos/69e79ba9837f2dc69d19c372/16:9/w_2560%2Cc_limit/villa-la-vedetta-maremma-tuscany-april-2026-pr-global.jpg',
      startingBid: 2200, currentBid: 2850, buyNowPrice: 5800, bidIncrement: 100,
      bidDeadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), totalBids: 7, status: 'active',
      packageDetails: 'Seven nights in a private Tuscan villa surrounded by vineyards and cypress trees, with a welcome wine basket and daily housekeeping.',
      bookingRestrictions: 'Advance reservation required. Airfare not included. Subject to availability.',
      fairMarketValue: 5400,
      supportsText: 'Supports cultural heritage preservation.',
      supportsLinks: [],
      state: 'International', city: 'Siena',
    },
    {
      title: 'Formula 1 Grand Prix Weekend for 2',
      subHeader: 'Grandstand seats to a thrilling F1 race weekend',
      category: 'Sports & Athletics',
      attributes: {
        eventName: 'Formula 1 Grand Prix',
        numberOfTickets: 2,
        seatLocation: 'Main grandstand, start/finish straight',
        eventDate: 'Upcoming race weekend (TBD with winner)',
      },
      courseAddress: 'Circuit of the Americas, Austin, TX',
      imageUrl: 'https://thumbs.dreamstime.com/b/formula-race-car-speeds-down-track-blurred-spectators-grandstands-high-speed-motion-capturing-excitement-413041149.jpg',
      startingBid: 1100, currentBid: 1390, buyNowPrice: 2900, bidIncrement: 50,
      bidDeadline: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), totalBids: 8, status: 'active',
      packageDetails: 'Two grandstand tickets to a full Formula 1 Grand Prix race weekend with prime views of the start/finish straight.',
      bookingRestrictions: 'Specific race weekend confirmed with winner. Travel not included.',
      fairMarketValue: 2700,
      supportsText: 'Supports STEM education and motorsport apprenticeships.',
      supportsLinks: [],
      state: 'Texas', city: 'Austin',
    },
  ]

  for (const listing of listings) {
    const created = await prisma.golfPackage.create({ data: listing as any })
    console.log(`✅ Listing created: ${created.title}`)

    if (listing.totalBids > 0) {
      const users = await prisma.user.findMany()
      const testUser = users.find((u) => u.email === 'test@sevaconnect.com')
      const adminUser = users.find((u) => u.email === 'john@doe.com')

      if (testUser && adminUser) {
        const bidIncrement = Number(listing.bidIncrement)
        const startingBid = Number(listing.startingBid)
        const currentBid = Number(listing.currentBid)

        let bidAmount = startingBid + bidIncrement
        let bidCount = 0
        const maxBids = Math.min(listing.totalBids, 5)

        while (bidAmount <= currentBid && bidCount < maxBids) {
          await prisma.bid.create({
            data: {
              amount: bidAmount,
              userId: bidCount % 2 === 0 ? testUser.id : adminUser.id,
              packageId: created.id,
              isWinning: bidAmount === currentBid,
            },
          })
          bidAmount += bidIncrement
          bidCount++
        }
        console.log(`   ↳ Added ${bidCount} sample bids`)
      }
    }
  }

  console.log('🎉 Sample listings seeding completed successfully!')
  console.log(`📊 Total listings created: ${listings.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Error during listings seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
