/** Dev helper: reach the Versand step through the real journey. */
import { chromium } from '@playwright/test'
const [out, ids, postcode, mode = 'plain', h = '900'] = process.argv.slice(2)
const list = ids.split(',')
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: Number(h) } })
await p.goto(`http://localhost:5173/product/${list[0]}`, { waitUntil: 'networkidle' })
await p.getByRole('button', { name: /Ihre PLZ/ }).click()
await p.getByLabel('Postleitzahl').fill(postcode)
await p.getByRole('button', { name: 'OK' }).click()
await p.getByRole('button', { name: /In den Warenkorb/ }).click()
await p.waitForURL('**/basket')
for (const id of list.slice(1)) {
  await p.locator('.suggestion-card').filter({ has: p.locator(`a[href="/product/${id}"]`) })
    .locator('.suggestion-card__add').click()
  await p.waitForTimeout(150)
}
await p.getByRole('button', { name: 'Zur Kasse' }).click()
await p.waitForURL('**/checkout/address')
await p.getByRole('button', { name: 'Weiter zum Versand' }).click()
await p.waitForURL('**/checkout/shipping')
if (mode === 'override') {
  await p.locator('.shipping-block').first().getByRole('button', { name: 'Lieferart ändern' }).click()
  await p.waitForTimeout(200)
  await p.getByLabel('An einen Abholort').click()
  await p.waitForTimeout(250)
  await p.getByRole('button', { name: 'Abholstation übernehmen' }).click()
  await p.waitForTimeout(250)
}
await p.evaluate(() => window.scrollTo(0, 0))
await p.waitForTimeout(200)
await p.screenshot({ path: out })
await b.close()
