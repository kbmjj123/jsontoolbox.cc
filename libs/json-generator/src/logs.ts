import { fakeLogLevel, fakeLogMessage, fakeTimestamp, fakeColor } from './fake'

export interface LogEntry {
  _id: string
  timestamp: number
  level: string
  message: string
  service: string
  host: string
  pid: number
  req_id?: string
  user_id?: number
  duration_ms?: number
  status_code?: number
  method?: string
  path?: string
  query?: Record<string, any>
  body?: Record<string, any>
  error?: {
    name: string
    message: string
    stack?: string
  }
  meta: {
    version: string
    environment: 'production' | 'staging' | 'development'
    region: string
    custom_field_1?: string
    custom_field_2?: number
    custom_field_3?: boolean
    theme_color?: string
  }
}

const SERVICES = [
  'api-gateway', 'auth-service', 'user-service',
  'order-service', 'payment-service', 'notification-service',
]

const HOSTS = ['prod-app-01', 'prod-app-02', 'prod-app-03', 'prod-worker-01', 'prod-worker-02']
const REGIONS = ['us-west-1', 'us-east-1', 'eu-west-1', 'ap-southeast-1']
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const PATHS = ['/api/v1/users', '/api/v1/orders', '/api/v1/products', '/api/v1/auth/login', '/api/v1/payments']

function fakeObjectId(): string {
  const hex = '0123456789abcdef'
  let id = ''
  for (let i = 0; i < 24; i++) {
    id += hex[Math.floor(Math.random() * 16)]
  }
  return id
}

export function generateLogEntry(index: number): LogEntry {
  const level = fakeLogLevel()
  const hasError = level === 'ERROR' || level === 'FATAL' || Math.random() > 0.8
  const hasReq = Math.random() > 0.3
  const hasUser = Math.random() > 0.5

  const entry: LogEntry = {
    _id: fakeObjectId(),
    timestamp: fakeTimestamp(),
    level,
    message: fakeLogMessage(),
    service: SERVICES[Math.floor(Math.random() * SERVICES.length)],
    host: HOSTS[Math.floor(Math.random() * HOSTS.length)],
    pid: Math.floor(Math.random() * 10000) + 1000,
    meta: {
      version: '1.2.3',
      environment: ['production', 'staging', 'development'][Math.floor(Math.random() * 3)] as any,
      region: REGIONS[Math.floor(Math.random() * REGIONS.length)],
      custom_field_1: Math.random() > 0.5 ? `value_${index}` : undefined,
      custom_field_2: Math.random() > 0.5 ? Math.floor(Math.random() * 1000) : undefined,
      custom_field_3: Math.random() > 0.5 ? Math.random() > 0.5 : undefined,
      theme_color: fakeColor(),
    },
  }

  if (hasReq) {
    entry.req_id = `req_${fakeObjectId()}`
    entry.method = METHODS[Math.floor(Math.random() * METHODS.length)]
    entry.path = PATHS[Math.floor(Math.random() * PATHS.length)]
    entry.status_code = hasError
      ? [400, 401, 403, 404, 500, 502, 503][Math.floor(Math.random() * 7)]
      : [200, 201, 204][Math.floor(Math.random() * 3)]
    entry.duration_ms = Math.floor(Math.random() * 2000)
    entry.query = Math.random() > 0.5 ? { page: Math.floor(Math.random() * 10) + 1, limit: 20 } : undefined
    entry.body = Math.random() > 0.5 ? { name: `item_${index}`, value: Math.random() * 100 } : undefined
  }

  if (hasUser) {
    entry.user_id = Math.floor(Math.random() * 10000)
  }

  if (hasError) {
    entry.error = {
      name: ['Error', 'TypeError', 'ReferenceError', 'ValidationError'][Math.floor(Math.random() * 4)],
      message: `Something went wrong while processing request ${entry.req_id ?? 'unknown'}`,
      stack: Math.random() > 0.5
        ? `Error: Something went wrong\n    at handler (${entry.service}/index.js:42:15)`
        : undefined,
    }
  }

  return entry
}

export function generateLogs(count: number): LogEntry[] {
  return Array.from({ length: count }, (_, i) => generateLogEntry(i))
}
