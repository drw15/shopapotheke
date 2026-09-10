/** Dev helper: capture a page at 1440 width for visual comparison. */
import { chromium } from '@playwright/test'
const [out, url, h = '900'] = process.argv.slice(2)
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: Number(h) } })
await p.goto(url, { waitUntil: 'networkidle' })
await p.screenshot({ path: out })
await b.close()
