import { scanJson, emptyTypeCounts, accumulateValue, valueDepth } from './app/utils/jsonScanner.ts'

function countJson(text) {
  const tc = emptyTypeCounts()
  let maxDepth = 0
  const r = scanJson(text, {
    onValue: (type, depth) => {
      tc[type]++
      if ((type === 'object' || type === 'array') && depth > maxDepth) maxDepth = depth
    },
  })
  return { rootType: r.rootType, maxDepth, tc }
}

function eq(label, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  console.log(ok ? `PASS ${label}` : `FAIL ${label} got=${JSON.stringify(got)} want=${JSON.stringify(want)}`)
}

const a = countJson('{"a":1,"b":[true,false,null,"x"],"c":{"d":2}}')
eq('T1.root', a.rootType, 'object')
eq('T1.maxDepth', a.maxDepth, 3)
eq('T1.counts', a.tc, { object: 2, array: 1, string: 1, number: 2, boolean: 2, null: 1 })

const b = countJson('[1,2,[3]]')
eq('T2.root', b.rootType, 'array')
eq('T2.maxDepth', b.maxDepth, 3)
eq('T2.counts', b.tc, { object: 0, array: 2, string: 0, number: 3, boolean: 0, null: 0 })

const c = countJson('{}')
eq('T3.maxDepth', c.maxDepth, 1)
eq('T3.counts.object', c.tc.object, 1)

let threw = false
try { scanJson('{"a":1,}') } catch { threw = true }
console.log(threw ? 'PASS T4.trailingCommaRejected' : 'FAIL T4.trailingCommaRejected')

let eof, token
try { scanJson('{"a":1') } catch (e) { eof = e.message }
try { scanJson('{"a":@}') } catch (e) { token = e.message }
console.log(eof === 'Unexpected end of input' ? 'PASS T5.eof' : `FAIL T5.eof ${eof}`)
console.log(/Unexpected token/.test(token || '') ? 'PASS T5.token' : `FAIL T5.token ${token}`)

const lines = ['{"x":1}', '[1,2,3]', '{"y":null}']
const tc = emptyTypeCounts()
let max = 0
for (const raw of lines) {
  const v = JSON.parse(raw)
  accumulateValue(v, tc)
  max = Math.max(max, valueDepth(v))
}
eq('T6.maxDepth', max, 2)
eq('T6.counts', tc, { object: 2, array: 1, string: 0, number: 4, boolean: 0, null: 1 })

console.log('DONE')
