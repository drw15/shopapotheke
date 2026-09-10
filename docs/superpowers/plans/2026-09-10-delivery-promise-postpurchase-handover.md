# Delivery Promise Post-Purchase & Handover Implementation Plan

**Goal:** Complete checkout confirmation, preserve immutable promises, demonstrate on-time/delayed/split tracking, render the proactive delay email from the same order state, and package the prototype for reviewer handover.

**Architecture:** Confirmation copies the selected shipment promises into immutable confirmed-promise fields. Tracking updates only current ETA/status. The email preview consumes the exact same order/shipment object as tracking. Reviewer documentation exposes the product decisions, mock matrix, and reproducible scenarios.

**Tech stack:** React, TypeScript, Vitest, Testing Library, Playwright, plain CSS using the locked Shop Apotheke tokens.

## Global Constraints

- Read the approved design and implementation index first.
- Confirmed promise is immutable after order confirmation.
- Current ETA is independent and may change.
- A shipment is delayed only when current latest ETA exceeds confirmed latest promise.
- Tracking and delay email use the same source of truth.
- Use generic demo customer data, not screenshot personal data.
- Delay UX must look like Shop Apotheke, not a SaaS notification system.
- Delay email uses existing Shop Apotheke email visual language: white/warm background, peach brand/support surfaces, red CTA, restrained copy.
- No new model/fulfilment terminology is customer-facing.

## Task 1: Add lightweight payment/review and immutable order confirmation

**Create:**
- `src/domain/order/types.ts`
- `src/domain/order/confirmOrder.ts`
- `src/domain/order/confirmOrder.test.ts`
- `src/state/OrderContext.tsx`
- `src/pages/CheckoutPaymentPage.tsx`
- `src/pages/CheckoutReviewPage.tsx`
- `src/pages/ConfirmationPage.tsx`
- `src/styles/confirmation.css`

**Interfaces:**

```ts
export type ConfirmedShipment = {
  id:string
  productIds:string[]
  method:'home'|'pickup'
  provider:'dhl'|'hermes'
  destinationLabel:string
  confirmedPromiseMin:string
  confirmedPromiseMax:string
  currentEtaMin:string
  currentEtaMax:string
  status:'confirmed'|'preparing'|'in_transit'|'delivered'
}

export type Order = {
  id:string
  createdAt:string
  shipments:ReadonlyArray<ConfirmedShipment>
}

export function confirmOrder(input: CheckoutReadyOrder): Order
```

**Failing test first:**

```ts
import { expect, it } from 'vitest'
import { confirmOrder } from './confirmOrder'

it('freezes checkout promise and initializes ETA separately', () => {
  const order = confirmOrder({
    orderId:'100500',
    createdAt:'2026-09-10T10:00:00Z',
    shipments:[{
      id:'s1', productIds:['voltaren'], method:'home', provider:'dhl',
      destinationLabel:'Musterstraße 11, 22083 Hamburg',
      promiseMin:'2026-09-11', promiseMax:'2026-09-14'
    }]
  })
  expect(order.shipments[0].confirmedPromiseMax).toBe('2026-09-14')
  expect(order.shipments[0].currentEtaMax).toBe('2026-09-14')
})
```

Run `npm run test:run -- src/domain/order/confirmOrder.test.ts`.

Expected failure: missing order module.

**Minimal implementation:** copy `promiseMin/Max` into `confirmedPromiseMin/Max`; initialize current ETA equal to those values; do not retain mutable `promiseMin/Max` fields.

**UI:**
- Payment/review are intentionally lightweight.
- Preserve checkout stepper.
- Review page shows destination, provider, and final delivery promise per shipment.
- `Jetzt kaufen` creates order exactly once.
- Confirmation shows one promise per shipment.

Run tests, design check, build.

**Commit:** `git commit -m "feat: freeze promises at confirmation"`

## Task 2: Add deterministic demo orders and tracking state

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
- `src/styles/tracking.css`

**Interfaces:**

```ts
export function isShipmentDelayed(shipment: ConfirmedShipment): boolean
export function getTrackingViewModel(order: Order): TrackingViewModel
export function buildDemoOrders(referenceNow: Date): Order[]
```

**Required demo orders:**
- `100421`: on time, in transit;
- `100422`: delayed by one delivery day beyond promise;
- `100423`: split, shipment 1 delivered, shipment 2 in transit;
- `100424`: complete/delivered.

Use business-calendar helpers so dates remain plausible.

**Failing test first:**

```ts
it('detects delay without mutating the original promise', () => {
  const shipment = {
    id:'s1', productIds:['voltaren'], method:'home', provider:'dhl',
    destinationLabel:'Musterstraße 11, 22083 Hamburg',
    confirmedPromiseMin:'2026-09-11', confirmedPromiseMax:'2026-09-14',
    currentEtaMin:'2026-09-15', currentEtaMax:'2026-09-15', status:'in_transit'
  } as const
  expect(isShipmentDelayed(shipment)).toBe(true)
  expect(shipment.confirmedPromiseMax).toBe('2026-09-14')
})
```

Expected failure: missing tracking module.

**Visual implementation:**
- `/orders` is a simple Shop Apotheke-like list, not a dashboard.
- Delayed page leads with `Ihre Lieferung verspätet sich`.
- Show `Neuer Liefertermin` prominently.
- Show `Ursprünglich angekündigt` secondarily.
- Keep normal parcel timeline below.
- Split tracking shows independent shipment cards and statuses.

Run tests, design check, build.

**Commit:** `git commit -m "feat: add order tracking and delay state"`

## Task 3: Add proactive delay email preview from the same order data

**Create:**
- `src/pages/DelayEmailPreview.tsx`
- `src/pages/DelayEmailPreview.test.tsx`
- `src/styles/email.css`

**Failing test first:**

```tsx
it('renders the same new ETA and original promise as tracking', () => {
  const order = buildDemoOrders(new Date('2026-09-10T08:00:00Z')).find(o => o.id === '100422')!
  const tracking = getTrackingViewModel(order)
  render(<DelayEmailPreview order={order} />)
  expect(screen.getByText(formatPromiseRange(tracking.shipments[0].currentEtaMin, tracking.shipments[0].currentEtaMax))).toBeInTheDocument()
  expect(screen.getByText(/Ursprünglich angekündigt/)).toBeInTheDocument()
})
```

Expected failure: missing email page.

**Visual implementation:**
- Max-width 600px centered.
- Main body white / `--sa-surface`.
- Branded/support panels use `--sa-email-peach` (`#FDD1BC`).
- CTA is `--sa-red`, pill-shaped.
- Copy:
  - `Ihre Lieferung verspätet sich`
  - greeting
  - short apology
  - `Neuer Liefertermin`
  - original promised date
  - no-action reassurance
  - `Sendung verfolgen`
- Do not recreate unrelated registration-email content.
- No duplicate hard-coded promise/ETA dates.

Run tests, design check, build.

**Commit:** `git commit -m "feat: add proactive delay email preview"`

## Task 4: Export the prediction matrix and write reviewer handover

**Create:**
- `README.md`
- `scripts/exportDemoMatrix.ts`
- `scripts/exportDemoMatrix.test.ts`
- `docs/demo-prediction-matrix.csv`
- `docs/demo-prediction-matrix.md`

**Interface:**

```ts
export type MatrixRow = {
  product:string
  postcode:string
  city:string
  method:'home'|'pickup'
  provider:'dhl'|'hermes'
  mean:number
  q10:number
  q50:number
  q90:number
  confidence:number
  calibrationError:number
  supportN:number
  safeToExpose:boolean
  roundedWindow:string
  renderedPromise:string
}

export function buildMatrixRows(referenceNow: Date): MatrixRow[]
```

Use fixed handover reference time `2026-09-10T08:00:00Z` so committed outputs do not change every run.

**Failing test first:**

```ts
it('exports all 80 model-eligible combinations with raw and displayed output', () => {
  const rows = buildMatrixRows(new Date('2026-09-10T08:00:00Z'))
  expect(rows).toHaveLength(80)
  expect(rows[0]).toMatchObject({ safeToExpose: expect.any(Boolean), roundedWindow: expect.any(String), renderedPromise: expect.any(String) })
})
```

Expected failure: missing exporter.

**README sections, exact order:**
1. `What I changed`
2. `Product decisions and assumptions`
3. `Architecture`
4. `Try these scenarios`
5. `Prediction matrix`
6. `What is mocked`
7. `What I would validate in production`
8. `Run locally`
9. `Tests`

The Product Decisions table uses columns:

| Decision | Why | Alternative considered | Prototype assumption | Production validation |

It must cover all approved decisions: q10/q90 bounds, cross-functional quantile choice, confidence/calibration/sample gating, future `safe_to_expose`, carrier as model input, PDP carrier envelope, fallback carrier widening, rounding behavior, deterministic cutoff, material split rule, basket vs checkout product detail, destination inheritance, per-shipment override assumption, home-vs-pickup hierarchy, no PUDO steering, NOW! out of scope, silent pre-purchase recalculation, pre-confirmation disruption as model context, immutable promise, shared tracking/email state.

**Exact scenarios to document:**
- Voltaren + `50667`: fast precise.
- Voltaren + `22083`: raw DHL/Hermes difference that rounds to same customer window.
- Vitamin D3 + `22083`: visible modest carrier difference in checkout.
- Fenistil + `10115`: longer safe prediction / visible boundary difference.
- Vitamin D3 + `80331`: fallback due gate failures.
- Ibu + `80331`: one carrier safe, one unsafe -> PDP fallback; chosen DHL can narrow later.
- Vagisan + known postcode: unsupported standard model / external demo shipment.
- Voltaren + Ibu: single shipment.
- Voltaren + Vitamin D3 + Vagisan: material split.
- same split basket: change shipment 1 to pickup; shipment 2 remains home.
- `/orders/100421`, `/orders/100422`, `/orders/100423`, `/email-preview/100422`.

Run matrix tests/export.

**Commit:** `git commit -m "docs: add reviewer handover and prediction matrix"`

## Task 5: Add E2E and visual-regression gates

**Create:**
- `playwright.config.ts`
- `e2e/delivery-promise.spec.ts`
- `e2e/visual.spec.ts`
- screenshot baselines under Playwright snapshot directory

`playwright.config.ts` uses desktop Chromium with 1440x900 viewport and Vite webServer.

**Failing E2E first:** write a canonical split-order flow that:
1. opens Voltaren PDP;
2. enters `22083`;
3. adds to basket;
4. adds Vitamin D3 and Vagisan through normal basket UI;
5. sees material split;
6. enters checkout with home delivery;
7. sees both shipment cards;
8. changes only shipment 1 to pickup;
9. verifies shipment 2 stays home.

First run should fail before final selectors/pages are complete.

**Visual regression cases:**
- PDP;
- material-split basket;
- split shipping checkout;
- delayed tracking page;
- delay email.

Before creating baselines, manually compare each at 1440x900 against the provided reference screenshots and `docs/reference/visual-fidelity.md`. Check exact palette, retail-vs-checkout header distinction, basket peach panel, checkout proportions, DHL/Hermes only, radio/button shapes, green delivery text, and absence of generic ecommerce visual drift.

Then create baselines with:

```bash
npx playwright test e2e/visual.spec.ts --update-snapshots
```

Run final gate:

```bash
npm run test:run
npm run check:design
npm run lint
npm run build
npm run export:matrix
npm run e2e
```

Expected: all pass.

**Commit:** `git commit -m "test: lock delivery promise demo and visual fidelity"`

## Final handover gate

Do not call the implementation complete until:
- domain tests are green;
- E2E customer flows are green;
- visual regression is reviewed against screenshots before baselines are accepted;
- README contains all product decisions/assumptions;
- matrix export exposes raw + rounded + displayed output;
- no customer UI contains raw model terms, DPD, recommendation badges, cost-steering copy, or hidden demo controls.
