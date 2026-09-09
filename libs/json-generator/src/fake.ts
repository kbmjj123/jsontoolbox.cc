export function fakeAvatar(userId: number, size = 300): string {
  return `https://i.pravatar.cc/${size}?u=${userId}`
}

export function fakeImage(seed: string, width = 400, height = 400): string {
  return `https://picsum.photos/seed/${seed}/${width}/${height}`
}

export function fakePlaceholderImage(text: string, width = 800, height = 400): string {
  const encoded = encodeURIComponent(text)
  return `https://placehold.co/${width}x${height}.png?text=${encoded}`
}

const PALETTES: string[][] = [
  ['#1E293B', '#334155', '#475569', '#64748B', '#94A3B8'],
  ['#0F172A', '#1E293B', '#334155', '#475569', '#64748B'],
  ['#7C3AED', '#6D28D9', '#5B21B6', '#4C1D95', '#3B0764'],
  ['#059669', '#047857', '#065F46', '#064E3B', '#022C22'],
  ['#DC2626', '#B91C1C', '#991B1B', '#7F1D1D', '#450A0A'],
  ['#0284C7', '#0369A1', '#075985', '#0C4A6E', '#082F49'],
]

export function fakeColor(paletteIndex?: number): string {
  const palette = PALETTES[paletteIndex ?? Math.floor(Math.random() * PALETTES.length)]
  return palette[Math.floor(Math.random() * palette.length)]
}

export function fakeEmail(userId: number, domain = 'example.com'): string {
  return `customer${userId}@${domain}`
}

export function fakePhone(): string {
  const local = Math.floor(Math.random() * 9000) + 1000
  return `+1-415-555-${local}`
}

const CITIES = [
  { city: 'San Francisco', state: 'CA', zipBase: '941' },
  { city: 'New York', state: 'NY', zipBase: '100' },
  { city: 'Los Angeles', state: 'CA', zipBase: '900' },
  { city: 'Seattle', state: 'WA', zipBase: '981' },
  { city: 'Austin', state: 'TX', zipBase: '733' },
  { city: 'Boston', state: 'MA', zipBase: '021' },
]

const STREETS = [
  'Market St', 'Mission St', 'Valencia St', 'Broadway', 'Main St',
  'Oak Ave', 'Pine St', 'Elm St', 'Cedar Ln', 'Maple Dr',
]

export function fakeAddress(userId: number) {
  const base = CITIES[Math.floor(Math.random() * CITIES.length)]
  const streetNum = Math.floor(Math.random() * 900) + 1
  const street = STREETS[Math.floor(Math.random() * STREETS.length)]
  const hasApt = Math.random() > 0.5
  const apt = hasApt ? `Apt ${Math.floor(Math.random() * 20) + 1}` : ''
  const zip = `${base.zipBase}${Math.floor(Math.random() * 90) + 10}`

  return {
    line1: `${streetNum} ${street}`,
    line2: apt,
    city: base.city,
    state: base.state,
    zip,
    country: 'US',
  }
}

const FIRST_NAMES = [
  'Alice', 'Bob', 'Charlie', 'Diana', 'Ethan', 'Fiona',
  'George', 'Hannah', 'Ivan', 'Julia', 'Kevin', 'Linda',
  'Michael', 'Nancy', 'Oscar', 'Paula',
]

const LAST_NAMES = [
  'Johnson', 'Smith', 'Williams', 'Brown', 'Jones', 'Garcia',
  'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez',
  'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
]

export function fakeName(userId: number): { firstName: string; lastName: string } {
  const first = FIRST_NAMES[userId % FIRST_NAMES.length]
  const last = LAST_NAMES[Math.floor(userId / 10) % LAST_NAMES.length]
  return { firstName: first, lastName: last }
}

const COMPANY_ADJS = ['Blue', 'Green', 'Smart', 'Fast', 'Global', 'Local', 'Prime', 'Alpha', 'Next', 'Core']
const COMPANY_NOUNS = ['River', 'Stone', 'Cloud', 'Wave', 'Peak', 'Path', 'Link', 'Net', 'Soft', 'Tech']
const COMPANY_SUFFIXES = ['Technologies', 'Solutions', 'Labs', 'Systems', 'Group', 'Co', 'Inc', 'LLC']

export function fakeCompany(): string {
  const adj = COMPANY_ADJS[Math.floor(Math.random() * COMPANY_ADJS.length)]
  const noun = COMPANY_NOUNS[Math.floor(Math.random() * COMPANY_NOUNS.length)]
  const suffix = COMPANY_SUFFIXES[Math.floor(Math.random() * COMPANY_SUFFIXES.length)]
  return `${adj} ${noun} ${suffix}`
}

const PRODUCT_ADJS = ['Premium', 'Smart', 'Pro', 'Ultra', 'Essential', 'Classic', 'Modern', 'Compact', 'Deluxe', 'Advanced']
const PRODUCT_NOUNS = ['Wireless Headphones', 'Smart Watch', 'Bluetooth Speaker', 'Laptop Stand', 'Mechanical Keyboard', 'Gaming Mouse', 'USB-C Hub', 'Portable Charger', 'Webcam', 'Monitor Light']

export function fakeProductTitle(): string {
  const adj = PRODUCT_ADJS[Math.floor(Math.random() * PRODUCT_ADJS.length)]
  const noun = PRODUCT_NOUNS[Math.floor(Math.random() * PRODUCT_NOUNS.length)]
  return `${adj} ${noun}`
}

export function fakeProductDescription(): string {
  const templates = [
    'High-quality design with attention to detail.',
    'Built for everyday use with durability in mind.',
    'Combines style and functionality for modern users.',
    'Optimized for performance and long-term reliability.',
    'A practical solution for common everyday needs.',
  ]
  return templates[Math.floor(Math.random() * templates.length)]
}

const LOG_LEVELS = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']

export function fakeLogLevel(): string {
  return LOG_LEVELS[Math.floor(Math.random() * LOG_LEVELS.length)]
}

const LOG_MESSAGES = [
  'Request processed successfully',
  'Database connection established',
  'Cache miss for key',
  'Retry attempt for failed operation',
  'User session validated',
  'Configuration loaded from environment',
  'Background job completed',
  'Rate limit threshold reached',
  'Authentication token refreshed',
  'File upload completed',
]

export function fakeLogMessage(): string {
  return LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)]
}

export function fakeISODate(offsetDays?: number): string {
  const now = new Date()
  if (offsetDays !== undefined) {
    now.setDate(now.getDate() - offsetDays)
  }
  return now.toISOString()
}

export function fakeTimestamp(): number {
  return Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 30)
}

const ISSUE_TYPES = ['Bug', 'Story', 'Task', 'Epic', 'Sub-task', 'Improvement']
const ISSUE_STATUSES = ['Open', 'In Progress', 'In Review', 'Done', 'Closed', 'Blocked', 'Reopened']
const PRIORITIES = ['Lowest', 'Low', 'Medium', 'High', 'Critical', 'Blocker']

export function fakeIssueType(): string {
  return ISSUE_TYPES[Math.floor(Math.random() * ISSUE_TYPES.length)]
}

export function fakeIssueStatus(): string {
  return ISSUE_STATUSES[Math.floor(Math.random() * ISSUE_STATUSES.length)]
}

export function fakePriority(): string {
  return PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)]
}
