/** Dev helper: reach checkout through the real journey, then capture. */
import { chromium } from '@playwright/test'
const [out, postcode, step = 'address', h = '900'] = process.argv.slice(2)
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: Number(h) } })
await p.goto('http://localhost:5173/product/voltaren', { waitUntil: 'networkidle' })
await p.getByRole('button', { name: /Ihre PLZ/ }).click()
await p.getByLabel('Postleitzahl').fill(postcode)
await p.getByRole('button', { name: 'OK' }).click()
await p.getByRole('button', { name: /In den Warenkorb/ }).click()
await p.waitForURL('**/basket')
await p.getByRole('button', { name: 'Zur Kasse' }).click()
await p.waitForURL('**/checkout/address')
if (step === 'pickup-modal' || step === 'pickup') {
  await p.getByText(/Holen Sie Ihre Bestellung/).click()
  await p.waitForTimeout(200)
  if (step === 'pickup-modal') await p.getByRole('button', { name: /Wählen Sie einen Abholort/ }).click()
  await p.waitForTimeout(300)
}
await p.waitForTimeout(200)
await p.screenshot({ path: out })
await b.close()
