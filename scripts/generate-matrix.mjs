/** Generate the reviewer-facing prediction matrix from the actual fixtures. */
import { writeFileSync } from 'node:fs'
import { PREDICTION_MATRIX } from '../src/data/predictionMatrix.ts'
import { evaluateExposure } from '../src/domain/prediction/exposurePolicy.ts'
import { roundPrediction } from '../src/domain/promise/roundPrediction.ts'
import { PROMISE_POLICY } from '../src/config/promisePolicy.ts'
import { getProduct } from '../src/data/products.ts'
import { getPostcodeArea } from '../src/data/postcodes.ts'

const rows = PREDICTION_MATRIX.map(p => {
  const d = evaluateExposure(p)
  const w = roundPrediction(p)
  return { p, d, w }
})

const md = []
md.push('# Prediction matrix\n')
md.push('Every modelled combination in the prototype, straight from the fixtures.\n')
md.push('**This is mock data.** These are fabricated demo values standing in for a real')
md.push('delivery prediction service. They are not Redcare data and make no claim about')
md.push('real carrier performance.\n')
md.push('The point of publishing it is to show the transformation the product layer performs:\n')
md.push('```')
md.push('carrier-specific distribution  ->  exposure decision  ->  rounded business days  ->  calendar promise')
md.push('```\n')
md.push(`Exposure gates: confidence >= ${PROMISE_POLICY.minConfidence}, calibration error <= ${PROMISE_POLICY.maxCalibrationError}, support >= ${PROMISE_POLICY.minSupportN}. All three must pass.\n`)
md.push('A withheld row is not an error: the model returned a value and product policy declined to show it. The customer sees `Lieferung in 1–3 Werktagen` and is never told why.\n')
md.push('| Product | PLZ | City | Method | Carrier | mean | q10 | q50 | q90 | conf. | calib. | n | Exposed? | Window | Customer sees |')
md.push('|---|---|---|---|---|--:|--:|--:|--:|--:|--:|--:|---|---|---|')

for (const { p, d, w } of rows) {
  const city = getPostcodeArea(p.postcode)?.city ?? ''
  const name = getProduct(p.productId)?.name.split(' ').slice(0,2).join(' ') ?? p.productId
  const exposed = d.safeToExpose ? 'yes' : `no (${d.reason})`
  const win = d.safeToExpose ? `${w.min}-${w.max} Werktage` : '-'
  const sees = d.safeToExpose ? 'calendar date window' : 'Lieferung in 1–3 Werktagen'
  md.push(`| ${name} | ${p.postcode} | ${city} | ${p.method} | ${p.provider.toUpperCase()} | ${p.meanBusinessDays} | ${p.q10BusinessDays} | ${p.q50BusinessDays} | ${p.q90BusinessDays} | ${p.confidenceScore} | ${p.calibrationError} | ${p.supportN} | ${exposed} | ${win} | ${sees} |`)
}

const withheld = rows.filter(r => !r.d.safeToExpose)
md.push(`\n## Summary\n`)
md.push(`- ${rows.length} modelled combinations`)
md.push(`- ${rows.length - withheld.length} safe to expose`)
md.push(`- ${withheld.length} withheld, all falling back to the broad promise`)
md.push(`- Vagisan appears nowhere: the model has no coverage for it at all\n`)
md.push('### Withheld combinations\n')
md.push('| Product | PLZ | Method | Carrier | Reason |')
md.push('|---|---|---|---|---|')
for (const { p, d } of withheld) {
  md.push(`| ${getProduct(p.productId)?.name.split(' ').slice(0,2).join(' ')} | ${p.postcode} | ${p.method} | ${p.provider.toUpperCase()} | ${d.reason} |`)
}
writeFileSync('docs/demo/prediction-matrix.md', md.join('\n') + '\n')
console.log(`wrote ${rows.length} rows, ${withheld.length} withheld`)
