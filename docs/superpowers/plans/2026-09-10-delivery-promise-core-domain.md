# Delivery Promise Core Domain Implementation Plan

**Goal:** Implement deterministic prediction fixtures, exposure gating, business-day/cutoff logic, promise construction, and fulfilment planning behind stable interfaces.

**Architecture:** The UI will depend on customer-ready promise services only. Raw model fixtures, exposure policy, calendar rules, and shipment planning live in separate modules and are independently testable.

**Tech stack:** TypeScript, Vitest, date-fns, date-fns-tz, date-holidays.

## Global Constraints

- Read `docs/superpowers/specs/2026-09-10-delivery-promise-design.md` and `docs/superpowers/plans/2026-09-10-delivery-promise-implementation-index.md` first.
- Raw model values are not UI data.
- Standard carriers are DHL and Hermes only.
- q10/q90 are prototype bounds; production quantiles are a Product + Data + Last Mile decision.
- Precise exposure requires confidence >= 0.90, calibration error <= 0.03, and support >= 500.
- Fallback is `Lieferung in 1–3 Werktagen`.
- Customer delivery calendar is Monday-Friday, skipping destination holidays.
- Customer-facing cutoff is 19:00 Europe/Berlin and is deterministic.
- Known pre-confirmation operational disruption belongs in model context, not ad-hoc UI adjustments.

## Task 1: Scaffold domain test environment and shared types

**Create:**
- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `src/test/setup.ts`
- `src/domain/types.ts`
- `src/config/promisePolicy.ts`

**Interfaces:**

```ts
export type DeliveryMethod = 'home' | 'pickup'
export type Provider = 'dhl' | 'hermes'
export type FulfilmentGroup = 'sevenum-demo' | 'external-demo'

export type RawDeliveryPrediction = {
  productId: string
  postcode: string
  method: DeliveryMethod
  provider: Provider
  meanBusinessDays: number
  q10BusinessDays: number
  q50BusinessDays: number
  q90BusinessDays: number
  confidenceScore: number
  calibrationError: number
  supportN: number
  modelVersion: 'demo-v1'
}
```

**Failing test first:** create `src/config/promisePolicy.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { PROMISE_POLICY } from './promisePolicy'

describe('promise policy config', () => {
  it('locks the agreed prototype thresholds', () => {
    expect(PROMISE_POLICY).toEqual({
      minConfidence: 0.9,
      maxCalibrationError: 0.03,
      minSupportN: 500,
      fallbackMinBusinessDays: 1,
      fallbackMaxBusinessDays: 3,
      customerCutoffHour: 19,
    })
  })
})
```

Run:

```bash
npm run test:run -- src/config/promisePolicy.test.ts
```

Expected failure: missing module/config.

**Minimal implementation:**

```ts
export const PROMISE_POLICY = {
  minConfidence: 0.9,
  maxCalibrationError: 0.03,
  minSupportN: 500,
  fallbackMinBusinessDays: 1,
  fallbackMaxBusinessDays: 3,
  customerCutoffHour: 19,
} as const
```

Run:

```bash
npm run test:run
npm run build
```

Expected: pass.

**Commit:**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts src/test src/domain/types.ts src/config
git commit -m "chore: scaffold delivery promise domain"
```

## Task 2: Add products, postcodes, carrier/service-specific prediction fixtures, and exposure gating

**Create:**
- `src/data/products.ts`
- `src/data/postcodes.ts`
- `src/data/predictions.ts`
- `src/domain/prediction/exposurePolicy.ts`
- `src/domain/prediction/exposurePolicy.test.ts`
- `src/domain/prediction/predictionService.ts`
- `src/domain/prediction/predictionService.test.ts`

**Required demo catalogue:** Voltaren, Vitamin D3, Fenistil, Ibu-ratiopharm as `sevenum-demo`; Vagisan as fictional `external-demo`, model-ineligible.

**Required postcodes:** `50667` Köln/NW, `60311` Frankfurt/HE, `22083` Hamburg/HH, `10115` Berlin/BE, `80331` München/BY.

**Prediction fixture rule:** 4 model-eligible products × 5 postcodes × 4 service combinations = 80 rows. Each combination stores separate raw distributions for home-DHL, home-Hermes, pickup-DHL, pickup-Hermes. Raw DHL/Hermes values usually differ slightly but mostly round to the same customer-facing window. Only a few rows should cross a rounding boundary; visible standard-carrier difference may not exceed roughly one business day.

Use these anchor rows exactly and interpolate the rest according to the approved design's geography rules:

```ts
// Voltaren, 50667
{ productId:'voltaren', postcode:'50667', method:'home', provider:'dhl', meanBusinessDays:1.10, q10BusinessDays:.60, q50BusinessDays:1.05, q90BusinessDays:1.60, confidenceScore:.97, calibrationError:.01, supportN:4200, modelVersion:'demo-v1' }
{ productId:'voltaren', postcode:'50667', method:'home', provider:'hermes', meanBusinessDays:1.18, q10BusinessDays:.65, q50BusinessDays:1.12, q90BusinessDays:1.72, confidenceScore:.96, calibrationError:.01, supportN:3950, modelVersion:'demo-v1' }

// Vitamin D3, 80331: deliberate fallback scenario
{ productId:'vitamin-d3', postcode:'80331', method:'home', provider:'dhl', meanBusinessDays:2.34, q10BusinessDays:1.42, q50BusinessDays:2.24, q90BusinessDays:3.18, confidenceScore:.92, calibrationError:.02, supportN:420, modelVersion:'demo-v1' }
{ productId:'vitamin-d3', postcode:'80331', method:'home', provider:'hermes', meanBusinessDays:2.44, q10BusinessDays:1.50, q50BusinessDays:2.34, q90BusinessDays:3.30, confidenceScore:.88, calibrationError:.02, supportN:720, modelVersion:'demo-v1' }

// Fenistil, 10115: deliberate visible carrier-difference scenario
{ productId:'fenistil', postcode:'10115', method:'home', provider:'dhl', meanBusinessDays:2.46, q10BusinessDays:1.82, q50BusinessDays:2.38, q90BusinessDays:2.96, confidenceScore:.94, calibrationError:.02, supportN:2000, modelVersion:'demo-v1' }
{ productId:'fenistil', postcode:'10115', method:'home', provider:'hermes', meanBusinessDays:2.74, q10BusinessDays:2.04, q50BusinessDays:2.66, q90BusinessDays:3.62, confidenceScore:.94, calibrationError:.02, supportN:1880, modelVersion:'demo-v1' }

// Ibu, 80331: one carrier safe, one unsafe
{ productId:'ibu', postcode:'80331', method:'home', provider:'dhl', meanBusinessDays:2.02, q10BusinessDays:1.20, q50BusinessDays:1.96, q90BusinessDays:2.68, confidenceScore:.94, calibrationError:.02, supportN:3000, modelVersion:'demo-v1' }
{ productId:'ibu', postcode:'80331', method:'home', provider:'hermes', meanBusinessDays:2.10, q10BusinessDays:1.26, q50BusinessDays:2.04, q90BusinessDays:2.76, confidenceScore:.89, calibrationError:.02, supportN:2850, modelVersion:'demo-v1' }
```

**Interface:**

```ts
export type ExposureDecision = {
  safeToExpose: boolean
  reason: 'safe' | 'low-confidence' | 'poor-calibration' | 'low-support'
}

export function evaluateExposure(prediction: RawDeliveryPrediction): ExposureDecision
export function getRawPrediction(input: { productId: string; postcode: string; method: DeliveryMethod; provider: Provider }): RawDeliveryPrediction | null
```

**Failing test first:**

```ts
import { describe, expect, it } from 'vitest'
import { evaluateExposure } from './exposurePolicy'

const safe = {
  productId:'voltaren', postcode:'50667', method:'home', provider:'dhl',
  meanBusinessDays:1.1, q10BusinessDays:.6, q50BusinessDays:1.05, q90BusinessDays:1.6,
  confidenceScore:.97, calibrationError:.01, supportN:4200, modelVersion:'demo-v1'
} as const

describe('evaluateExposure', () => {
  it('requires all three gates to pass', () => {
    expect(evaluateExposure(safe)).toEqual({ safeToExpose:true, reason:'safe' })
    expect(evaluateExposure({ ...safe, confidenceScore:.89 }).reason).toBe('low-confidence')
    expect(evaluateExposure({ ...safe, calibrationError:.04 }).reason).toBe('poor-calibration')
    expect(evaluateExposure({ ...safe, supportN:499 }).reason).toBe('low-support')
  })
})
```

Run `npm run test:run -- src/domain/prediction/exposurePolicy.test.ts`.

Expected failure: missing policy module.

**Minimal implementation:**

```ts
export function evaluateExposure(p: RawDeliveryPrediction): ExposureDecision {
  if (p.confidenceScore < PROMISE_POLICY.minConfidence) return { safeToExpose:false, reason:'low-confidence' }
  if (p.calibrationError > PROMISE_POLICY.maxCalibrationError) return { safeToExpose:false, reason:'poor-calibration' }
  if (p.supportN < PROMISE_POLICY.minSupportN) return { safeToExpose:false, reason:'low-support' }
  return { safeToExpose:true, reason:'safe' }
}
```

Also test:
- 80 fixture rows exist;
- Vagisan returns `null`;
- unknown postcode returns `null`;
- all Vitamin D3 München standard-home rows fail exposure;
- Ibu München DHL home passes while Hermes home fails.

Run:

```bash
npm run test:run -- src/domain/prediction
npm run build
```

**Commit:** `git commit -m "feat: add prediction fixtures and exposure policy"`

## Task 3: Add delivery calendar, German holidays, Berlin cutoff, and date formatting

**Create:**
- `src/domain/calendar/businessCalendar.ts`
- `src/domain/calendar/cutoffPolicy.ts`
- `src/domain/calendar/formatGermanDate.ts`
- `src/domain/calendar/businessCalendar.test.ts`
- `src/domain/calendar/cutoffPolicy.test.ts`

**Interfaces:**

```ts
export function isDeliveryDay(date: string, postcode: string): boolean
export function addDeliveryDays(date: string, count: number, postcode: string): string
export function getEffectiveOrderDate(now: Date): string
export function toCalendarWindow(input: { now: Date; postcode: string; minBusinessDays: number; maxBusinessDays: number }): { minDate: string; maxDate: string }
export function cutoffChangesDisplayedPromise(input: { nowBeforeCutoff: Date; postcode: string; minBusinessDays: number; maxBusinessDays: number }): boolean
export function formatPromiseRange(minDate: string, maxDate: string): string
```

**Failing test first:**

```ts
import { describe, expect, it } from 'vitest'
import { addDeliveryDays } from './businessCalendar'

describe('delivery calendar', () => {
  it('skips weekends', () => {
    expect(addDeliveryDays('2026-09-10', 2, '22083')).toBe('2026-09-14')
  })
  it('skips Bavaria Epiphany', () => {
    expect(addDeliveryDays('2026-01-05', 1, '80331')).toBe('2026-01-07')
  })
})
```

Expected first failure: missing module.

**Minimal implementation:** use `date-holidays` with destination state from `postcodes.ts`; use `date-fns-tz` to interpret `now` in `Europe/Berlin`. Customer delivery dates skip weekends and destination holidays. Do not use destination holidays to invent dispatch-side closure behavior.

Add a cutoff test with fixed Berlin instants before and after 19:00 and verify a Friday-to-Monday shift can trigger `showCutoff`.

Run:

```bash
npm run test:run -- src/domain/calendar
npm run build
```

**Commit:** `git commit -m "feat: add delivery calendar and cutoff policy"`

## Task 4: Add option promise, pre-carrier envelope, shipment promise, and material-split logic

**Create:**
- `src/domain/promise/types.ts`
- `src/domain/promise/optionPromise.ts`
- `src/domain/promise/preCarrierPromise.ts`
- `src/domain/promise/shipmentPromise.ts`
- `src/domain/promise/materialSplit.ts`
- tests for each module
- `src/domain/fulfilment/shipmentPlanner.ts`
- `src/domain/fulfilment/shipmentPlanner.test.ts`

**Customer-ready type:**

```ts
export type CustomerPromise = {
  mode: 'precise' | 'fallback'
  minBusinessDays: number
  maxBusinessDays: number
  minDate: string | null
  maxDate: string | null
  displayText: string
  showCutoff: boolean
  internalReason: 'precise' | 'missing-postcode' | 'missing-prediction' | 'unsafe-prediction' | 'unsupported-product' | 'prediction-error'
}
```

**Exact rounding rule:**

```ts
const minBusinessDays = Math.max(1, Math.ceil(prediction.q10BusinessDays))
const maxBusinessDays = Math.max(minBusinessDays, Math.ceil(prediction.q90BusinessDays))
```

**Interfaces:**

```ts
export function getOptionPromise(input: { productId:string; postcode:string|null; method:DeliveryMethod; provider:Provider; now:Date }): CustomerPromise
export function getPreCarrierHomePromise(input: { productIds:string[]; postcode:string|null; now:Date }): CustomerPromise
export function planShipments(productIds:string[]): PlannedShipment[]
export function getShipmentPromise(input: { shipment:PlannedShipment; postcode:string|null; method:DeliveryMethod; provider:Provider; now:Date }): CustomerPromise
export function isMaterialSplit(input: { shipmentPromises:CustomerPromise[]; postcode:string }): boolean
```

**Failing test first:**

```ts
it('falls back before carrier selection if one standard home carrier is unsafe', () => {
  const p = getPreCarrierHomePromise({ productIds:['ibu'], postcode:'80331', now:new Date('2026-09-10T08:00:00Z') })
  expect(p.mode).toBe('fallback')
  expect(p.displayText).toBe('Lieferung in 1–3 Werktagen')
})
```

Expected failure: missing service.

**Minimal implementation rules:**
- `getOptionPromise` catches lookup errors and returns fallback.
- `getPreCarrierHomePromise` resolves DHL+Hermes independently. Any fallback broadens the upper-funnel result to fallback.
- For same-parcel multiple products, use the slowest-item constraint per service: maximum item minimum and maximum item maximum; if one product falls back for that service, that service-level shipment promise falls back.
- `planShipments`: Sevenum demo products consolidate; Vagisan becomes one separate external-demo shipment.
- `isMaterialSplit`: true when later shipment latest promise is at least one eligible delivery day later than earlier shipment latest promise, or the earlier shipment has an actionable cutoff.

Add tests for:
- q10/q90 rounding;
- one-carrier unsafe envelope;
- Fenistil Berlin carrier difference;
- same-fulfilment consolidation;
- external split;
- Friday-vs-Monday material split;
- same-date split hidden;
- cutoff-based material split.

Run:

```bash
npm run test:run -- src/domain
npm run build
```

**Commit:** `git commit -m "feat: add promise and fulfilment domain services"`

## Core-domain completion gate

Run exactly:

```bash
npm run test:run -- src/domain
npm run build
```

Expected: green. Do not begin UI work until this passes.
