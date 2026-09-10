# Delivery Promise Core Domain Implementation Plan

**Goal:** Implement deterministic prediction fixtures, exposure gating, business-day/cutoff logic, promise construction, and fulfilment planning behind stable interfaces.

**Architecture:** The UI will depend on customer-ready promise services only. Raw model fixtures, exposure policy, calendar rules, and shipment planning live in separate modules and are independently testable.

**Tech stack:** TypeScript, Vitest, date-fns, date-fns-tz, date-holidays.

## Mandatory context before coding

Read in this order:

1. `docs/PRD.md`
2. `docs/IMPLEMENTATION_HANDOFF.md`
3. `docs/superpowers/specs/2026-09-10-delivery-promise-design.md`
4. `docs/superpowers/plans/2026-09-10-delivery-promise-implementation-index.md`
5. this plan
6. `AGENTS.md`

The reference screenshots are primarily a UI concern, but the core-domain implementation must understand that its outputs are consumed by a high-fidelity Shop Apotheke experience and therefore must expose customer-ready dates/copy states rather than raw model terms.

## Global Constraints

- Raw model values are not UI data.
- Standard carriers are DHL and Hermes only.
- q10/q90 are prototype bounds; production quantiles are a Product + Data + Last Mile decision.
- Precise exposure requires confidence >= 0.90, calibration error <= 0.03, and support >= 500.
- Fallback is `Lieferung in 1–3 Werktagen`.
- Customer delivery calendar is Monday-Friday, skipping destination holidays.
- Customer-facing cutoff is 19:00 Europe/Berlin and is deterministic.
- Known pre-confirmation operational disruption belongs in model context, not ad-hoc UI adjustments.
- Before carrier selection, customer-facing estimates must envelope standard home-carrier promises.
- If one carrier fails exposure gating, its fallback must participate in the upper-funnel envelope.
- Raw DHL/Hermes predictions may differ while still rounding to the same customer-facing promise.
- Standard carrier differences in fixtures must remain realistic; visible differences should be rare and roughly one business day at most.

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
  it('keeps prototype exposure gates explicit', () => {
    expect(PROMISE_POLICY.minConfidence).toBe(0.90)
    expect(PROMISE_POLICY.maxCalibrationError).toBe(0.03)
    expect(PROMISE_POLICY.minSupportN).toBe(500)
  })
})
```

Run `npm run test:run -- src/config/promisePolicy.test.ts`.

Expected failure: missing module/config.

**Minimal implementation:** add the shared types and explicit policy constants only.

Run:

```bash
npm run test:run -- src/config/promisePolicy.test.ts
npm run build
```

Expected: pass.

**Commit:** `git commit -m "chore: scaffold delivery promise domain"`

## Task 2: Create deterministic product/postcode/carrier fixtures

**Create:**
- `src/data/products.ts`
- `src/data/postcodes.ts`
- `src/data/predictionMatrix.ts`
- `src/data/predictionMatrix.test.ts`

**Fixture requirements:**
- exactly five products from PRD;
- exactly five demo postcodes from PRD;
- predictions for standard home/pickup DHL/Hermes combinations where model-eligible;
- Vagisan remains external-demo and model-ineligible;
- at least one valid raw result fails exposure due to low confidence/support/calibration;
- raw DHL/Hermes values normally differ slightly;
- most such differences round to the same customer-facing window;
- only a small number create visible one-business-day differences.

**Failing test first:** verify product/postcode counts, external product, one low-exposure case, and that no standard visible fixture difference exceeds one business day after rounding.

Run `npm run test:run -- src/data/predictionMatrix.test.ts`.

Expected failure: fixture modules missing.

**Minimal implementation:** add deterministic fictional fixtures only. Keep all data visibly labeled as demo/mock in source comments.

Run test again; expected pass.

**Commit:** `git commit -m "testdata: add delivery prediction fixtures"`

## Task 3: Implement exposure policy and fallback

**Create:**
- `src/domain/prediction/exposurePolicy.ts`
- `src/domain/prediction/exposurePolicy.test.ts`
- `src/domain/prediction/predictionService.ts`
- `src/domain/prediction/predictionService.test.ts`

**Interfaces:**

```ts
export type ExposureDecision = {
  safeToExpose:boolean
  reason:'safe'|'low-confidence'|'poor-calibration'|'low-support'|'missing'|'unsupported'|'service-error'
}

export function evaluateExposure(prediction: RawDeliveryPrediction | null): ExposureDecision
export function getRawPrediction(input: PredictionQuery): RawDeliveryPrediction | null
```

The customer UI never receives `reason`; it exists for tests/diagnostics only.

**Required tests:** each individual gate, missing fixture, unsupported product, simulated prediction-service exception.

Expected failure first; then minimal implementation; then pass.

**Commit:** `git commit -m "feat: gate delivery prediction exposure"`

## Task 4: Convert raw quantiles to rounded promise bounds

**Create:**
- `src/domain/promise/roundPrediction.ts`
- `src/domain/promise/roundPrediction.test.ts`

**Interface:**

```ts
export type BusinessDayWindow = { min:number; max:number }
export function roundPrediction(prediction: RawDeliveryPrediction): BusinessDayWindow
```

Rule:

```ts
min = Math.max(1, Math.ceil(q10BusinessDays))
max = Math.max(min, Math.ceil(q90BusinessDays))
```

Test exact examples from approved design: `0.6–1.6 -> 1–2`, `1.1–2.6 -> 2–3`, `2.1–4.2 -> 3–5`.

**Commit:** `git commit -m "feat: convert quantiles to promise windows"`

## Task 5: Implement Germany business calendar

**Create:**
- `src/domain/calendar/businessCalendar.ts`
- `src/domain/calendar/businessCalendar.test.ts`
- `src/data/postcodeStates.ts`

**Interfaces:**

```ts
export function isDeliveryDay(date: Date, postcode: string): boolean
export function addDeliveryDays(start: Date, days: number, postcode: string): Date
export function toGermanPromiseLabel(min: Date, max: Date): string
```

Use `date-holidays` for applicable German public holidays and a postcode-to-state fixture for the five postcodes.

Required tests: weekend skip, Friday->Monday, one national holiday, one state-specific holiday, German formatting, no Saturday/Sunday promise.

**Commit:** `git commit -m "feat: add German delivery calendar"`

## Task 6: Implement deterministic cutoff policy

**Create:**
- `src/domain/cutoff/cutoffPolicy.ts`
- `src/domain/cutoff/cutoffPolicy.test.ts`

**Interfaces:**

```ts
export function effectivePredictionStart(now: Date, postcode:string): Date
export function cutoffChangesPromise(input: CutoffComparisonInput): boolean
```

Policy assumption: customer cutoff 19:00 Europe/Berlin. Crossing cutoff shifts effective start only through deterministic operational/calendar rules.

Required tests: before/after 19:00; Friday->Monday case; cutoff hidden if customer-facing promise remains unchanged.

**Commit:** `git commit -m "feat: add delivery cutoff policy"`

## Task 7: Build customer-ready promise service and carrier envelope

**Create:**
- `src/domain/promise/types.ts`
- `src/domain/promise/buildPromise.ts`
- `src/domain/promise/buildPromise.test.ts`
- `src/domain/promise/buildCarrierEnvelope.ts`
- `src/domain/promise/buildCarrierEnvelope.test.ts`

**Customer-ready interface:**

```ts
export type CustomerPromise =
  | { kind:'fallback'; label:'Lieferung in 1–3 Werktagen'; cutoffText?:undefined }
  | { kind:'precise'; minDate:string; maxDate:string; label:string; cutoffText?:string }

export function buildCustomerPromise(input: PromiseInput): CustomerPromise
export function buildStandardHomeEnvelope(input: EnvelopeInput): CustomerPromise
```

The customer-ready type must contain no raw model metadata.

Tests:
- safe raw prediction -> precise calendar promise;
- unsafe -> fallback;
- DHL/Hermes safe -> envelope;
- one safe + one fallback -> fallback/widened envelope consistent with approved design;
- cutoff text only when promise changes;
- no weekend/holiday date.

**Commit:** `git commit -m "feat: build customer delivery promises"`

## Task 8: Implement fulfilment planning and material split rule

**Create:**
- `src/domain/fulfilment/shipmentPlanner.ts`
- `src/domain/fulfilment/shipmentPlanner.test.ts`
- `src/domain/fulfilment/materialSplit.ts`
- `src/domain/fulfilment/materialSplit.test.ts`

**Interfaces:**

```ts
export type PlannedShipment = { id:string; productIds:string[]; fulfilmentGroup:FulfilmentGroup }
export function planShipments(productIds:string[]): PlannedShipment[]
export function isMaterialSplit(input: MaterialSplitInput): boolean
```

Prototype rule: Sevenum-demo products consolidate; external-demo product is separate. For a consolidated shipment, use slowest-item constraint as the demo simplification.

Material split test cases:
- same/latest dates -> false;
- one delivery-day earlier -> true;
- Friday vs Monday -> true;
- actionable cutoff changes early promise -> true.

**Commit:** `git commit -m "feat: plan and classify split shipments"`

## Core-domain completion gate

Run:

```bash
npm run test:run
npm run build
```

Expected: all domain tests pass and TypeScript build is clean.

Then inspect exported interfaces before beginning UI work. Customer-facing code must be able to implement the approved journey without importing `predictionMatrix.ts` directly.