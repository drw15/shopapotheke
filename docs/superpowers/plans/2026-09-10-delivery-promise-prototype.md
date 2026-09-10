# Shop Apotheke Delivery Promise Prototype Implementation Plan

**Goal:** Build a high-fidelity Shop Apotheke prototype that turns carrier/service-specific delivery predictions into progressively precise customer promises across PDP, basket, checkout, confirmation, tracking, and proactive delay email.

**Architecture:** A React + TypeScript + Vite client uses deterministic mock data behind explicit domain services: prediction lookup, exposure policy, business calendar/cutoff policy, promise construction, fulfilment planning, checkout delivery options, order confirmation, and tracking. Customer-facing components consume only customer-ready promise/view models; they never read raw model metadata directly.

**Tech stack:** React, TypeScript, Vite, React Router, Vitest, Testing Library, Playwright, date-fns/date-fns-tz, date-holidays, plain CSS with locked design tokens.

**Approved design source of truth:** `docs/superpowers/specs/2026-09-10-delivery-promise-design.md`

## Global Constraints

- The approved design above is authoritative. `docs/DESIGN.md` and `docs/SPEC.md` are earlier drafts and must be marked superseded before implementation proceeds.
- Do not redesign Shop Apotheke. Reproduce the interaction and visual language from the provided screenshots, then change only the delivery-promise behavior required by the approved design.
- Do not use Tailwind, Material UI, Chakra, Bootstrap, shadcn, or another component/theme system. Use plain CSS and the locked tokens below so an implementation agent cannot drift into a generic ecommerce design.
- Do not introduce DPD or any carrier not approved in the design. Standard demo carriers are DHL and Hermes only.
- Do not flatten home and pickup into one carrier list. The first-level choice remains `An eine Lieferadresse` versus `An einen Abholort`.
- Do not add `Recommended`, `Best option`, cost-saving copy, or any message that tells customers to choose PUDO for Redcare's economics.
- NOW! is visually preserved only where useful for current-page fidelity. It is not part of the new standard prediction engine, not a test scenario, and must not influence standard DHL/Hermes promise calculations.
- Raw prediction fields (`mean`, `q10`, `q50`, `q90`, confidence, calibration, sample support) are never customer-facing.
- A precise customer promise requires all prototype exposure gates to pass. Otherwise use the safe `Lieferung in 1–3 Werktagen` fallback without blocking shopping.
- Before carrier selection, PDP and basket use the envelope across safe customer promises for both eligible standard home carriers. If one carrier falls back, that fallback participates in the envelope.
- Cutoff is deterministic operational policy. Show `Bei Bestellung bis 19:00` only when crossing 19:00 changes the displayed promise.
- Delivery promises must skip Saturday, Sunday, and applicable German public holidays. Customer delivery is modeled Monday–Friday and no later than 18:00.
- Known operational disruption before confirmation belongs in model context; do not add ad-hoc `+1 day` UI logic.
- The basket surfaces split shipments only when the split is materially useful: an earlier shipment is at least one eligible delivery day earlier than the later shipment, or an actionable cutoff changes the earlier shipment's promise.
- Basket material split: compact thumbnails + product names. Checkout shipment header: tiny thumbnails + item count only.
- Split shipments inherit the order-level destination by default. `Lieferart ändern` is optional and changes only the targeted shipment.
- Confirmation freezes the customer-facing promise per shipment. Tracking maintains a separate current ETA. A later ETA never overwrites the confirmed promise.
- Tracking and delay-email preview must read the same order/shipment data.
- No hidden demo-control panel. Reviewer scenarios are produced by normal actions and documented product/postcode/order fixtures.
- Use fictional demo data and generic customer data. Do not commit the user's real address or other personal data from screenshots.
- Product images should be downloaded from the current public Shop Apotheke product pages and bundled locally. If an exact image cannot be obtained, use a neutral white product-image placeholder with the correct product name; do not generate substitute product art with AI.

## Visual Fidelity Contract — non-negotiable

These values are pixel-sampled from the provided Shop Apotheke screenshots and are the implementation tokens. Do not invent a new palette.

| Token | Value | Use |
|---|---|---|
| `--sa-red` | `#E90033` | primary CTA, selected radios, links/icons that are red in reference |
| `--sa-green` | `#006C48` | delivery/availability text |
| `--sa-text` | `#1B1C1B` | primary text |
| `--sa-white` | `#FFFFFF` | page/card background |
| `--sa-surface` | `#FBF9F8` | checkout cards, PDP purchase surface, warm neutral panels |
| `--sa-peach-soft` | `#FFECE6` | basket shipping/free-shipping panel |
| `--sa-peach-nav` | `#FFC8B3` | retail navigation bar |
| `--sa-border` | `#E5E4E3` | separators and card borders |
| `--sa-email-peach` | `#FDD1BC` | email branded/support blocks |
| `--sa-email-lavender` | `#D3CFFF` | optional existing-email-style secondary promo block only; not needed in delay email unless used as a footer reference |
| `--dhl-yellow` | `#FFCC00` | small DHL provider badge only |
| `--hermes-blue` | `#009AD8` | small Hermes provider badge only |

Typography and geometry:

- Font stack: `Arial, Helvetica, sans-serif`. Do not import a decorative replacement for Shop Apotheke's proprietary typeface.
- Primary text color is `#1B1C1B`; body copy 14–16px; page titles 24–28px with medium weight; section titles 18–22px.
- Main desktop retail content width: 980px–1080px centered.
- Basket reference content width: approximately 980px.
- Checkout reference grid at desktop: approximately 565px main card + 16px gap + 398px order-summary column inside a ~980px centered container.
- Primary buttons: 52–56px high, pill radius 28px, `#E90033`, white text, no gradient.
- Cards: 14–16px radius. Use `#FBF9F8` for the large checkout/purchase surfaces and `#FFFFFF` for white cards.
- Selected radio: red outer ring + red center; diameter approximately 24px. Unselected radio uses neutral border.
- Retail header: white main row; pale-peach navigation row `#FFC8B3`; logo/search/account/cart structure matching the basket screenshot.
- Checkout header: simpler white header with Shop Apotheke wordmark and `Adresse / Versand / Zahlung / Prüfen` stepper. Do not use the retail category navigation inside checkout.
- Basket `Versand durch Shop Apotheke` panel: `#FFECE6`, rounded 16px, compact progress bar using `#E90033`.
- Delivery copy such as `Lieferzeitraum` and availability uses `#006C48` as in the screenshots.
- Pickup selector modal: wide white modal; search field across the top; filter controls beneath; station list on the left and a static map-style panel on the right. Do not integrate a real map SDK for the prototype.
- Delay email: 600px max-width centered email body, white/`#FBF9F8` background, `#FDD1BC` brand/support surfaces, rounded red CTA. Do not invent a modern SaaS email template.
- Desktop 1440×900 is the primary review viewport. At widths below 900px, checkout columns may stack, but desktop fidelity has priority.

Visual implementation guardrails:

1. All CSS colors outside `src/styles/tokens.css` must use CSS variables; no scattered hex values.
2. Product pages/components may not contain raw model terms such as `q10`, `q90`, `confidenceScore`, `calibrationError`, or `supportN`.
3. Source UI may not contain the string `DPD`.
4. Do not add badges such as `Recommended` or `Best option`.
5. Do not add green information banners/cards that are not present in the reference experience. Green is for delivery/availability text, not a new visual system.
6. Do not add giant card layouts or dashboard navigation. The prototype should read as Shop Apotheke, not as a design exercise.

---

## Task 1: Scaffold the app and lock the source of truth + visual system

**Deliverable:** A runnable/testable React shell whose repo-level instructions and CSS tokens make visual/product drift difficult before feature work starts.

**Create:**
- `AGENTS.md`
- `package.json` / `package-lock.json`
- `tsconfig.json`
- `vite.config.ts`
- `eslint.config.js`
- `index.html`
- `src/main.tsx`
- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/test/setup.ts`
- `src/styles/tokens.css`
- `src/styles/global.css`
- `src/components/brand/ShopApothekeWordmark.tsx`
- `src/components/layout/StoreHeader.tsx`
- `src/components/layout/CheckoutHeader.tsx`
- `src/pages/PlaceholderPage.tsx`
- `docs/reference/visual-fidelity.md`
- `scripts/check-design-contract.mjs`

**Modify:**
- `docs/DESIGN.md`
- `docs/SPEC.md`

### Interfaces consumed / produced

```ts
export function App(): JSX.Element
export function AppRoutes(): JSX.Element
export function StoreHeader(): JSX.Element
export function CheckoutHeader(props: { activeStep: 'address' | 'shipping' | 'payment' | 'review' }): JSX.Element
```

### Steps

- [ ] Replace the first lines of `docs/DESIGN.md` and `docs/SPEC.md` with a prominent superseded notice linking to the approved design and this plan. Do not delete history.
- [ ] Create `AGENTS.md` containing the Global Constraints and Visual Fidelity Contract from this plan, plus a rule that every implementation agent must read the approved design and current plan before changing code.
- [ ] Initialize npm and install runtime dependencies:

```bash
npm init -y
npm install react react-dom react-router-dom date-fns date-fns-tz date-holidays lucide-react
npm install -D typescript vite @vitejs/plugin-react vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test eslint @eslint/js typescript-eslint tsx @types/node
```

- [ ] Add scripts:

```bash
npm pkg set scripts.dev="vite"
npm pkg set scripts.build="tsc --noEmit && vite build"
npm pkg set scripts.test="vitest"
npm pkg set scripts.test:run="vitest run"
npm pkg set scripts.lint="eslint ."
npm pkg set scripts.e2e="playwright test"
npm pkg set scripts.export:matrix="tsx scripts/exportDemoMatrix.ts"
npm pkg set scripts.check:design="node scripts/check-design-contract.mjs"
```

- [ ] Create the config files and test setup.
- [ ] Create `tokens.css` exactly from the Visual Fidelity Contract.
- [ ] Create `global.css` with white body, `Arial/Helvetica`, `#1B1C1B`, box-sizing reset, semantic button/input inheritance, and no global card shadow/style library.
- [ ] Create separate `StoreHeader` and `CheckoutHeader`; never reuse the retail nav inside checkout.
- [ ] Create placeholder routes for `/product/voltaren`, `/basket`, `/checkout/address`, `/checkout/shipping`, `/checkout/payment`, `/checkout/review`, `/orders`, and `/email-preview/100422` so subsequent tasks can replace them independently.
- [ ] Create `docs/reference/visual-fidelity.md` by copying the exact palette, geometry, header, basket, checkout, pickup-modal, and email rules from this plan.
- [ ] Create `scripts/check-design-contract.mjs` that scans `src/**/*.css` and fails if a hex literal appears outside `src/styles/tokens.css`; scans `src/pages` + `src/components` and fails on `DPD`, `Recommended`, `Best option`, `q10BusinessDays`, `q90BusinessDays`, `confidenceScore`, `calibrationError`, or `supportN`.

### Failing test first

Create `src/app/App.test.tsx` before `App.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from './App'

describe('application shell', () => {
  it('uses the retail header on product pages', () => {
    render(
      <MemoryRouter initialEntries={['/product/voltaren']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(screen.getByText('Shop Apotheke')).toBeInTheDocument()
    expect(screen.getByText('Kategorien')).toBeInTheDocument()
  })

  it('uses the checkout stepper without retail navigation in checkout', () => {
    render(
      <MemoryRouter initialEntries={['/checkout/address']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(screen.getByText('Adresse')).toBeInTheDocument()
    expect(screen.getByText('Versand')).toBeInTheDocument()
    expect(screen.queryByText('Kategorien')).not.toBeInTheDocument()
  })
})
```

Run:

```bash
npm run test:run -- src/app/App.test.tsx
```

**Expected failure:** import resolution failure for `./App` or missing exported `AppRoutes`.

### Minimal implementation

`src/app/App.tsx`:

```tsx
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { CheckoutHeader } from '../components/layout/CheckoutHeader'
import { StoreHeader } from '../components/layout/StoreHeader'
import { PlaceholderPage } from '../pages/PlaceholderPage'

function RoutedPage() {
  const location = useLocation()
  const checkout = location.pathname.startsWith('/checkout/')
  const step = location.pathname.includes('/shipping')
    ? 'shipping'
    : location.pathname.includes('/payment')
      ? 'payment'
      : location.pathname.includes('/review')
        ? 'review'
        : 'address'

  return (
    <>
      {checkout ? <CheckoutHeader activeStep={step} /> : <StoreHeader />}
      <PlaceholderPage />
    </>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/product/voltaren" replace />} />
      <Route path="/product/:productId" element={<RoutedPage />} />
      <Route path="/basket" element={<RoutedPage />} />
      <Route path="/checkout/:step" element={<RoutedPage />} />
      <Route path="/orders" element={<RoutedPage />} />
      <Route path="/orders/:orderId" element={<RoutedPage />} />
      <Route path="/email-preview/:orderId" element={<RoutedPage />} />
    </Routes>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
```

`src/styles/tokens.css`:

```css
:root {
  --sa-red: #E90033;
  --sa-green: #006C48;
  --sa-text: #1B1C1B;
  --sa-white: #FFFFFF;
  --sa-surface: #FBF9F8;
  --sa-peach-soft: #FFECE6;
  --sa-peach-nav: #FFC8B3;
  --sa-border: #E5E4E3;
  --sa-email-peach: #FDD1BC;
  --sa-email-lavender: #D3CFFF;
  --dhl-yellow: #FFCC00;
  --hermes-blue: #009AD8;
  --sa-content-width: 1080px;
  --sa-checkout-width: 980px;
  --sa-radius-card: 16px;
  --sa-radius-control: 28px;
}
```

Run:

```bash
npm run test:run -- src/app/App.test.tsx
npm run check:design
npm run lint
npm run build
```

**Expected:** all commands pass; checkout has no category navigation; no off-token CSS colors exist.

### Commit

```bash
git add AGENTS.md package.json package-lock.json tsconfig.json vite.config.ts eslint.config.js index.html src docs scripts/check-design-contract.mjs
git commit -m "chore: scaffold prototype and lock visual contract"
```

---

## Task 2: Implement prediction contracts, fixtures, and exposure policy

**Deliverable:** Deterministic carrier/service-specific model-like data and a tested gate that decides whether a raw prediction is safe to expose.

**Create:**
- `src/config/promisePolicy.ts`
- `src/domain/prediction/types.ts`
- `src/domain/prediction/exposurePolicy.ts`
- `src/domain/prediction/predictionService.ts`
- `src/domain/prediction/exposurePolicy.test.ts`
- `src/domain/prediction/predictionService.test.ts`
- `src/data/products.ts`
- `src/data/postcodes.ts`
- `src/data/predictions.ts`

### Interfaces

```ts
export type DeliveryMethod = 'home' | 'pickup'
export type Provider = 'dhl' | 'hermes'

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

export type ExposureDecision = {
  safeToExpose: boolean
  reason: 'safe' | 'low-confidence' | 'poor-calibration' | 'low-support'
}

export function evaluateExposure(prediction: RawDeliveryPrediction): ExposureDecision

export function getRawPrediction(input: {
  productId: string
  postcode: string
  method: DeliveryMethod
  provider: Provider
}): RawDeliveryPrediction | null
```

`src/config/promisePolicy.ts`:

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

### Steps

- [ ] Create exact five-product catalogue: Voltaren, Vitamin D3, Fenistil, Ibu-ratiopharm, Vagisan.
- [ ] Mark Vagisan as fictional `external` demo fulfilment and standard-model-ineligible.
- [ ] Create exact five-postcode list: `50667`, `60311`, `22083`, `10115`, `80331` with state codes `NW`, `HE`, `HH`, `BE`, `BY`.
- [ ] Implement the 80 carrier/service prediction rows from Appendix A. There are 4 model-eligible products × 5 postcodes × 4 service combinations. Vagisan has no raw standard-model records.
- [ ] Keep carrier distributions close. Most DHL/Hermes differences must round to the same display window. Appendix A deliberately contains only a small set that cross a boundary.
- [ ] Do not add a population-share field. The demo matrix is scenario coverage, not an attempt to reproduce the case's 30.3% population mix.

### Failing test first

`src/domain/prediction/exposurePolicy.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { evaluateExposure } from './exposurePolicy'
import type { RawDeliveryPrediction } from './types'

const safe: RawDeliveryPrediction = {
  productId: 'voltaren',
  postcode: '50667',
  method: 'home',
  provider: 'dhl',
  meanBusinessDays: 1.1,
  q10BusinessDays: 0.6,
  q50BusinessDays: 1.05,
  q90BusinessDays: 1.6,
  confidenceScore: 0.97,
  calibrationError: 0.01,
  supportN: 4200,
  modelVersion: 'demo-v1',
}

describe('evaluateExposure', () => {
  it('requires confidence, calibration and sample support to all pass', () => {
    expect(evaluateExposure(safe)).toEqual({ safeToExpose: true, reason: 'safe' })
    expect(evaluateExposure({ ...safe, confidenceScore: 0.89 }).reason).toBe('low-confidence')
    expect(evaluateExposure({ ...safe, calibrationError: 0.04 }).reason).toBe('poor-calibration')
    expect(evaluateExposure({ ...safe, supportN: 499 }).reason).toBe('low-support')
  })
})
```

Run:

```bash
npm run test:run -- src/domain/prediction/exposurePolicy.test.ts
```

**Expected failure:** missing `exposurePolicy` module.

### Minimal implementation

```ts
import { PROMISE_POLICY } from '../../config/promisePolicy'
import type { ExposureDecision, RawDeliveryPrediction } from './types'

export function evaluateExposure(prediction: RawDeliveryPrediction): ExposureDecision {
  if (prediction.confidenceScore < PROMISE_POLICY.minConfidence) {
    return { safeToExpose: false, reason: 'low-confidence' }
  }
  if (prediction.calibrationError > PROMISE_POLICY.maxCalibrationError) {
    return { safeToExpose: false, reason: 'poor-calibration' }
  }
  if (prediction.supportN < PROMISE_POLICY.minSupportN) {
    return { safeToExpose: false, reason: 'low-support' }
  }
  return { safeToExpose: true, reason: 'safe' }
}
```

Add `predictionService.test.ts` asserting:

- Voltaren + `50667` + home + DHL resolves a row;
- Vagisan returns `null`;
- unknown postcode returns `null`;
- Vitamin D3 + `80331` has raw rows but at least one gate fails for every standard home carrier.

Run:

```bash
npm run test:run -- src/domain/prediction
npm run check:design
npm run lint
npm run build
```

**Expected:** all prediction tests pass; customer UI still contains no raw model terms.

### Commit

```bash
git add src/config src/domain/prediction src/data
 git commit -m "feat: add carrier-specific prediction fixtures and exposure policy"
```

---

## Task 3: Implement business-day, holiday, cutoff, and date-formatting policy

**Deliverable:** One tested calendar/cutoff layer used by every customer promise.

**Create:**
- `src/domain/calendar/types.ts`
- `src/domain/calendar/businessCalendar.ts`
- `src/domain/calendar/cutoffPolicy.ts`
- `src/domain/calendar/formatGermanDate.ts`
- `src/domain/calendar/businessCalendar.test.ts`
- `src/domain/calendar/cutoffPolicy.test.ts`

### Interfaces

```ts
export type LocalDate = string // YYYY-MM-DD only inside calendar domain

export function isDeliveryDay(date: LocalDate, postcode: string): boolean
export function addDeliveryDays(date: LocalDate, count: number, postcode: string): LocalDate
export function getBerlinLocalDate(now: Date): LocalDate
export function isAfterCustomerCutoff(now: Date): boolean
export function getEffectiveOrderDate(now: Date): LocalDate
export function toCalendarWindow(input: {
  now: Date
  postcode: string
  minBusinessDays: number
  maxBusinessDays: number
}): { minDate: LocalDate; maxDate: LocalDate }
export function cutoffChangesDisplayedPromise(input: {
  localOrderDate: LocalDate
  postcode: string
  minBusinessDays: number
  maxBusinessDays: number
}): boolean
export function formatPromiseRange(minDate: LocalDate, maxDate: LocalDate): string
```

### Rules

- Destination delivery calendar is Monday–Friday.
- Saturday/Sunday are never promise dates.
- `date-holidays` is configured with Germany + destination state (`NW`, `HE`, `HH`, `BE`, `BY`).
- Order time is interpreted in `Europe/Berlin` using `date-fns-tz`.
- After 19:00, the effective order start shifts to the next weekday. Do not use the destination's public holiday to simulate warehouse closure; dispatch-side disruptions are model context. Destination holidays are used only when counting customer delivery days.
- Format in `de-DE`: `Fr., 11. – Mo., 14. Sept.` or `Fr., 11. Sept.` for a single date.

### Failing test first

`src/domain/calendar/businessCalendar.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { addDeliveryDays } from './businessCalendar'

describe('business calendar', () => {
  it('skips weekends', () => {
    expect(addDeliveryDays('2026-09-10', 2, '22083')).toBe('2026-09-14')
  })

  it('skips Bavaria Epiphany', () => {
    expect(addDeliveryDays('2026-01-05', 1, '80331')).toBe('2026-01-07')
  })
})
```

Run:

```bash
npm run test:run -- src/domain/calendar/businessCalendar.test.ts
```

**Expected failure:** missing calendar module.

### Minimal implementation pattern

```ts
import Holidays from 'date-holidays'
import { addDays, format, parseISO } from 'date-fns'
import { POSTCODES } from '../../data/postcodes'
import type { LocalDate } from './types'

function subdivision(postcode: string) {
  return POSTCODES.find((item) => item.postcode === postcode)?.stateCode ?? null
}

export function isDeliveryDay(date: LocalDate, postcode: string) {
  const parsed = parseISO(date)
  const day = parsed.getDay()
  if (day === 0 || day === 6) return false

  const state = subdivision(postcode)
  if (!state) return true

  const holidays = new Holidays('DE', state)
  return !holidays.isHoliday(parsed)
}

export function addDeliveryDays(date: LocalDate, count: number, postcode: string): LocalDate {
  let cursor = parseISO(date)
  let remaining = count
  while (remaining > 0) {
    cursor = addDays(cursor, 1)
    const iso = format(cursor, 'yyyy-MM-dd')
    if (isDeliveryDay(iso, postcode)) remaining -= 1
  }
  return format(cursor, 'yyyy-MM-dd')
}
```

Add cutoff tests using fixed instants representing 18:59 and 19:01 in Berlin. Verify the cutoff label is not a permanent global flag: `cutoffChangesDisplayedPromise` compares the actual before/after calendar range.

Run:

```bash
npm run test:run -- src/domain/calendar
npm run check:design
npm run lint
npm run build
```

**Expected:** weekend, holiday, timezone, and cutoff tests pass.

### Commit

```bash
git add src/domain/calendar
 git commit -m "feat: add business calendar and cutoff policy"
```

---

## Task 4: Build customer promise services and the Shop Apotheke-like PDP

**Deliverable:** A PDP that falls back without postcode, recalculates silently by postcode, envelopes DHL/Hermes before carrier selection, and displays a calendar promise only when safe.

**Create:**
- `src/domain/promise/types.ts`
- `src/domain/promise/promiseWindow.ts`
- `src/domain/promise/optionPromise.ts`
- `src/domain/promise/pdpPromise.ts`
- `src/domain/promise/pdpPromise.test.ts`
- `src/state/ShopContext.tsx`
- `src/state/DemoClockContext.tsx`
- `src/components/delivery/DeliveryEstimate.tsx`
- `src/components/product/ProductPurchaseCard.tsx`
- `src/components/product/PostcodeControl.tsx`
- `src/components/product/ExistingNowServiceCard.tsx`
- `src/pages/ProductPage.tsx`
- `src/pages/ProductPage.test.tsx`
- `src/styles/product.css`
- local product-image assets under `public/assets/products/`

### Domain interfaces

```ts
export type PromiseMode = 'precise' | 'fallback'

export type CustomerPromise = {
  mode: PromiseMode
  minBusinessDays: number
  maxBusinessDays: number
  minDate: string | null
  maxDate: string | null
  displayText: string
  showCutoff: boolean
  internalReason: 'precise' | 'missing-postcode' | 'missing-prediction' | 'unsafe-prediction' | 'unsupported-product' | 'prediction-error'
}

export function roundPredictionWindow(prediction: RawDeliveryPrediction): {
  minBusinessDays: number
  maxBusinessDays: number
}

export function getOptionPromise(input: {
  productId: string
  postcode: string | null
  method: DeliveryMethod
  provider: Provider
  now: Date
}): CustomerPromise

export function getPdpPromise(input: {
  productId: string
  postcode: string | null
  now: Date
}): CustomerPromise
```

### Exact policy

```ts
minBusinessDays = Math.max(1, Math.ceil(q10BusinessDays))
maxBusinessDays = Math.max(minBusinessDays, Math.ceil(q90BusinessDays))
```

For PDP, resolve home+DHL and home+Hermes independently. If either produces fallback, return the broad fallback. If both are precise, use the earliest minimum date and latest maximum date across the two safe carrier promises.

### Failing test first

`src/domain/promise/pdpPromise.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getPdpPromise } from './pdpPromise'

const THURSDAY_MORNING = new Date('2026-09-10T08:00:00Z')

describe('PDP promise', () => {
  it('envelopes safe DHL and Hermes home promises before carrier selection', () => {
    const promise = getPdpPromise({
      productId: 'voltaren',
      postcode: '50667',
      now: THURSDAY_MORNING,
    })

    expect(promise.mode).toBe('precise')
    expect(promise.displayText).toContain('Fr.')
  })

  it('falls back if one standard home carrier is unsafe', () => {
    const promise = getPdpPromise({
      productId: 'ibu',
      postcode: '80331',
      now: THURSDAY_MORNING,
    })

    expect(promise.mode).toBe('fallback')
    expect(promise.displayText).toBe('Lieferung in 1–3 Werktagen')
  })
})
```

Run:

```bash
npm run test:run -- src/domain/promise/pdpPromise.test.ts
```

**Expected failure:** missing promise modules.

### Minimal implementation core

```ts
export function roundPredictionWindow(prediction: RawDeliveryPrediction) {
  const minBusinessDays = Math.max(1, Math.ceil(prediction.q10BusinessDays))
  const maxBusinessDays = Math.max(minBusinessDays, Math.ceil(prediction.q90BusinessDays))
  return { minBusinessDays, maxBusinessDays }
}
```

`getOptionPromise` must catch prediction-service errors and return fallback. `internalReason` is never rendered.

### PDP visual implementation

- [ ] Replace `/product/:productId` placeholder with a two-column product page using `StoreHeader`.
- [ ] Keep the purchase surface `#FBF9F8`, with product price, `Verfügbar` in `#006C48`, delivery block, quantity control, and pill-shaped `In den Warenkorb` CTA.
- [ ] Preserve the visual order visible in the screenshot: price area -> divider -> delivery line + postcode -> shipping line -> optional unchanged NOW! card -> quantity + red CTA.
- [ ] The postcode control accepts arbitrary text; supported values resolve precise/fallback fixtures and unsupported values fall back. No demo dropdown that exposes hidden scenarios.
- [ ] When postcode changes, replace the estimate silently; do not display `Lieferzeit aktualisiert`.
- [ ] On a precise promise, display calendar dates, not `1–2 days`.
- [ ] Display `Bei Bestellung bis 19:00` only when `showCutoff === true`.
- [ ] Include `ExistingNowServiceCard` only on the canonical Voltaren reference page if desired for screenshot fidelity. It is static/legacy presentation and must not call the new prediction service.
- [ ] Bundle exact current product images locally; no AI imagery.

### Component test

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ProductPage } from './ProductPage'
import { ShopProvider } from '../state/ShopContext'
import { DemoClockProvider } from '../state/DemoClockContext'

it('silently replaces fallback with a precise calendar promise after a supported postcode', async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={['/product/voltaren']}>
      <DemoClockProvider now={new Date('2026-09-10T08:00:00Z')}>
        <ShopProvider initialProductId="voltaren">
          <ProductPage />
        </ShopProvider>
      </DemoClockProvider>
    </MemoryRouter>,
  )

  expect(screen.getByText('Lieferung in 1–3 Werktagen')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /PLZ/i }))
  await user.clear(screen.getByLabelText('PLZ'))
  await user.type(screen.getByLabelText('PLZ'), '50667')
  await user.keyboard('{Enter}')

  expect(screen.getByText(/Voraussichtliche Lieferung/)).toBeInTheDocument()
  expect(screen.queryByText(/aktualisiert/i)).not.toBeInTheDocument()
})
```

Run:

```bash
npm run test:run -- src/domain/promise src/pages/ProductPage.test.tsx
npm run check:design
npm run lint
npm run build
```

### Commit

```bash
git add src public/assets/products
 git commit -m "feat: add promise engine and postcode-aware PDP"
```

---

## Task 5: Implement fulfilment planning, basket promise aggregation, and material split UI

**Deliverable:** A Shop Apotheke-like basket that shows a single order envelope for non-material splits and compact shipment blocks only when the split is materially useful.

**Create:**
- `src/domain/fulfilment/types.ts`
- `src/domain/fulfilment/shipmentPlanner.ts`
- `src/domain/fulfilment/shipmentPlanner.test.ts`
- `src/domain/promise/shipmentPromise.ts`
- `src/domain/promise/basketPromise.ts`
- `src/domain/promise/basketPromise.test.ts`
- `src/components/basket/BasketItem.tsx`
- `src/components/basket/BasketDeliverySummary.tsx`
- `src/components/basket/BasketShipmentSummary.tsx`
- `src/components/basket/ProductSuggestionCard.tsx`
- `src/pages/BasketPage.tsx`
- `src/pages/BasketPage.test.tsx`
- `src/styles/basket.css`

### Interfaces

```ts
export type PlannedShipment = {
  id: string
  fulfilmentGroup: 'sevenum-demo' | 'external-demo'
  productIds: string[]
}

export function planShipments(productIds: string[]): PlannedShipment[]

export function getShipmentPreCarrierPromise(input: {
  shipment: PlannedShipment
  postcode: string | null
  now: Date
}): CustomerPromise

export function isMaterialSplit(input: {
  shipmentPromises: CustomerPromise[]
  postcode: string
}): boolean

export type BasketDeliveryViewModel =
  | { mode: 'single-summary'; overallPromise: CustomerPromise }
  | { mode: 'material-split'; shipments: Array<{ shipment: PlannedShipment; promise: CustomerPromise }> }
```

### Shipment promise rule

For products consolidated into one shipment, use the slowest-item constraint per carrier/service:

- shipment minimum business days = maximum of item minimum business days;
- shipment maximum business days = maximum of item maximum business days;
- if any item in that shipment falls back for a carrier, that carrier-level shipment result is fallback;
- pre-carrier shipment promise then envelopes DHL/Hermes home results exactly as PDP does.

### Material split rule

A split is shown when either:

1. the later shipment's latest date is at least one eligible delivery day after the earlier shipment's latest date; or
2. the earlier shipment has `showCutoff === true` and crossing the cutoff changes that shipment promise.

### Failing test first

`src/domain/promise/basketPromise.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getBasketDeliveryViewModel } from './basketPromise'

const now = new Date('2026-09-10T08:00:00Z')

describe('basket promise', () => {
  it('shows a material split for a Sevenum + external basket', () => {
    const result = getBasketDeliveryViewModel({
      productIds: ['voltaren', 'vitamin-d3', 'vagisan'],
      postcode: '22083',
      now,
    })

    expect(result.mode).toBe('material-split')
  })

  it('keeps a single summary when the split is not materially different', () => {
    const result = getBasketDeliveryViewModel({
      productIds: ['voltaren', 'ibu'],
      postcode: '22083',
      now,
    })

    expect(result.mode).toBe('single-summary')
  })
})
```

Run:

```bash
npm run test:run -- src/domain/promise/basketPromise.test.ts
```

**Expected failure:** missing basket promise module.

### Minimal implementation pattern

```ts
export function planShipments(productIds: string[]): PlannedShipment[] {
  const sevenum = productIds.filter((id) => id !== 'vagisan')
  const external = productIds.filter((id) => id === 'vagisan')
  const shipments: PlannedShipment[] = []
  if (sevenum.length) shipments.push({ id: 'shipment-sevenum', fulfilmentGroup: 'sevenum-demo', productIds: sevenum })
  if (external.length) shipments.push({ id: 'shipment-external', fulfilmentGroup: 'external-demo', productIds: external })
  return shipments
}
```

### Basket UI requirements

- [ ] Match the screenshot's retail header and centered ~980px basket content.
- [ ] Keep the existing-style heading `Ihr Warenkorb (n)`.
- [ ] Recreate `Versand durch Shop Apotheke` as a `#FFECE6` panel with the free-shipping progress treatment.
- [ ] Preserve product rows with image, name, PZN/pack info, availability in green, quantity control, delete icon, and red price.
- [ ] Place the delivery summary inside the Shop Apotheke shipment/order area, not as an unrelated banner above the page.
- [ ] For `single-summary`, show only one promise line.
- [ ] For `material-split`, show `Ihre Bestellung kommt in 2 Lieferungen`; each shipment gets small thumbnails, product names, calendar window, and cutoff only when meaningful.
- [ ] Do not repeat product price or quantity inside the material-split summary.
- [ ] Use the existing screenshot pattern `Gratis Versand? Einfach Warenkorb füllen` with 3–4 recommendation cards and red `+` buttons. Use it as the natural mechanism for reviewers to add the remaining demo products rather than creating a special demo selector.
- [ ] Add normal remove/quantity interactions so reviewers can create single and mixed baskets without controls outside the customer experience.

### UI test

```tsx
it('shows product names inside a material basket split but no fulfilment names', () => {
  renderBasket({ productIds: ['voltaren', 'vitamin-d3', 'vagisan'], postcode: '22083' })
  expect(screen.getByText('Ihre Bestellung kommt in 2 Lieferungen')).toBeInTheDocument()
  expect(screen.getByText(/Voltaren/)).toBeInTheDocument()
  expect(screen.getByText(/Vagisan/)).toBeInTheDocument()
  expect(screen.queryByText(/Sevenum/i)).not.toBeInTheDocument()
  expect(screen.queryByText(/external/i)).not.toBeInTheDocument()
})
```

Run:

```bash
npm run test:run -- src/domain/fulfilment src/domain/promise/basketPromise.test.ts src/pages/BasketPage.test.tsx
npm run check:design
npm run lint
npm run build
```

### Commit

```bash
git add src/domain/fulfilment src/domain/promise src/components/basket src/pages/BasketPage.tsx src/pages/BasketPage.test.tsx src/styles/basket.css
 git commit -m "feat: add material split basket experience"
```

---

## Task 6: Build checkout address/pickup step and existing-style pickup station modal

**Deliverable:** Checkout starts with Shop Apotheke's existing first-level decision: home address vs pickup, with a reusable station picker and no carrier flattening.

**Create:**
- `src/state/CheckoutContext.tsx`
- `src/data/demoAddresses.ts`
- `src/data/pickupLocations.ts`
- `src/components/checkout/DeliveryMethodSelector.tsx`
- `src/components/checkout/PickupStationModal.tsx`
- `src/components/checkout/PickupStationModal.test.tsx`
- `src/pages/CheckoutAddressPage.tsx`
- `src/pages/CheckoutAddressPage.test.tsx`
- `src/styles/checkout.css`

### State interface

```ts
export type Destination =
  | { method: 'home'; addressId: string }
  | { method: 'pickup'; pickupLocationId: string }

export type CheckoutState = {
  orderDestination: Destination
  shipmentDestinations: Record<string, Destination>
}

export type CheckoutAction =
  | { type: 'SET_ORDER_DESTINATION'; destination: Destination }
  | { type: 'INITIALIZE_SHIPMENT_DESTINATIONS'; shipmentIds: string[] }
  | { type: 'SET_SHIPMENT_DESTINATION'; shipmentId: string; destination: Destination }
```

When `INITIALIZE_SHIPMENT_DESTINATIONS` runs, every shipment copies `orderDestination`.

### Demo data

Use generic public-safe customer data, not the user's screenshot address:

```text
Max Mustermann
Musterstraße 11
[active postcode] [active city]
Deutschland
```

Create three pickup locations per supported postcode:

- one Hermes PaketShop;
- one DHL Paketshop/Filiale;
- one DHL Packstation.

Use fictional names/addresses such as `Hermes PaketShop Zentrum`, `DHL Postfiliale 101`, `DHL Packstation 201`; do not claim the demo list represents live station inventory.

### Failing test first

`src/pages/CheckoutAddressPage.test.tsx`:

```tsx
it('keeps home and pickup as the first-level decision', async () => {
  const user = userEvent.setup()
  renderCheckoutAddress({ postcode: '22083' })

  expect(screen.getByText('An eine Lieferadresse')).toBeInTheDocument()
  expect(screen.getByText('An einen Abholort')).toBeInTheDocument()
  expect(screen.queryByText('Standard mit DHL')).not.toBeInTheDocument()

  await user.click(screen.getByLabelText('An einen Abholort'))
  expect(screen.getByRole('button', { name: 'Wählen Sie einen Abholort' })).toBeInTheDocument()
})
```

Run:

```bash
npm run test:run -- src/pages/CheckoutAddressPage.test.tsx
```

**Expected failure:** address page/helper missing.

### UI implementation requirements

- [ ] Use `CheckoutHeader activeStep="address"`.
- [ ] Match the screenshot: page title `Wohin sollen wir Ihre Bestellung liefern?`, left address/pickup column, right `Weitere Lieferoptionen` box.
- [ ] Home card: radio, generic saved address, large red `An diese Adresse liefern` button, circular edit icon.
- [ ] Pickup card: radio + explanatory text + red `Wählen Sie einen Abholort` button.
- [ ] Pickup modal: wide white overlay, title `Abholstation finden`, close icon, long search input with red search button, filter row, station list left, static map-style panel right.
- [ ] Do not use Google Maps or Mapbox; create the visual map panel with a neutral static background/grid and provider markers. It is presentation only.
- [ ] Use the selected pickup location to set `orderDestination` and proceed to shipping.

Run:

```bash
npm run test:run -- src/components/checkout/PickupStationModal.test.tsx src/pages/CheckoutAddressPage.test.tsx
npm run check:design
npm run lint
npm run build
```

### Commit

```bash
git add src/state/CheckoutContext.tsx src/data/demoAddresses.ts src/data/pickupLocations.ts src/components/checkout src/pages/CheckoutAddressPage.tsx src/pages/CheckoutAddressPage.test.tsx src/styles/checkout.css
 git commit -m "feat: add checkout destination and pickup selection"
```

---

## Task 7: Implement carrier-specific shipping promises and split-shipment checkout

**Deliverable:** The `Versand` step shows the real hierarchy and repeats the current shipping-option pattern per shipment, with optional per-shipment destination override.

**Create:**
- `src/domain/promise/checkoutPromise.ts`
- `src/domain/promise/checkoutPromise.test.ts`
- `src/domain/checkout/deliveryOptions.ts`
- `src/domain/checkout/deliveryOptions.test.ts`
- `src/components/checkout/CarrierOption.tsx`
- `src/components/checkout/ShipmentShippingCard.tsx`
- `src/components/checkout/ShipmentShippingCard.test.tsx`
- `src/pages/CheckoutShippingPage.tsx`
- `src/pages/CheckoutShippingPage.test.tsx`

### Interfaces

```ts
export type ShippingOption = {
  id: string
  method: 'home' | 'pickup'
  provider: 'dhl' | 'hermes'
  label: string
  destinationLabel: string
  promise: CustomerPromise
}

export function getShipmentCarrierPromise(input: {
  shipment: PlannedShipment
  postcode: string
  method: DeliveryMethod
  provider: Provider
  now: Date
}): CustomerPromise

export function getDeliveryOptions(input: {
  shipment: PlannedShipment
  destination: Destination
  postcode: string
  now: Date
}): ShippingOption[]
```

### Rules

- Home destination -> return DHL home + Hermes home carrier options.
- Pickup destination -> the selected station determines provider; return that pickup provider/location option. Do not ask the customer to choose an unrelated home carrier after choosing a station.
- Each shipment uses the slowest item as its carrier-specific constraint.
- If any item in a same-parcel carrier calculation is fallback, the shipment carrier promise is fallback.
- Cutoff appears below a carrier option only when it changes that specific option's displayed promise.

### Failing domain test first

`src/domain/promise/checkoutPromise.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getShipmentCarrierPromise } from './checkoutPromise'

const now = new Date('2026-09-10T08:00:00Z')
const shipment = { id: 's1', fulfilmentGroup: 'sevenum-demo', productIds: ['vitamin-d3'] } as const

describe('checkout carrier promise', () => {
  it('can surface a small real carrier difference when raw distributions cross a rounding boundary', () => {
    const dhl = getShipmentCarrierPromise({ shipment, postcode: '22083', method: 'home', provider: 'dhl', now })
    const hermes = getShipmentCarrierPromise({ shipment, postcode: '22083', method: 'home', provider: 'hermes', now })

    expect(dhl.maxBusinessDays).toBe(2)
    expect(hermes.maxBusinessDays).toBe(3)
  })
})
```

Run:

```bash
npm run test:run -- src/domain/promise/checkoutPromise.test.ts
```

**Expected failure:** missing checkout promise module.

### Split UI failing test

```tsx
it('shows both shipments at once and changes only the targeted shipment destination', async () => {
  const user = userEvent.setup()
  renderShipping({ productIds: ['voltaren', 'vitamin-d3', 'vagisan'], postcode: '22083', initialDestination: 'home' })

  expect(screen.getByText('Lieferung 1 von 2')).toBeInTheDocument()
  expect(screen.getByText('Lieferung 2 von 2')).toBeInTheDocument()

  const changeButtons = screen.getAllByRole('button', { name: 'Lieferart ändern' })
  await user.click(changeButtons[0])
  await user.click(screen.getByLabelText('An einen Abholort'))
  await user.click(screen.getByRole('button', { name: /Hermes PaketShop Zentrum/ }))

  expect(screen.getByTestId('shipment-1-destination')).toHaveTextContent('Abholort')
  expect(screen.getByTestId('shipment-2-destination')).toHaveTextContent('Nach Hause')
})
```

### Shipping page visual requirements

- [ ] Use the screenshot title `Bitte wählen Sie eine Versandoption` for single shipment.
- [ ] Keep the current left shipping card and right totals summary proportions.
- [ ] Single shipment: show the current-looking `Lieferung nach Hause:` card, radio rows `Standard mit DHL` and `Standard mit HERMES`, green `Lieferzeitraum`, `€ 0,00`, optional `Ich wünsche keine Nachbarschaftsabgabe`, full-width red `Weiter zur Zahlungsart` button.
- [ ] Split shipment: top copy `Ihre Bestellung kommt in 2 Lieferungen` + short explanation. Render two `ShipmentShippingCard`s vertically in the same main column; keep the order totals summary at right.
- [ ] Shipment header: tiny thumbnails + `2 Artikel` / `1 Artikel`; no repeated names by default.
- [ ] Show current inherited destination + `Lieferart ändern`.
- [ ] `Lieferart ändern` expands inline inside that shipment card with the same `An eine Lieferadresse` / `An einen Abholort` hierarchy from Task 6.
- [ ] If pickup is chosen, reuse the existing `PickupStationModal`; selected station changes only this shipment.
- [ ] No new recommendation badge, no cost steering, no DPD, no generic dashboard cards.

Run:

```bash
npm run test:run -- src/domain/checkout src/domain/promise/checkoutPromise.test.ts src/components/checkout/ShipmentShippingCard.test.tsx src/pages/CheckoutShippingPage.test.tsx
npm run check:design
npm run lint
npm run build
```

### Commit

```bash
git add src/domain/checkout src/domain/promise/checkoutPromise* src/components/checkout/CarrierOption.tsx src/components/checkout/ShipmentShippingCard* src/pages/CheckoutShippingPage*
 git commit -m "feat: add carrier promises and split shipping checkout"
```

---

## Task 8: Add lightweight payment/review steps and freeze confirmed promises

**Deliverable:** The checkout can reach an order confirmation; selected shipment promises are copied into immutable confirmed-promise fields.

**Create:**
- `src/domain/order/types.ts`
- `src/domain/order/confirmOrder.ts`
- `src/domain/order/confirmOrder.test.ts`
- `src/state/OrderContext.tsx`
- `src/pages/CheckoutPaymentPage.tsx`
- `src/pages/CheckoutReviewPage.tsx`
- `src/pages/ConfirmationPage.tsx`
- `src/styles/confirmation.css`

### Interfaces

```ts
export type ConfirmedShipment = {
  id: string
  productIds: string[]
  method: 'home' | 'pickup'
  provider: 'dhl' | 'hermes'
  destinationLabel: string
  confirmedPromiseMin: string
  confirmedPromiseMax: string
  currentEtaMin: string
  currentEtaMax: string
  status: 'confirmed' | 'preparing' | 'in_transit' | 'delivered'
}

export type Order = {
  id: string
  createdAt: string
  shipments: ReadonlyArray<ConfirmedShipment>
}

export function confirmOrder(input: CheckoutReadyOrder): Order
```

### Failing test first

`src/domain/order/confirmOrder.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { confirmOrder } from './confirmOrder'

it('copies checkout promise into immutable confirmed fields and initializes ETA separately', () => {
  const order = confirmOrder({
    orderId: 'DEMO-100500',
    createdAt: '2026-09-10T10:00:00Z',
    shipments: [{
      id: 's1',
      productIds: ['voltaren'],
      method: 'home',
      provider: 'dhl',
      destinationLabel: 'Musterstraße 11, 22083 Hamburg',
      promiseMin: '2026-09-11',
      promiseMax: '2026-09-14',
    }],
  })

  expect(order.shipments[0].confirmedPromiseMax).toBe('2026-09-14')
  expect(order.shipments[0].currentEtaMax).toBe('2026-09-14')
  expect(order.shipments[0]).not.toHaveProperty('promiseMax')
})
```

Run:

```bash
npm run test:run -- src/domain/order/confirmOrder.test.ts
```

**Expected failure:** missing order confirmation module.

### Implementation requirements

- [ ] Payment page is intentionally lightweight: preserve checkout stepper and a simple selected payment method; no payment processor.
- [ ] Review page lists delivery destination, selected carrier/provider, and final promise per shipment before `Jetzt kaufen`.
- [ ] On `Jetzt kaufen`, call `confirmOrder` exactly once and route to `/confirmation/:orderId`.
- [ ] `confirmedPromiseMin/Max` are copied values, not getters that recalculate when postcode/time/state later changes.
- [ ] `currentEtaMin/Max` initialize equal to confirmed promise and may later change independently.
- [ ] Confirmation page shows one delivery promise per shipment and keeps visual language restrained.

Run:

```bash
npm run test:run -- src/domain/order
npm run check:design
npm run lint
npm run build
```

### Commit

```bash
git add src/domain/order src/state/OrderContext.tsx src/pages/CheckoutPaymentPage.tsx src/pages/CheckoutReviewPage.tsx src/pages/ConfirmationPage.tsx src/styles/confirmation.css
 git commit -m "feat: freeze delivery promises at order confirmation"
```

---

## Task 9: Implement orders/tracking states and proactive delay email preview

**Deliverable:** Prebuilt orders demonstrate on-time, delayed, split, and completed states; delayed tracking and email share exactly the same promise/ETA data.

**Create:**
- `src/data/demoOrders.ts`
- `src/domain/tracking/trackingState.ts`
- `src/domain/tracking/trackingState.test.ts`
- `src/components/tracking/OrderCard.tsx`
- `src/components/tracking/ShipmentTrackingCard.tsx`
- `src/components/tracking/TrackingTimeline.tsx`
- `src/components/tracking/DelayNotice.tsx`
- `src/pages/OrdersPage.tsx`
- `src/pages/TrackingPage.tsx`
- `src/pages/DelayEmailPreview.tsx`
- `src/pages/DelayEmailPreview.test.tsx`
- `src/styles/tracking.css`
- `src/styles/email.css`

### Interfaces

```ts
export type TrackingViewModel = {
  orderId: string
  shipments: Array<{
    id: string
    status: ConfirmedShipment['status']
    isDelayed: boolean
    confirmedPromiseMin: string
    confirmedPromiseMax: string
    currentEtaMin: string
    currentEtaMax: string
    provider: 'dhl' | 'hermes'
    destinationLabel: string
  }>
}

export function isShipmentDelayed(shipment: ConfirmedShipment): boolean
export function getTrackingViewModel(order: Order): TrackingViewModel
```

### Demo orders

Generate dates relative to the current/demo clock using the business calendar so they remain plausible:

- `100421`: on time, in transit; ETA inside promise.
- `100422`: delayed; ETA latest date one delivery day after confirmed latest date.
- `100423`: split; shipment 1 delivered, shipment 2 in transit and on time.
- `100424`: all delivered.

Do not hardcode the user's personal address. Use generic demo destinations.

### Failing test first

`src/domain/tracking/trackingState.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { isShipmentDelayed } from './trackingState'

const base = {
  id: 's1',
  productIds: ['voltaren'],
  method: 'home' as const,
  provider: 'dhl' as const,
  destinationLabel: 'Musterstraße 11, 22083 Hamburg',
  confirmedPromiseMin: '2026-09-11',
  confirmedPromiseMax: '2026-09-14',
  currentEtaMin: '2026-09-14',
  currentEtaMax: '2026-09-14',
  status: 'in_transit' as const,
}

describe('delay detection', () => {
  it('is on time while ETA remains within promise', () => {
    expect(isShipmentDelayed(base)).toBe(false)
  })

  it('is delayed when ETA moves beyond confirmed latest date', () => {
    expect(isShipmentDelayed({ ...base, currentEtaMax: '2026-09-15' })).toBe(true)
  })
})
```

Run:

```bash
npm run test:run -- src/domain/tracking/trackingState.test.ts
```

**Expected failure:** missing tracking module.

### Tracking UI requirements

- [ ] `/orders` shows four simple Shop Apotheke-like order cards. No dashboard sidebar.
- [ ] `/orders/100422` leads with `Ihre Lieferung verspätet sich`, then `Neuer Liefertermin`, then `Ursprünglich angekündigt` in secondary text.
- [ ] Keep normal parcel timeline underneath the delay message.
- [ ] `/orders/100423` shows two shipment cards with independent statuses.
- [ ] Never overwrite or hide `confirmedPromise*` in data when current ETA changes.

### Delay email test first

`src/pages/DelayEmailPreview.test.tsx`:

```tsx
it('uses the same ETA and confirmed promise as the delayed tracking state', () => {
  const order = buildDemoOrders(new Date('2026-09-10T08:00:00Z')).find((item) => item.id === '100422')!
  const tracking = getTrackingViewModel(order)
  render(<DelayEmailPreview order={order} />)

  expect(screen.getByText(formatPromiseRange(
    tracking.shipments[0].currentEtaMin,
    tracking.shipments[0].currentEtaMax,
  ))).toBeInTheDocument()
  expect(screen.getByText(/Ursprünglich angekündigt/)).toBeInTheDocument()
})
```

### Email visual requirements

- [ ] Max-width 600px centered.
- [ ] Header/brand/support surfaces use `--sa-email-peach` (`#FDD1BC`).
- [ ] Main CTA uses `--sa-red` (`#E90033`) and rounded pill treatment.
- [ ] Copy remains short: delay headline, new date, original date, no-action reassurance, `Sendung verfolgen`.
- [ ] No separate email fixture for promise dates. The page receives the same `Order` object as tracking.
- [ ] Do not reproduce the unrelated purple app promo from the registration email unless it is needed as footer decoration; it is not required for the delay message.

Run:

```bash
npm run test:run -- src/domain/tracking src/pages/DelayEmailPreview.test.tsx
npm run check:design
npm run lint
npm run build
```

### Commit

```bash
git add src/data/demoOrders.ts src/domain/tracking src/components/tracking src/pages/OrdersPage.tsx src/pages/TrackingPage.tsx src/pages/DelayEmailPreview* src/styles/tracking.css src/styles/email.css
 git commit -m "feat: add tracking and proactive delay communication"
```

---

## Task 10: Build reviewer handover, export the matrix, and lock end-to-end + visual regression

**Deliverable:** A reviewer can understand every product decision, reproduce the important scenarios, inspect the raw-vs-displayed matrix, and run a visually stable demo.

**Create:**
- `README.md`
- `scripts/exportDemoMatrix.ts`
- `scripts/exportDemoMatrix.test.ts`
- `docs/demo-prediction-matrix.csv`
- `docs/demo-prediction-matrix.md`
- `playwright.config.ts`
- `e2e/delivery-promise.spec.ts`
- `e2e/visual.spec.ts`
- Playwright screenshot baselines under `e2e/visual.spec.ts-snapshots/`

### Matrix exporter interface

```ts
export type MatrixRow = {
  product: string
  postcode: string
  city: string
  method: 'home' | 'pickup'
  provider: 'dhl' | 'hermes'
  mean: number
  q10: number
  q50: number
  q90: number
  confidence: number
  calibrationError: number
  supportN: number
  safeToExpose: boolean
  roundedWindow: string
  renderedPromise: string
}

export function buildMatrixRows(referenceNow: Date): MatrixRow[]
```

Use fixed export reference time `2026-09-10T08:00:00Z` so the committed matrix remains stable and reviewable. The interactive app may use real/current time; the handover export explicitly labels its reference timestamp.

### Failing test first

`src/scripts` is not used; keep the script at repo root as specified.

`scripts/exportDemoMatrix.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildMatrixRows } from './exportDemoMatrix'

describe('demo matrix export', () => {
  it('contains every model-eligible product/postcode/method/provider combination', () => {
    const rows = buildMatrixRows(new Date('2026-09-10T08:00:00Z'))
    expect(rows).toHaveLength(80)
    expect(rows.some((row) => row.product.includes('Vagisan'))).toBe(false)
  })

  it('exposes raw and product-policy output together', () => {
    const row = buildMatrixRows(new Date('2026-09-10T08:00:00Z'))[0]
    expect(row).toHaveProperty('q10')
    expect(row).toHaveProperty('q90')
    expect(row).toHaveProperty('safeToExpose')
    expect(row).toHaveProperty('roundedWindow')
    expect(row).toHaveProperty('renderedPromise')
  })
})
```

Run:

```bash
npm run test:run -- scripts/exportDemoMatrix.test.ts
```

**Expected failure:** missing exporter.

### README required structure

Write the handover in this exact order:

1. `# Delivery Promise Prototype`
2. `## What I changed`
3. `## Product decisions and assumptions`
4. `## Architecture`
5. `## Try these scenarios`
6. `## Prediction matrix`
7. `## What is mocked`
8. `## What I would validate in production`
9. `## Run locally`
10. `## Tests`

The `Product decisions and assumptions` table must include columns:

| Decision | Why | Alternative considered | Prototype assumption | Production validation |

Include all 20 decisions listed in the approved design, especially:

- q10/q90 prototype bounds are cross-functional production decisions;
- confidence + calibration + sample support gate precision;
- production API should eventually return `safe_to_expose`;
- carrier/service is part of model input;
- PDP envelope across home DHL/Hermes;
- unsafe carrier widens PDP through fallback;
- most raw carrier differences round to the same display;
- cutoff only when material;
- material split shown in basket;
- basket thumbnails + names vs checkout tiny thumbnails + count;
- destination inheritance + scoped override;
- no PUDO cost steering;
- NOW! intentionally left alone;
- pre-purchase changes recalculate silently;
- pre-confirmation disruption is model context;
- immutable confirmed promise;
- shared tracking/email state.

### Exact reviewer scenarios

README must list at least these:

| Scenario | Action | Expected |
|---|---|---|
| Fast precise | Voltaren + `50667` | precise calendar promise |
| Raw difference, same display | Voltaren + `22083` | DHL/Hermes raw rows differ but both round to same customer window |
| Visible carrier difference | Vitamin D3 + `22083` | DHL home resolves to 1–2 style window, Hermes home to 2–3 style window in checkout |
| Long safe | Fenistil + `10115` | longer precise promise; DHL/Hermes can visibly differ by one business-day boundary |
| Low support/conf/calibration | Vitamin D3 + `80331` | PDP fallback |
| One carrier unsafe | Ibu + `80331` | PDP fallback because Hermes home is unsafe even though DHL home is safe; selecting DHL in checkout can narrow after carrier choice |
| Unsupported fulfilment | Vagisan + any known postcode | fallback, external demo shipment |
| Single basket | Voltaren + Ibu | one shipment |
| Material split | Voltaren + Vitamin D3 + Vagisan | split surfaced when dates/cutoff meet material rule |
| Split checkout override | same basket | start home for both, change shipment 1 to pickup, shipment 2 stays home |
| On-time tracking | `/orders/100421` | no delay warning |
| Delayed tracking | `/orders/100422` | new ETA + original promise |
| Split tracking | `/orders/100423` | independent parcel states |
| Delay email | `/email-preview/100422` | same dates as delayed tracking |

### End-to-end test

`e2e/delivery-promise.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('canonical split-shipment customer journey', async ({ page }) => {
  await page.goto('/product/voltaren')
  await page.getByRole('button', { name: /PLZ/i }).click()
  await page.getByLabel('PLZ').fill('22083')
  await page.getByLabel('PLZ').press('Enter')
  await expect(page.getByText(/Voraussichtliche Lieferung/)).toBeVisible()
  await page.getByRole('button', { name: 'In den Warenkorb' }).click()

  await page.goto('/basket')
  await page.getByTestId('add-vitamin-d3').click()
  await page.getByTestId('add-vagisan').click()
  await expect(page.getByText('Ihre Bestellung kommt in 2 Lieferungen')).toBeVisible()
  await page.getByRole('button', { name: /zur kasse/i }).click()

  await page.getByRole('button', { name: 'An diese Adresse liefern' }).click()
  await expect(page).toHaveURL(/checkout\/shipping/)
  await expect(page.getByText('Lieferung 1 von 2')).toBeVisible()
  await expect(page.getByText('Lieferung 2 von 2')).toBeVisible()

  const change = page.getByRole('button', { name: 'Lieferart ändern' }).first()
  await change.click()
  await page.getByLabel('An einen Abholort').click()
  await page.getByRole('button', { name: /Abholstation finden/i }).click()
  await page.getByRole('button', { name: /Hermes PaketShop Zentrum/i }).click()
  await expect(page.getByTestId('shipment-1-destination')).toContainText('Abholort')
  await expect(page.getByTestId('shipment-2-destination')).toContainText('Nach Hause')
})
```

### Visual regression test

`playwright.config.ts` uses desktop Chromium, `viewport: { width: 1440, height: 900 }`, and Vite webServer.

`e2e/visual.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('PDP visual contract', async ({ page }) => {
  await page.goto('/product/voltaren')
  await expect(page).toHaveScreenshot('pdp.png', { fullPage: true })
})

test('basket visual contract', async ({ page }) => {
  await page.goto('/basket?fixture=material-split')
  await expect(page).toHaveScreenshot('basket-material-split.png', { fullPage: true })
})

test('checkout shipping visual contract', async ({ page }) => {
  await page.goto('/checkout/shipping?fixture=split')
  await expect(page).toHaveScreenshot('checkout-split.png', { fullPage: true })
})

test('delay email visual contract', async ({ page }) => {
  await page.goto('/email-preview/100422')
  await expect(page).toHaveScreenshot('delay-email.png', { fullPage: true })
})
```

The query-string fixture shortcuts are allowed **only for automated visual tests**. Do not expose them as a customer-facing demo-control UI or document them as the main review flow.

First run:

```bash
npx playwright install chromium
npm run e2e -- e2e/visual.spec.ts
```

**Expected failure:** missing screenshot baselines.

Before creating baselines, manually compare the implementation at 1440×900 against `docs/reference/visual-fidelity.md` and the original screenshot references. Specifically verify:

- exact Shop Apotheke token palette;
- retail vs checkout header distinction;
- basket peach shipping panel;
- checkout 565/398-ish column relationship;
- DHL/Hermes only;
- radio/button shapes;
- green `Lieferzeitraum` treatment;
- no new generic ecommerce visual system.

Only after that manual fidelity pass:

```bash
npx playwright test e2e/visual.spec.ts --update-snapshots
npm run e2e
npm run export:matrix
npm run test:run
npm run check:design
npm run lint
npm run build
```

**Expected:** all tests, design checks, E2E tests, matrix export, lint, and production build pass; four visual baselines are committed.

### Commit

```bash
git add README.md scripts docs/demo-prediction-matrix.* playwright.config.ts e2e
 git commit -m "docs: add reviewer handover and lock visual regression"
```

---

# Appendix A — Exact mock prediction fixture

Use this fixture as authored. It is fictional prototype data. Do not optimize it to look more dramatic. The purpose is to show that carrier/service is a model input while most carrier differences still round to the same customer-facing promise.

Tuple format:

`mean / q10 / q50 / q90 / confidence / calibrationError / supportN`

Service shorthand:

- **HD** = home + DHL
- **HH** = home + Hermes
- **PD** = pickup + DHL
- **PH** = pickup + Hermes

## Voltaren

| Postcode | HD | HH | PD | PH |
|---|---|---|---|---|
| 50667 | `1.10/.60/1.05/1.60/.97/.01/4200` | `1.18/.65/1.12/1.72/.96/.01/3950` | `1.08/.58/1.02/1.58/.97/.01/2800` | `1.20/.68/1.14/1.76/.95/.02/2500` |
| 60311 | `1.20/.70/1.15/1.70/.96/.01/4000` | `1.28/.75/1.23/1.82/.96/.01/3800` | `1.18/.68/1.12/1.72/.96/.02/2600` | `1.31/.78/1.25/1.88/.95/.02/2400` |
| 22083 | `1.42/.90/1.36/1.92/.95/.02/3100` | `1.50/.95/1.44/1.98/.95/.02/3000` | `1.40/.88/1.35/1.94/.95/.02/2100` | `1.55/.98/1.48/1.99/.94/.02/1900` |
| 10115 | `1.88/1.12/1.82/2.58/.95/.02/2700` | `1.96/1.18/1.90/2.66/.94/.02/2600` | `1.86/1.10/1.80/2.54/.94/.02/1800` | `2.00/1.20/1.94/2.72/.93/.03/1700` |
| 80331 | `2.05/1.20/1.98/2.76/.94/.02/2500` | `2.14/1.28/2.06/2.84/.94/.02/2400` | `2.02/1.18/1.96/2.72/.94/.02/1650` | `2.18/1.30/2.10/2.88/.93/.03/1550` |

## Vitamin D3

| Postcode | HD | HH | PD | PH |
|---|---|---|---|---|
| 50667 | `1.16/.66/1.11/1.72/.96/.01/3600` | `1.24/.72/1.18/1.82/.96/.01/3450` | `1.14/.64/1.09/1.70/.96/.01/2400` | `1.28/.76/1.22/1.88/.95/.02/2250` |
| 60311 | `1.26/.76/1.20/1.82/.96/.01/3500` | `1.34/.82/1.28/1.90/.95/.02/3350` | `1.24/.74/1.18/1.80/.95/.02/2300` | `1.38/.86/1.31/1.94/.95/.02/2150` |
| 22083 | `1.62/.92/1.56/1.96/.95/.02/2800` | `1.78/1.04/1.70/2.18/.94/.02/2680` | `1.58/.90/1.52/1.98/.95/.02/1850` | `1.66/.96/1.60/1.99/.94/.02/1750` |
| 10115 | `1.94/1.18/1.88/2.62/.94/.02/2450` | `2.02/1.22/1.96/2.70/.94/.02/2320` | `1.92/1.16/1.86/2.60/.94/.02/1600` | `2.06/1.24/1.98/2.76/.93/.03/1500` |
| 80331 | `2.34/1.42/2.24/3.18/.92/.02/420` | `2.44/1.50/2.34/3.30/.88/.02/720` | `2.28/1.36/2.18/3.12/.92/.04/850` | `2.48/1.54/2.38/3.34/.89/.04/360` |

The München Vitamin D3 row deliberately exercises all gates: HD fails sample support, HH fails confidence, PD fails calibration, PH fails multiple gates.

## Fenistil

| Postcode | HD | HH | PD | PH |
|---|---|---|---|---|
| 50667 | `1.22/.72/1.16/1.80/.96/.01/3000` | `1.30/.78/1.24/1.88/.95/.02/2850` | `1.20/.70/1.14/1.78/.96/.01/2000` | `1.34/.82/1.28/1.92/.95/.02/1900` |
| 60311 | `1.32/.82/1.26/1.90/.95/.02/2900` | `1.40/.88/1.34/1.98/.95/.02/2750` | `1.30/.80/1.24/1.88/.95/.02/1900` | `1.44/.92/1.38/1.99/.94/.02/1800` |
| 22083 | `1.92/1.16/1.86/2.54/.94/.02/2300` | `2.00/1.22/1.94/2.62/.94/.02/2200` | `1.88/1.12/1.82/2.50/.94/.02/1500` | `2.04/1.24/1.98/2.68/.93/.03/1420` |
| 10115 | `2.46/1.82/2.38/2.96/.94/.02/2000` | `2.74/2.04/2.66/3.62/.94/.02/1880` | `2.42/1.78/2.34/2.92/.94/.02/1320` | `2.70/2.02/2.62/3.58/.93/.03/1240` |
| 80331 | `3.28/2.18/3.16/4.34/.93/.03/1800` | `3.40/2.26/3.28/4.48/.93/.03/1700` | `3.22/2.12/3.10/4.28/.93/.03/1180` | `3.46/2.30/3.34/4.54/.92/.03/1100` |

Fenistil Berlin is the primary visible standard-carrier-difference scenario: DHL home rounds to a 2–3-style window while Hermes home rounds to a 3–4-style window. The visible shift is one business-day boundary, not an exaggerated network difference.

## Ibu-ratiopharm

| Postcode | HD | HH | PD | PH |
|---|---|---|---|---|
| 50667 | `1.05/.58/1.00/1.52/.98/.01/5200` | `1.12/.62/1.06/1.62/.97/.01/5000` | `1.02/.56/.98/1.50/.98/.01/3400` | `1.16/.66/1.10/1.68/.97/.01/3200` |
| 60311 | `1.14/.64/1.08/1.64/.97/.01/5000` | `1.22/.70/1.16/1.74/.97/.01/4800` | `1.12/.62/1.06/1.62/.97/.01/3300` | `1.26/.74/1.20/1.80/.96/.01/3100` |
| 22083 | `1.38/.86/1.32/1.88/.96/.01/4100` | `1.46/.92/1.40/1.96/.96/.01/3950` | `1.36/.84/1.30/1.86/.96/.02/2750` | `1.50/.96/1.44/1.99/.95/.02/2600` |
| 10115 | `1.84/1.10/1.78/2.48/.95/.02/3500` | `1.92/1.16/1.86/2.56/.95/.02/3350` | `1.82/1.08/1.76/2.46/.95/.02/2300` | `1.96/1.18/1.90/2.62/.94/.02/2200` |
| 80331 | `2.02/1.20/1.96/2.68/.94/.02/3000` | `2.10/1.26/2.04/2.76/.89/.02/2850` | `2.00/1.18/1.94/2.66/.94/.02/2000` | `2.14/1.28/2.08/2.80/.94/.02/1880` |

Ibu München deliberately demonstrates the PDP-envelope rule: DHL home is safe, Hermes home fails confidence, therefore PDP uses fallback rather than advertising the precise DHL result before carrier selection.

## Vagisan

No standard-model rows. Treat as `modelEligible: false` and fictional `external-demo` fulfilment. It always uses fallback in the standard prediction path and creates a separate shipment when mixed with Sevenum demo products.

---

# Appendix B — Required component/layout hierarchy

Implementation agents must preserve this component hierarchy unless a testability issue requires a small refactor. Do not replace it with a generic component library.

```text
App
├─ StoreHeader
│  ├─ ShopApothekeWordmark
│  ├─ Search
│  ├─ Account / E-Rezept / Warenkorb icons
│  └─ Peach category nav
├─ ProductPage
│  └─ ProductPurchaseCard
│     ├─ DeliveryEstimate
│     ├─ PostcodeControl
│     ├─ optional ExistingNowServiceCard
│     └─ Quantity + In den Warenkorb
├─ BasketPage
│  ├─ Versand durch Shop Apotheke panel
│  ├─ BasketItem rows
│  ├─ BasketDeliverySummary OR BasketShipmentSummary[]
│  └─ ProductSuggestionCard row
├─ CheckoutHeader
│  └─ Adresse / Versand / Zahlung / Prüfen stepper
├─ CheckoutAddressPage
│  ├─ Home address block
│  ├─ Pickup block
│  ├─ PickupStationModal
│  └─ Weitere Lieferoptionen card
├─ CheckoutShippingPage
│  ├─ ShipmentShippingCard[]
│  │  ├─ tiny thumbnails + item count
│  │  ├─ inherited destination
│  │  ├─ Lieferart ändern inline controls
│  │  └─ CarrierOption[] or selected pickup station option
│  └─ totals summary
├─ CheckoutPaymentPage
├─ CheckoutReviewPage
├─ ConfirmationPage
├─ OrdersPage
├─ TrackingPage
│  ├─ ShipmentTrackingCard[]
│  ├─ optional DelayNotice
│  └─ TrackingTimeline
└─ DelayEmailPreview
```

---

# Final verification gate

Before calling the implementation complete, run exactly:

```bash
npm run test:run
npm run check:design
npm run lint
npm run build
npm run export:matrix
npm run e2e
```

Then manually verify the 1440×900 desktop experience against `docs/reference/visual-fidelity.md` and the approved design. Do not accept a green test suite if the UI has drifted into a generic ecommerce/dashboard style.

The final git history should have focused commits in the task order above. If an implementation agent needs to deviate from a product rule or visual constraint, stop implementation and update the approved design first rather than silently changing the behavior.
