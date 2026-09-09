import {
  fakeImage,
  fakeColor,
  fakeISODate,
  fakeProductTitle,
  fakeProductDescription,
} from './fake'

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function fakeId(prefix: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let id = prefix
  for (let i = 0; i < 16; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return id
}

export interface Image {
  id: string
  url: string
  alt?: string
  width: number
  height: number
  position: number
}

export interface Variant {
  id: string
  title: string
  option1?: string
  option2?: string
  option3?: string
  sku: string
  price: string
  compare_at_price?: string
  inventory_quantity: number
  inventory_policy: 'deny' | 'continue'
  available: boolean
  weight: number
  weight_unit: 'kg' | 'lb' | 'g' | 'oz'
  image_id?: string
}

export interface Option {
  id: string
  name: string
  values: string[]
}

export interface Product {
  id: string
  title: string
  description: string
  vendor: string
  product_type: string
  created_at: string
  updated_at: string
  published_at: string
  tags: string[]
  status: 'active' | 'archived' | 'draft'
  images: Image[]
  options: Option[]
  variants: Variant[]
  seo: {
    title?: string
    description?: string
  }
  metadata: {
    theme_color?: string
    is_featured?: boolean
    category?: string
  }
}

const VENDORS = ['Acme Corp', 'Blue River Technologies', 'CloudWave Solutions', 'Prime Labs', 'NextGen Systems', 'Core Tech Group', 'Global Innovations', 'Smart Devices Inc']
const PRODUCT_TYPES = ['Electronics', 'Home & Kitchen', 'Fashion', 'Sports & Outdoors', 'Books', 'Toys & Games', 'Health & Beauty', 'Office Supplies']
const TAGS_POOL = ['new', 'bestseller', 'sale', 'clearance', 'featured', 'eco-friendly', 'limited-edition', 'pre-order', 'bundle', 'gift-idea']
const CATEGORIES = ['Audio', 'Wearables', 'Accessories', 'Computers', 'Mobile', 'Cameras', 'Gaming', 'Smart Home']
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const COLOR_OPTIONS = ['Black', 'White', 'Red', 'Blue', 'Green', 'Gray', 'Navy', 'Beige']

function generateImage(seed: string, index: number): Image {
  const width = [400, 600, 800, 1000][Math.floor(Math.random() * 4)]
  const height = [400, 600, 800][Math.floor(Math.random() * 3)]
  return {
    id: fakeId('img_'),
    url: fakeImage(`${seed}-${index}`, width, height),
    alt: `Product image ${index + 1}`,
    width,
    height,
    position: index,
  }
}

function generateVariants(basePrice: number, options: Option[]): Variant[] {
  const variants: Variant[] = []
  const opt1Values = options.find(o => o.name === 'Color')?.values ?? ['Default']
  const opt2Values = options.find(o => o.name === 'Size')?.values ?? ['Default']

  for (const opt1 of opt1Values) {
    for (const opt2 of opt2Values) {
      const variantId = fakeId('var_')
      const price = (basePrice + (Math.random() - 0.5) * 20).toFixed(2)
      const inventory = Math.floor(Math.random() * 200)

      variants.push({
        id: variantId,
        title: opt1 === 'Default' && opt2 === 'Default' ? 'Default Title' : `${opt1} / ${opt2}`,
        option1: opt1 === 'Default' ? undefined : opt1,
        option2: opt2 === 'Default' ? undefined : opt2,
        sku: `SKU-${variantId.slice(4)}`,
        price,
        compare_at_price: Math.random() > 0.7 ? (basePrice * 1.2).toFixed(2) : undefined,
        inventory_quantity: inventory,
        inventory_policy: Math.random() > 0.8 ? 'continue' : 'deny',
        available: inventory > 0 || Math.random() > 0.2,
        weight: Math.floor(Math.random() * 2000) + 100,
        weight_unit: Math.random() > 0.5 ? 'g' : 'oz',
        image_id: Math.random() > 0.5 ? fakeId('img_') : undefined,
      })
    }
  }
  return variants
}

export function generateProduct(index: number): Product {
  const seed = `product-${index}`
  const title = fakeProductTitle()
  const basePrice = Math.floor(Math.random() * 200) + 20

  const options: Option[] = []
  if (Math.random() > 0.4) {
    options.push({ id: fakeId('opt_'), name: 'Color', values: COLOR_OPTIONS.slice(0, Math.floor(Math.random() * 4) + 2) })
  }
  if (Math.random() > 0.5) {
    options.push({ id: fakeId('opt_'), name: 'Size', values: SIZE_OPTIONS.slice(0, Math.floor(Math.random() * 4) + 2) })
  }
  if (options.length === 0) {
    options.push({ id: fakeId('opt_'), name: 'Title', values: ['Default'] })
  }

  const statusRoll = Math.random()
  const status: Product['status'] = statusRoll > 0.8 ? 'archived' : statusRoll > 0.7 ? 'draft' : 'active'

  return {
    id: fakeId('prod_'),
    title,
    description: fakeProductDescription(),
    vendor: pick(VENDORS),
    product_type: pick(PRODUCT_TYPES),
    created_at: fakeISODate(Math.floor(Math.random() * 365)),
    updated_at: fakeISODate(Math.floor(Math.random() * 60)),
    published_at: fakeISODate(Math.floor(Math.random() * 30)),
    tags: Array.from({ length: Math.floor(Math.random() * 4) }, () => pick(TAGS_POOL)),
    status,
    images: Array.from({ length: Math.floor(Math.random() * 4) + 1 }, (_, i) => generateImage(seed, i)),
    options,
    variants: generateVariants(basePrice, options),
    seo: Math.random() > 0.3
      ? { title: `${title} | Best Price`, description: `Buy ${title.toLowerCase()} with fast shipping.` }
      : { title: undefined, description: undefined },
    metadata: {
      theme_color: fakeColor(),
      is_featured: Math.random() > 0.8,
      category: pick(CATEGORIES),
    },
  }
}

export function generateProducts(count: number): Product[] {
  return Array.from({ length: count }, (_, i) => generateProduct(i))
}
