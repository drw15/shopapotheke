# Delivery Promise Post-Purchase & Handover Implementation Plan

**Goal:** Complete checkout confirmation, preserve immutable promises, demonstrate on-time/delayed/split tracking, render the proactive delay email from the same order state, and package the prototype for reviewer handover.

**Architecture:** Confirmation copies the selected shipment promises into immutable confirmed-promise fields. Tracking updates only current ETA/status. The email preview consumes the exact same order/shipment object as tracking. Reviewer documentation exposes the product decisions, mock matrix, and reproducible scenarios.

**Tech stack:** React, TypeScript, Vitest, Testing Library, Playwright, plain CSS using the locked Shop Apotheke tokens.

## Mandatory context before coding

Read in this order:

1. `docs/PRD.md`
2. `docs/IMPLEMENTATION_HANDOFF.md`
3. `docs/superpowers/specs/2026-09-10-delivery-promise-design.md`
4. `docs/reference/shop-apotheke-reference-screenshots/`
5. `docs/superpowers/plans/2026-09-10-delivery-promise-implementation-index.md`
6. this plan
7. `AGENTS.md`

Before implementing confirmation/tracking/email screens, inspect the relevant Shop Apotheke reference screenshots. The email screenshot is authoritative for email proportions, branding, spacing, CTA, peach surfaces, and support/footer treatment.

## Global Constraints

- Confirmed promise is immutable after order confirmation.
- Current ETA is independent and may change.
- A shipment is delayed only when current latest ETA exceeds confirmed latest promise.
- Tracking and delay email use the same source of truth.
- Use generic demo customer data, not screenshot personal data.
- Delay UX must look like Shop Apotheke, not a SaaS notification system.
- Delay email uses existing Shop Apotheke email visual language: white/warm background, peach brand/support surfaces, red CTA, restrained copy.
- No new model/fulfilment terminology is customer-facing.
- Do not silently alter the established pre-purchase product decisions while building post-purchase flows.

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

Expected failure: order modules missing.

**Minimal implementation:** create immutable confirmed-promise fields and initialize current ETA separately from the selected checkout promise. Payment/review pages may be visually lightweight but must preserve the checkout stepper and lead coherently to confirmation.

Run:

```bash
npm run test:run -- src/domain/order/confirmOrder.test.ts
npm run build
```

Expected: pass.

**Commit:** `git commit -m "feat: freeze confirmed delivery promises"`

## Task 2: Add deterministic demo orders and tracking-domain logic

**Create:**
- `src/data/demoOrders.ts`
- `src/domain/tracking/trackingState.ts`
- `src/domain/tracking/trackingState.test.ts`

Required orders:

- `#100421` on time;
- `#100422` delayed;
- `#100423` split with shipment 1 delivered and shipment 2 in transit;
- `#100424` completed.

Dates should be generated from a deterministic demo clock/current reference so they do not become obviously stale.

**Interfaces:**

```ts
export type ShipmentTrackingState = {
  isDelayed:boolean
  headline?:string
  currentEtaText:string
  originalPromiseText?:string
}

export function getShipmentTrackingState(shipment: ConfirmedShipment): ShipmentTrackingState
```

**Required tests:**
- ETA inside promise -> not delayed;
- ETA equal to promise max -> not delayed;
- ETA after promise max -> delayed;
- delayed state exposes both new ETA and original promise;
- split shipments are evaluated independently;
- delivered shipment stays delivered if another shipment is late.

Run failing test first, then minimal implementation, then pass.

**Commit:** `git commit -m "feat: add tracking promise breach state"`

## Task 3: Build orders and tracking UI

**Create:**
- `src/pages/OrdersPage.tsx`
- `src/pages/TrackingPage.tsx`
- `src/components/tracking/OrderCard.tsx`
- `src/components/tracking/ShipmentTrackingCard.tsx`
- `src/components/tracking/TrackingTimeline.tsx`
- `src/pages/TrackingPage.test.tsx`
- `src/styles/tracking.css`

**Behavioral requirements:**
- `/orders` exposes all four deterministic demo orders;
- delayed shipment leads with `Ihre Lieferung verspätet sich`;
- show `Neuer Liefertermin` prominently;
- show `Ursprünglich angekündigt` as secondary context;
- do not overwrite/hide the original confirmed promise;
- split order shows separate shipment cards/statuses;
- normal on-time order does not get an exception banner.

**Visual requirement:** use Shop Apotheke typography/card language from references. Do not create a modern tracking dashboard, bright status chips, or new information-card system.

Run:

```bash
npm run test:run -- src/pages/TrackingPage.test.tsx
npm run check:design
npm run build
```

Expected: pass.

Capture 1440x900 screenshots for on-time, delayed and split tracking. Confirm they feel consistent with the supplied Shop Apotheke visual language.

**Commit:** `git commit -m "feat: add honest delivery tracking states"`

## Task 4: Build proactive delay email from shared state

**Create:**
- `src/domain/notifications/delayEmail.ts`
- `src/domain/notifications/delayEmail.test.ts`
- `src/pages/DelayEmailPreviewPage.tsx`
- `src/pages/DelayEmailPreviewPage.test.tsx`
- `src/styles/email.css`

**Interface:**

```ts
export type DelayEmailView = {
  subject:string
  greeting:string
  newEtaText:string
  originalPromiseText:string
  trackingHref:string
}

export function buildDelayEmail(order: Order): DelayEmailView | null
```

**Required test:** for order `100422`, `newEtaText` and `originalPromiseText` must exactly match the values exposed by tracking-domain state. A non-delayed order returns null/not eligible.

**Visual authority:** inspect the supplied email reference before coding. Match the narrow centered email proportion, Shop Apotheke header/branding, peach support/brand surfaces, red CTA, and restrained typography. Do not create a generic marketing email template.

Suggested customer copy:

> **Ihre Lieferung verspätet sich**
>
> Guten Tag [generic demo customer],
>
> leider kommt Ihre Lieferung später als ursprünglich erwartet.
>
> **Neuer Liefertermin**  
> [new ETA]
>
> Ursprünglich angekündigt: [confirmed promise]
>
> Sie müssen nichts tun. Wir halten Sie über den weiteren Verlauf Ihrer Lieferung auf dem Laufenden.

CTA: `Sendung verfolgen`.

Run:

```bash
npm run test:run -- src/domain/notifications/delayEmail.test.ts src/pages/DelayEmailPreviewPage.test.tsx
npm run check:design
npm run build
```

Expected: pass.

Capture email screenshot and compare to the email reference.

**Commit:** `git commit -m "feat: add proactive delay email preview"`

## Task 5: Build reviewer handover README and prediction matrix

**Create/modify:**
- `README.md`
- `docs/demo/prediction-matrix.md`
- `docs/demo/scenarios.md`
- optional generated `docs/demo/prediction-matrix.csv`

README is a product deliverable, not only setup documentation.

It must include:

1. what the prototype demonstrates;
2. local run/build/test instructions;
3. visual-reference path: `docs/reference/shop-apotheke-reference-screenshots/`;
4. architecture summary;
5. full `Product decisions and assumptions` section;
6. a direct statement that q10/q90, exposure thresholds, fulfilment assignment, carrier values, cutoff, and per-shipment override are prototype assumptions;
7. production note that Product + Data + Last Mile/Operations should jointly agree quantiles/exposure policy and the API should then return `safe_to_expose`;
8. explicit note that NOW! is left unchanged/out of the prediction model because its production behavior is insufficiently known;
9. exact `Try these scenarios` table;
10. link to the full prediction matrix;
11. tracking demo order IDs;
12. email preview route;
13. known limitations/non-goals.

`prediction-matrix.md` must show for each relevant demo combination:

- product;
- postcode;
- method;
- provider;
- mean;
- q10;
- q50;
- q90;
- confidence;
- calibration error;
- support N;
- safe-to-expose decision;
- rounded window;
- rendered customer-facing outcome.

The matrix is intentionally reviewer-visible so they can inspect the product transformation from model output to displayed promise.

`scenarios.md` must specify exact combinations for:

- fast safe prediction;
- slower safe prediction;
- DHL/Hermes raw difference that rounds to same window;
- one visible carrier difference;
- low-confidence/support fallback;
- external-model fallback;
- non-material split;
- material Friday-vs-Monday split;
- split checkout and per-shipment pickup override;
- on-time/delayed/split tracking;
- delay email.

**Commit:** `git commit -m "docs: add reviewer delivery promise handover"`

## Task 6: Add final E2E and visual-regression gate

**Create:**
- `playwright.config.ts`
- `e2e/delivery-journey.spec.ts`
- `e2e/postpurchase.spec.ts`
- `e2e/visual-fidelity.spec.ts`

Required end-to-end flows:

1. PDP generic -> supported postcode -> precise window;
2. documented unsafe scenario -> fallback;
3. mixed basket -> material split shown;
4. checkout home -> DHL/Hermes options;
5. split checkout -> both blocks visible -> shipment 1 changed to pickup -> shipment 2 unchanged;
6. confirmation -> confirmed promise visible;
7. delayed order -> new ETA + original promise;
8. delay email -> same dates as tracking.

Visual screenshots at 1440x900 must include at least:

- PDP generic;
- PDP precise;
- basket material split;
- checkout home/address;
- checkout pickup modal;
- checkout single Versand;
- checkout split Versand;
- tracking delayed;
- delay email.

Before accepting visual baselines, manually compare the applicable screenshot to `docs/reference/shop-apotheke-reference-screenshots/`. Do not blindly update snapshots to make a failing visual test green.

Final commands:

```bash
npm run test:run
npm run check:design
npm run build
npx playwright test
```

Expected: all green.

**Commit:** `git commit -m "test: lock delivery promise demo journey"`

## Final handoff checklist

- [ ] All PRD/design product decisions preserved.
- [ ] All relevant reference screenshots inspected during UI work.
- [ ] No DPD or invented carriers.
- [ ] No generic ecommerce redesign.
- [ ] No raw model metadata exposed.
- [ ] Reviewer matrix demonstrates raw -> policy -> customer transformation.
- [ ] Basket material split and cutoff behavior work.
- [ ] Home-vs-pickup hierarchy matches current Shop Apotheke.
- [ ] Split shipment destination inheritance/override works.
- [ ] Confirmed promise remains immutable.
- [ ] Tracking and email show the same promise/ETA state.
- [ ] Final README explains every important product decision and prototype assumption.
- [ ] 15-minute walkthrough can be performed without hidden demo controls.