import {
  fakeEmail,
  fakeName,
  fakeISODate,
  fakeColor,
  fakeAddress,
} from './fake'

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function fakeId(prefix: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let id = prefix
  for (let i = 0; i < 24; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return id
}

function fakePayTimestamp(): number {
  return Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 30 * 24 * 60 * 60)
}

export interface Card {
  brand: string
  last4: string
  exp_month: number
  exp_year: number
  funding: 'credit' | 'debit' | 'prepaid' | 'unknown'
  country: string
}

export interface Charge {
  id: string
  amount: number
  currency: string
  status: 'succeeded' | 'pending' | 'failed'
  paid: boolean
  refunded: boolean
  amount_refunded?: number
  failure_code?: string
  failure_message?: string
  payment_method: string
  customer?: string
  description?: string
  metadata?: Record<string, string>
  created: number
}

export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled'
  client_secret?: string
  payment_method?: string
  customer?: string
  description?: string
  metadata?: Record<string, string>
  created: number
  charges: Charge[]
}

export interface Payout {
  id: string
  amount: number
  currency: string
  status: 'pending' | 'in_transit' | 'paid' | 'failed' | 'canceled'
  arrival_date?: string
  description?: string
  metadata?: Record<string, string>
  created: number
}

export interface Payment {
  id: string
  type: 'charge' | 'payment_intent' | 'payout'
  object: Charge | PaymentIntent | Payout
  metadata: {
    environment: 'live' | 'test'
    theme_color?: string
  }
}

const CARD_BRANDS = ['visa', 'mastercard', 'amex', 'discover', 'jcb', 'diners']
const FUNDINGS: Card['funding'][] = ['credit', 'debit', 'prepaid', 'unknown']
const COUNTRIES = ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'JP', 'CN']
const FAILURE_CODES = ['incorrect_number', 'invalid_number', 'expired_card', 'incorrect_cvc', 'processing_error', 'incorrect_zip', 'card_declined', 'missing']

function generateCard(): Card {
  return {
    brand: pick(CARD_BRANDS),
    last4: `${Math.floor(Math.random() * 9000) + 1000}`,
    exp_month: Math.floor(Math.random() * 12) + 1,
    exp_year: Math.floor(Math.random() * 6) + 2025,
    funding: pick(FUNDINGS),
    country: pick(COUNTRIES),
  }
}

function generateCharge(customerId?: string): Charge {
  const status = pick(['succeeded', 'pending', 'failed'] as Charge['status'][])
  const paid = status === 'succeeded'
  const refunded = paid && Math.random() > 0.8
  const amount = Math.floor(Math.random() * 100000) + 500

  return {
    id: fakeId('ch_'),
    amount,
    currency: 'USD',
    status,
    paid,
    refunded,
    amount_refunded: refunded ? Math.floor(Math.random() * amount) : undefined,
    failure_code: status === 'failed' ? pick(FAILURE_CODES) : undefined,
    failure_message: status === 'failed' ? 'Your card was declined.' : undefined,
    payment_method: fakeId('pm_'),
    customer: customerId,
    description: 'Payment for order',
    metadata: { order_id: `order_${Math.floor(Math.random() * 10000)}` },
    created: fakePayTimestamp(),
  }
}

function generatePaymentIntent(customerId?: string): PaymentIntent {
  const statuses: PaymentIntent['status'][] = ['requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'succeeded', 'canceled']
  const status = pick(statuses)
  const amount = Math.floor(Math.random() * 100000) + 500
  const chargeCount = status === 'succeeded' ? Math.floor(Math.random() * 2) + 1 : 0

  return {
    id: fakeId('pi_'),
    amount,
    currency: 'USD',
    status,
    client_secret: status !== 'succeeded' ? `${fakeId('pi_')}_secret_abc123` : undefined,
    payment_method: Math.random() > 0.3 ? fakeId('pm_') : undefined,
    customer: customerId,
    description: 'Payment intent for subscription',
    metadata: { subscription_id: `sub_${Math.floor(Math.random() * 10000)}` },
    created: fakePayTimestamp(),
    charges: Array.from({ length: chargeCount }, () => generateCharge(customerId)),
  }
}

function generatePayout(): Payout {
  const statuses: Payout['status'][] = ['pending', 'in_transit', 'paid', 'failed', 'canceled']
  const status = pick(statuses)
  return {
    id: fakeId('po_'),
    amount: Math.floor(Math.random() * 1000000) + 10000,
    currency: 'USD',
    status,
    arrival_date: (status === 'paid' || status === 'in_transit') ? fakeISODate(Math.floor(Math.random() * 7)) : undefined,
    description: 'Weekly payout',
    metadata: { account_id: `acct_${Math.floor(Math.random() * 10000)}` },
    created: fakePayTimestamp(),
  }
}

export function generatePayment(index: number): Payment {
  const name = fakeName(index)
  const typeRoll = Math.random()
  let type: Payment['type']
  let object: Payment['object']
  const customerId = fakeId('cus_')

  if (typeRoll < 0.5) {
    type = 'charge'
    object = generateCharge(customerId)
  } else if (typeRoll < 0.9) {
    type = 'payment_intent'
    object = generatePaymentIntent(customerId)
  } else {
    type = 'payout'
    object = generatePayout()
  }

  return {
    id: fakeId('pay_'),
    type,
    object,
    metadata: {
      environment: Math.random() > 0.1 ? 'live' : 'test',
      theme_color: fakeColor(),
    },
  }
}

export function generatePayments(count: number): Payment[] {
  return Array.from({ length: count }, (_, i) => generatePayment(i))
}
