import { generateOrders } from './orders'
import { generateUsers } from './users'
import { generateLogs } from './logs'
import { generateIssues } from './issues'
import { generatePayments } from './payments'
import { generateProducts } from './products'

export type GeneratorType = 'orders' | 'users' | 'logs' | 'issues' | 'payments' | 'products'

function estimateSize(obj: any): number {
  return JSON.stringify(obj).length
}

export function generateJson(type: GeneratorType, targetCount: number): any[] {
  switch (type) {
    case 'orders': return generateOrders(targetCount)
    case 'users': return generateUsers(targetCount)
    case 'logs': return generateLogs(targetCount)
    case 'issues': return generateIssues(targetCount)
    case 'payments': return generatePayments(targetCount)
    case 'products': return generateProducts(targetCount)
    default: throw new Error(`Unknown generator type: ${type}`)
  }
}

export function generateJsonWithTargetSize(
  type: GeneratorType,
  targetSizeMB: number,
  options?: { maxRecords?: number; minRecords?: number },
): { data: any[]; actualSizeMB: number; recordCount: number } {
  const maxRecords = options?.maxRecords ?? 100000
  const minRecords = options?.minRecords ?? 10
  const targetBytes = targetSizeMB * 1024 * 1024

  // Sample to estimate avg record size
  const sampleCount = 10
  const sample = generateJson(type, sampleCount)
  const avgSizePerRecord = sample.reduce((sum, item) => sum + estimateSize(item), 0) / sampleCount

  let estimatedCount = Math.floor(targetBytes / avgSizePerRecord)
  estimatedCount = Math.max(minRecords, Math.min(maxRecords, estimatedCount))

  const data = generateJson(type, estimatedCount)
  const actualBytes = data.reduce((sum, item) => sum + estimateSize(item), 0)

  return {
    data,
    actualSizeMB: actualBytes / (1024 * 1024),
    recordCount: estimatedCount,
  }
}
