// Auction category system + category-specific field definitions.
// Category-specific values are stored in the GolfPackage.attributes JSON column,
// keyed by each field's `key`.

export type CategoryFieldType = 'text' | 'number' | 'textarea'

export interface CategoryField {
  key: string
  label: string
  type: CategoryFieldType
  placeholder?: string
}

export interface CategoryConfig {
  /** Stable display name, also stored on the listing's `category` column */
  name: string
  /** URL-safe identifier used in filters */
  slug: string
  /** Short tagline shown in the UI */
  tagline: string
  /** Category-specific fields rendered in the admin form + detail view */
  fields: CategoryField[]
}

export const CATEGORIES: CategoryConfig[] = [
  {
    name: 'Travel & Leisure',
    slug: 'travel-leisure',
    tagline: 'Luxury vacations, resorts, cruises, safaris & travel vouchers',
    fields: [
      { key: 'destination', label: 'Destination', type: 'text', placeholder: 'e.g., Maldives' },
      { key: 'nights', label: 'Number of Nights', type: 'number', placeholder: 'e.g., 7' },
      { key: 'occupancy', label: 'Occupancy / Guests', type: 'text', placeholder: 'e.g., 2 adults' },
      { key: 'travelWindow', label: 'Travel Window', type: 'text', placeholder: 'e.g., Valid 12 months' },
      { key: 'inclusions', label: 'What\u2019s Included', type: 'textarea', placeholder: 'Flights, transfers, meals...' },
    ],
  },
  {
    name: 'Golf & Country Club',
    slug: 'golf-country-club',
    tagline: 'Stay-and-play packages, tee times, Pro-Am spots & fittings',
    fields: [
      { key: 'numberOfPlayers', label: 'Number of Players', type: 'number', placeholder: 'e.g., 4' },
      { key: 'numberOfRounds', label: 'Number of Rounds', type: 'number', placeholder: 'e.g., 1' },
      { key: 'courseName', label: 'Course / Club Name', type: 'text', placeholder: 'e.g., Pebble Beach Golf Links' },
      { key: 'cartIncluded', label: 'Cart / Caddie', type: 'text', placeholder: 'e.g., Cart included' },
      { key: 'aboutCourse', label: 'About the Course', type: 'textarea', placeholder: 'Describe the course...' },
    ],
  },
  {
    name: 'Sports & Athletics',
    slug: 'sports-athletics',
    tagline: 'VIP tickets, luxury suites, marquee events & signed memorabilia',
    fields: [
      { key: 'eventName', label: 'Event / Team', type: 'text', placeholder: 'e.g., Super Bowl LX' },
      { key: 'numberOfTickets', label: 'Number of Tickets', type: 'number', placeholder: 'e.g., 2' },
      { key: 'seatLocation', label: 'Seat / Suite Location', type: 'text', placeholder: 'e.g., Lower level, Section 112' },
      { key: 'eventDate', label: 'Event Date', type: 'text', placeholder: 'e.g., Feb 8, 2026' },
    ],
  },
  {
    name: 'Entertainment & Arts',
    slug: 'entertainment-arts',
    tagline: 'Concert meet-and-greets, Broadway, festivals & premieres',
    fields: [
      { key: 'eventName', label: 'Event / Show', type: 'text', placeholder: 'e.g., Hamilton on Broadway' },
      { key: 'numberOfTickets', label: 'Number of Tickets', type: 'number', placeholder: 'e.g., 2' },
      { key: 'venue', label: 'Venue', type: 'text', placeholder: 'e.g., Richard Rodgers Theatre' },
      { key: 'eventDate', label: 'Event Date', type: 'text', placeholder: 'e.g., Flexible' },
    ],
  },
  {
    name: 'Outdoor & Adventure',
    slug: 'outdoor-adventure',
    tagline: 'Deep-sea fishing, hunting, diving, helicopter & rafting trips',
    fields: [
      { key: 'activity', label: 'Activity', type: 'text', placeholder: 'e.g., Guided deep-sea fishing' },
      { key: 'participants', label: 'Number of Participants', type: 'number', placeholder: 'e.g., 4' },
      { key: 'duration', label: 'Duration', type: 'text', placeholder: 'e.g., Full day (8 hours)' },
      { key: 'difficulty', label: 'Difficulty Level', type: 'text', placeholder: 'e.g., Beginner friendly' },
      { key: 'gearProvided', label: 'Gear Provided', type: 'text', placeholder: 'e.g., All equipment included' },
    ],
  },
  {
    name: 'Automotive',
    slug: 'automotive',
    tagline: 'Exotic track days, luxury rentals, classics & customization',
    fields: [
      { key: 'make', label: 'Make', type: 'text', placeholder: 'e.g., Ferrari' },
      { key: 'model', label: 'Model', type: 'text', placeholder: 'e.g., 488 GTB' },
      { key: 'year', label: 'Year', type: 'text', placeholder: 'e.g., 2023' },
      { key: 'experienceType', label: 'Experience Type', type: 'text', placeholder: 'e.g., Track day, Weekend rental' },
      { key: 'durationOrMileage', label: 'Duration / Mileage', type: 'text', placeholder: 'e.g., 2 days, 300 mi included' },
    ],
  },
  {
    name: 'Food & Wine',
    slug: 'food-wine',
    tagline: 'Private chefs, wine tours, rare bottles & tasting experiences',
    fields: [
      { key: 'experienceType', label: 'Experience Type', type: 'text', placeholder: 'e.g., Private chef dinner' },
      { key: 'numberOfGuests', label: 'Number of Guests', type: 'number', placeholder: 'e.g., 8' },
      { key: 'cuisineOrVarietal', label: 'Cuisine / Varietal', type: 'text', placeholder: 'e.g., Napa Cabernet' },
      { key: 'duration', label: 'Duration', type: 'text', placeholder: 'e.g., 3-course evening' },
    ],
  },
  {
    name: 'Technology & Electronics',
    slug: 'technology-electronics',
    tagline: 'Gaming rigs, home theater, drones, cameras & workstations',
    fields: [
      { key: 'brand', label: 'Brand', type: 'text', placeholder: 'e.g., Apple' },
      { key: 'model', label: 'Model', type: 'text', placeholder: 'e.g., MacBook Pro 16\"' },
      { key: 'condition', label: 'Condition', type: 'text', placeholder: 'e.g., Brand new, sealed' },
      { key: 'warranty', label: 'Warranty', type: 'text', placeholder: 'e.g., 1-year manufacturer' },
      { key: 'specs', label: 'Specifications', type: 'textarea', placeholder: 'Key specs and features...' },
    ],
  },
  {
    name: 'Health & Wellness',
    slug: 'health-wellness',
    tagline: 'Spa retreats, cosmetic procedures, memberships & assessments',
    fields: [
      { key: 'serviceType', label: 'Service Type', type: 'text', placeholder: 'e.g., Spa & meditation retreat' },
      { key: 'provider', label: 'Provider / Clinic', type: 'text', placeholder: 'e.g., Serenity Wellness Spa' },
      { key: 'sessions', label: 'Number of Sessions', type: 'number', placeholder: 'e.g., 3' },
      { key: 'duration', label: 'Duration', type: 'text', placeholder: 'e.g., Weekend' },
    ],
  },
  {
    name: 'Unique Experiences',
    slug: 'unique-experiences',
    tagline: 'Flight simulators, yacht charters, private jets & studio tours',
    fields: [
      { key: 'experienceType', label: 'Experience Type', type: 'text', placeholder: 'e.g., Private yacht charter' },
      { key: 'numberOfGuests', label: 'Number of Guests', type: 'number', placeholder: 'e.g., 6' },
      { key: 'duration', label: 'Duration', type: 'text', placeholder: 'e.g., Full weekend' },
      { key: 'location', label: 'Location / Departure', type: 'text', placeholder: 'e.g., Miami, FL' },
    ],
  },
]

export const CATEGORY_NAMES: string[] = CATEGORIES.map((c) => c.name)

export function getCategory(name: string | null | undefined): CategoryConfig | undefined {
  if (!name) return undefined
  return CATEGORIES.find((c) => c.name === name)
}

export function getCategoryBySlug(slug: string | null | undefined): CategoryConfig | undefined {
  if (!slug) return undefined
  return CATEGORIES.find((c) => c.slug === slug)
}

/**
 * Build an ordered list of { label, value } pairs for a listing's attributes,
 * suitable for display. Skips empty values.
 */
export function describeAttributes(
  categoryName: string | null | undefined,
  attributes: Record<string, any> | null | undefined
): { key: string; label: string; value: string; type: CategoryFieldType }[] {
  const cat = getCategory(categoryName)
  if (!cat || !attributes) return []
  return cat.fields
    .map((f) => ({
      key: f.key,
      label: f.label,
      type: f.type,
      value: attributes[f.key] != null ? String(attributes[f.key]).trim() : '',
    }))
    .filter((a) => a.value !== '')
}
