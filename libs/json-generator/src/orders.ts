import {
  fakeImage,
  fakeColor,
  fakeEmail,
  fakePhone,
  fakeAddress,
  fakeName,
  fakeProductTitle,
  fakeProductDescription,
  fakeISODate,
} from './fake'

export interface TaxLine {
  title: string
  rate: number
  price: string
}

export interface DiscountAllocation {
  amount: string
  discount: {
    title: string
    type: 'percentage' | 'fixed_amount'
  }
}

export interface LineItem {
  id: number
  product_id: number
  title: string
  description: string
  quantity: number
  price: string
  currency: string
  image_url: string
  variant: {
    color: string
    size: string
  }
  tax_lines: TaxLine[]
  discount_allocations: DiscountAllocation[]
}

export interface Customer {
  id: number
  email: string
  first_name: string
  last_name: string
  phone: string
  address: ReturnType<typeof fakeAddress>
}

export interface Order {
  id: number
  order_number: string
  created_at: string
  customer: Customer
  line_items: LineItem[]
  total_price: string
  subtotal_price: string
  total_tax: string
  total_discounts: string
  currency: string
  financial_status: 'pending' | 'paid' | 'refunded' | 'partially_refunded'
  fulfillment_status: 'unfulfilled' | 'partial' | 'fulfilled'
  tags: string[]
  note?: string
  shipping_address: ReturnType<typeof fakeAddress> & {
    first_name: string
    last_name: string
    phone: string
  }
  metadata: {
    source: 'web' | 'mobile' | 'pos'
    campaign?: string
    device: 'desktop' | 'mobile' | 'tablet'
  }
}

function generateTaxLine(basePrice: number): TaxLine {
  const rate = [0.0, 0.05, 0.0625, 0.0725, 0.0825][Math.floor(Math.random() * 5)]
  const title = rate === 0 ? 'No Tax' : `Tax ${Math.round(rate * 1000) / 10}%`
  return { title, rate, price: (basePrice * rate).toFixed(2) }
}

function generateDiscount(basePrice: number): DiscountAllocation | null {
  if (Math.random() > 0.4) return null
  const isPercentage = Math.random() > 0.5
  const amount = isPercentage
    ? (basePrice * (Math.floor(Math.random() * 20) + 5) / 100).toFixed(2)
    : (Math.floor(Math.random() * 20) + 5).toFixed(2)
  return {
    amount,
    discount: {
      title: isPercentage ? `SAVE${Math.round((parseFloat(amount) / basePrice) * 100)}` : 'FLAT5',
      type: isPercentage ? 'percentage' : 'fixed_amount',
    },
  }
}

function generateLineItem(itemId: number, productId: number): LineItem {
  const quantity = Math.floor(Math.random() * 3) + 1
  const priceFloat = Math.floor(Math.random() * 200) + 20
  const price = priceFloat.toFixed(2)
  const basePrice = priceFloat * quantity

  const taxLine = generateTaxLine(basePrice)
  const discount = generateDiscount(basePrice)

  return {
    id: itemId,
    product_id: productId,
    title: fakeProductTitle(),
    description: fakeProductDescription(),
    quantity,
    price,
    currency: 'USD',
    image_url: fakeImage(`product-${productId}`, 400, 400),
    variant: {
      color: fakeColor(),
      size: ['One Size', 'S', 'M', 'L', 'XL'][Math.floor(Math.random() * 5)],
    },
    tax_lines: taxLine.rate > 0 ? [taxLine] : [],
    discount_allocations: discount ? [discount] : [],
  }
}

export function generateOrder(orderId: number): Order {
  const customerId = Math.floor(Math.random() * 10000)
  const name = fakeName(customerId)
  const customer: Customer = {
    id: customerId,
    email: fakeEmail(customerId),
    first_name: name.firstName,
    last_name: name.lastName,
    phone: fakePhone(),
    address: fakeAddress(customerId),
  }

  const lineItemCount = Math.floor(Math.random() * 4) + 1
  const lineItems: LineItem[] = []
  let subtotal = 0

  for (let i = 0; i < lineItemCount; i++) {
    const item = generateLineItem(orderId * 100 + i, orderId * 10 + i)
    lineItems.push(item)
    subtotal += parseFloat(item.price) * item.quantity
  }

  const totalTax = lineItems.reduce((sum, item) => {
    return sum + item.tax_lines.reduce((s, t) => s + parseFloat(t.price), 0)
  }, 0)

  const totalDiscount = lineItems.reduce((sum, item) => {
    return sum + item.discount_allocations.reduce((s, d) => s + parseFloat(d.amount), 0)
  }, 0)

  const totalPrice = subtotal + totalTax - totalDiscount
  const financialStatuses: Order['financial_status'][] = ['pending', 'paid', 'refunded', 'partially_refunded']
  const fulfillmentStatuses: Order['fulfillment_status'][] = ['unfulfilled', 'partial', 'fulfilled']
  const sources: ('web' | 'mobile' | 'pos')[] = ['web', 'mobile', 'pos']
  const devices: ('desktop' | 'mobile' | 'tablet')[] = ['desktop', 'mobile', 'tablet']

  return {
    id: orderId,
    order_number: `#${orderId}`,
    created_at: fakeISODate(Math.floor(Math.random() * 180)),
    customer,
    line_items: lineItems,
    total_price: totalPrice.toFixed(2),
    subtotal_price: subtotal.toFixed(2),
    total_tax: totalTax.toFixed(2),
    total_discounts: totalDiscount.toFixed(2),
    currency: 'USD',
    financial_status: financialStatuses[Math.floor(Math.random() * financialStatuses.length)],
    fulfillment_status: fulfillmentStatuses[Math.floor(Math.random() * fulfillmentStatuses.length)],
    tags: [
      ...(Math.random() > 0.7 ? ['vip'] : []),
      ...(Math.random() > 0.7 ? ['repeat_customer'] : []),
      ...(Math.random() > 0.8 ? ['high_value'] : []),
    ],
    note: Math.random() > 0.6 ? 'Please leave the package at the front door.' : undefined,
    shipping_address: {
      ...fakeAddress(customerId),
      first_name: name.firstName,
      last_name: name.lastName,
      phone: customer.phone,
    },
    metadata: {
      source: sources[Math.floor(Math.random() * sources.length)],
      campaign: Math.random() > 0.5 ? 'summer_sale_2025' : undefined,
      device: devices[Math.floor(Math.random() * devices.length)],
    },
  }
}

export function generateOrders(count: number): Order[] {
  return Array.from({ length: count }, (_, i) => generateOrder(i + 1))
}
