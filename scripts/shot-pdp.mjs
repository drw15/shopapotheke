/** Dev helper: capture the PDP with a postcode entered via the real UI. */
import { chromium } from '@playwright/test'
const [out, productId, postcode, h = '700'] = process.argv.slice(2)
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: Number(h) } })
await p.goto(`http://localhost:5173/product/${productId}`, { waitUntil: 'networkidle' })
if (postcode && postcode !== '-') {
  await p.getByRole('button', { name: /Ihre PLZ/ }).click()
  await p.getByLabel('Postleitzahl').fill(postcode)
  await p.getByRole('button', { name: 'OK' }).click()
  await p.waitForTimeout(250)
}
await p.screenshot({ path: out })
await b.close()
