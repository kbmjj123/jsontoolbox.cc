import { generateJsonWithTargetSize, type GeneratorType } from '../src/generator'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function generateFile(type: GeneratorType, sizeMB: number, filename: string, outputDir: string) {
  const { data, actualSizeMB, recordCount } = generateJsonWithTargetSize(type, sizeMB, {
    maxRecords: 100000,
    minRecords: 10,
  })

  const json = JSON.stringify(data, null, 2)
  const outputPath = join(outputDir, filename)

  ensureDir(outputDir)
  writeFileSync(outputPath, json, 'utf-8')

  console.log(`✅ Generated ${filename}: ${recordCount} records, ${actualSizeMB.toFixed(2)} MB`)
}

function main() {
  const args = process.argv.slice(2)

  if (args.length < 3) {
    console.log('Usage: tsx scripts/generate.ts <type> <sizeMB> <outputDir>')
    console.log('')
    console.log('  type    : orders | users | logs')
    console.log('  sizeMB  : target size in MB (e.g. 1, 5, 10, 50)')
    console.log('  outputDir: output directory (e.g. ../../public/test-data)')
    console.log('')
    console.log('Examples:')
    console.log('  tsx scripts/generate.ts orders 10 ../../public/test-data')
    console.log('  tsx scripts/generate.ts users 5 ../../public/test-data')
    console.log('  tsx scripts/generate.ts logs 50 ../../public/test-data')
    process.exit(1)
  }

  const [typeArg, sizeArg, outputDir] = args
  const type = typeArg as GeneratorType
  const sizeMB = parseFloat(sizeArg)

  if (!['orders', 'users', 'logs'].includes(type)) {
    console.error('❌ Invalid type. Must be one of: orders, users, logs')
    process.exit(1)
  }

  if (isNaN(sizeMB) || sizeMB <= 0) {
    console.error('❌ Invalid sizeMB. Must be a positive number.')
    process.exit(1)
  }

  const filename = `${type}-${sizeMB}mb.json`
  generateFile(type, sizeMB, filename, outputDir)
}

main()
