# Delivery Promise Experience — Technical / Functional Specification

## 1. Scope

Build a high-fidelity prototype that demonstrates a smarter delivery-promise experience across:

1. Product Detail Page (PDP)
2. Basket
3. Checkout — address / fulfilment method
4. Checkout — shipment / carrier selection
5. Order confirmation
6. Orders list / tracking
7. Delay email preview

The prototype is not production-ready. Its job is to demonstrate product logic, customer-journey decisions, confidence handling, split shipments, delivery-method choices, cutoffs, business-day calendars, and proactive delay communication.

---

## 2. Explicit prototype assumptions

These are assumptions for the prototype only. They are not claims about Redcare's production systems.

- Stack: React + TypeScript + Vite
- Delivery days: Monday–Friday
- Delivery latest time: 18:00
- German public holidays are treated as non-delivery days
- Customer-facing order cutoff: 19:00
- Operational carrier cutoff: 23:00
- Packing / processing requirement: 3 hours
- Safety buffer: 1 hour
- Model prototype supports Sevenum-served products only
- One demo product is intentionally marked as non-Sevenum / unsupported by the model
- Split shipments are allowed when fulfilment groups differ
- Per-shipment delivery-method override is supported in the prototype, but should be isolated behind a capability flag because this may not be supported by the real OMS
- Existing `1–3 working days` remains the safe fallback

---

## 3. Core domain model

### 3.1 Product

```ts
export type Product = {
  id: string
  name: string
  pzn?: string
  price: number
  image: string
  fulfillmentNode: 'sevenum' | 'external'
  modelEligible: boolean
  nowEligible?: boolean
}
```

Use five products total.

Suggested demo products, using products already visible in the reference screenshots where practical:

- Voltaren Schmerzgel forte
- Vitamin D3 2000 I.E.
- Fenistil Kühl Roll-on
- Vagisan FeuchtCreme
- Ibu-ratiopharm 400 mg akut

One product must be treated as `external` / `modelEligible: false` in the prototype data even if the UI name is a normal retail SKU. Document that this fulfilment assignment is fictional demo data.

---

### 3.2 Postcode

```ts
export type DemoPostcode = {
  postcode: string
  city: string
  federalState: string
}
```

Use:

- 50667 — Köln
- 60311 — Frankfurt
- 22083 — Hamburg
- 10115 — Berlin
- 80331 — München

Unknown postcodes must never break the flow. They fall back safely.

---

### 3.3 Raw prediction

The mocked prediction matrix must store **model-like outputs**, not customer-facing lead-time buckets.

```ts
export type DeliveryPrediction = {
  productId: string
  postcode: string
  q10BusinessDays: number
  q50BusinessDays: number
  q90BusinessDays: number
  calibrationCoverage: number
  calibrationSample: number
  fulfillmentNode: 'sevenum' | 'external'
  modelEligible: boolean
}
```

Important:

- `q10/q50/q90` represent a delivery-time distribution
- `calibrationCoverage` and `calibrationSample` are used by product policy to decide whether to expose a precise window
- the matrix must not directly contain labels like `1–2 working days`

---

## 4. Mock prediction matrix

The exact values are fictional but should follow realistic geography for Sevenum-to-Germany distribution:

- Köln and Frankfurt should generally be fastest
- Hamburg should often be 1–2 or 2–3 days
- Berlin and München should be mixed and sometimes slower
- at least one combination should be low-calibration and therefore fall back despite having raw predictions
- one product should be model-ineligible because it is not fulfilled from Sevenum

Suggested directional raw values:

| Product | Köln | Frankfurt | Hamburg | Berlin | München |
|---|---|---|---|---|---|
| Voltaren | .7 / 1.0 / 1.5 | .8 / 1.1 / 1.7 | .9 / 1.3 / 1.9 | 1.2 / 1.7 / 2.5 | 1.3 / 1.9 / 2.7 |
| Vitamin D3 | .8 / 1.1 / 1.6 | .9 / 1.2 / 1.8 | 1.1 / 1.6 / 2.3 | 1.3 / 1.8 / 2.6 | 1.5 / 2.1 / 3.0 |
| Fenistil | .6 / .9 / 1.4 | .8 / 1.1 / 1.6 | 1.0 / 1.5 / 2.2 | 1.3 / 1.8 / 2.4 | 1.5 / 2.0 / 2.9 |
| Vagisan | .9 / 1.2 / 1.8 | 1.0 / 1.4 / 2.0 | 1.3 / 1.8 / 2.5 | 1.5 / 2.1 / 3.1 | 2.1 / 3.0 / 4.4 |
| External demo product | — | — | — | — | — |

Format above is `q10 / q50 / q90` in business days.

Add explicit calibration fields separately per combination.

One recommended low-calibration example:

- Vitamin D3 + München
  - valid q10/q50/q90 prediction
  - calibration coverage below threshold and/or insufficient sample
  - result shown to customer = fallback

---

## 5. Promise policy

### 5.1 Configuration

```ts
export const promisePolicyConfig = {
  minCalibrationCoverage: 0.93,
  minCalibrationSample: 500,
  fallbackMinBusinessDays: 1,
  fallbackMaxBusinessDays: 3,
  customerCutoffHour: 19,
  deliveryEndHour: 18,
  perShipmentDeliveryMethodOverrideEnabled: true,
}
```

All values must be easy to change in one config file.

### 5.2 Eligibility logic

Precise prediction may be shown only when all are true:

1. product is model-eligible
2. product fulfilment node is Sevenum
3. postcode exists in the demo matrix
4. prediction exists
5. calibration coverage >= configured minimum
6. calibration sample >= configured minimum

Otherwise return fallback.

### 5.3 Window construction

Map the continuous prediction interval to conservative business-day bounds.

Suggested prototype rule:

```ts
minDays = Math.max(1, Math.floor(q10BusinessDays))
maxDays = Math.max(minDays, Math.ceil(q90BusinessDays))
```

Then apply a minimum one-day width where necessary if the UX would otherwise create false single-day certainty.

This rule is a prototype product-policy assumption and should be isolated in `promisePolicy.ts`.

The UI must never read q-values directly.

---

## 6. Business calendar

Create a single calendar utility used by PDP, basket, checkout, confirmation, and tracking.

Requirements:

- Monday–Friday only
- skip weekends
- skip public holidays
- destination postcode determines German federal state holiday calendar where relevant
- no Sunday promises
- all customer-facing dates use German locale formatting

Example functions:

```ts
addBusinessDays(date, count, postcode)
getDeliveryDateRange(startDate, minDays, maxDays, postcode)
isBusinessDay(date, postcode)
```

### Cutoff

If current local time in Europe/Berlin is after 19:00, shift the effective order start by one business day before applying predicted lead time.

The displayed cutoff text must be generated from configuration, not duplicated across pages.

---

## 7. Public domain APIs inside the frontend

UI components should call domain services rather than reading data files directly.

### PDP

```ts
getProductPromise(productId, postcode | null, now)
```

Returns:

```ts
{
  mode: 'precise' | 'fallback',
  minDate: Date,
  maxDate: Date,
  cutoffText?: string,
  reason?: 'missing-postcode' | 'unsupported' | 'low-calibration' | 'missing-prediction'
}
```

`reason` is for logging / tests only; do not render it to customers.

### Basket

```ts
getBasketPromise(items, postcode | null, now)
```

Returns overall earliest/latest envelope without exposing shipment groups.

### Shipment planning

```ts
planShipments(items)
```

Prototype rule:

- same fulfilment group -> one shipment
- different fulfilment groups -> separate shipments

The UI explains the resulting plan but does not expose fulfilment-node names.

### Delivery options

```ts
getDeliveryOptions(shipment, destination, now)
```

Must preserve the real hierarchy:

- first: home vs pickup / PUDO
- then: carrier / pickup location options that belong to the selected method

Do not present `DHL home` and `Hermes PaketShop` as peer options in the same first-level list.

### Order confirmation

```ts
confirmOrder(shipmentPlan)
```

Creates immutable `confirmedPromise` per shipment.

### Tracking

```ts
getTrackingState(orderId)
```

Returns confirmed promise, current ETA, shipment status, and delay state.

---

## 8. Delivery-method model

```ts
export type DeliveryMethod = 'home' | 'pickup'
```

### Home

Carrier choices may include:

- DHL
- Hermes

Each carrier may have a different predicted date range.

### Pickup / PUDO

Location/provider choices may include:

- Hermes PaketShop
- DHL Paketshop / Filiale
- DHL Packstation
- Now! pickup when eligible

PUDO may be cheaper operationally, but that must **not** be expressed as a customer-facing recommendation or cost-saving message in this prototype.

The customer sees service differences such as delivery / pickup timing and makes the choice.

---

## 9. Basket behavior

Requirements:

- show all selected products
- show the overall basket delivery envelope
- show cutoff copy
- do not show shipment splitting yet
- proceed to checkout using the existing visual language

Example:

> Voraussichtliche Lieferung: Fr., 11. – Mi., 16. Sept.

> Bei Bestellung bis 19:00

---

## 10. Checkout behavior

### 10.1 Address step

Recreate current Shop Apotheke structure closely:

- address delivery section
- pickup section
- selected-state radio controls
- pickup-station modal

### 10.2 Shipping step — one parcel

Show one shipping-options card.

Example:

**Standard mit DHL**

> Lieferzeitraum: Fr., 11. – Mo., 14. September

**Standard mit HERMES**

> Lieferzeitraum: Mo., 14. – Di., 15. September

### 10.3 Shipping step — split order

Show:

> Ihre Bestellung kommt in 2 Lieferungen

> So können verfügbare Artikel früher bei Ihnen ankommen.

For each shipment:

- `Lieferung 1 von 2`
- product summary
- inherited delivery method
- inherited address / pickup point
- `Lieferart ändern`
- method-specific carrier / location options
- predicted delivery date for each valid option

The original order-level choice applies to all shipments unless the customer changes one shipment.

### 10.4 Per-shipment override

If enabled by config, `Lieferart ändern` allows one shipment to switch between:

- home
- pickup

Then the second-level choices change accordingly.

Example end state:

- Shipment 1 -> Hermes PaketShop pickup
- Shipment 2 -> home delivery

If this capability is disabled, hide the per-shipment override and use one order-level method.

---

## 11. NOW! handling

The prototype may include a small subset of combinations where Now! pickup is eligible.

Suggested example:

- Voltaren + 22083 Hamburg

If eligible, preserve current-style messaging such as:

> Abholung heute möglich

Do not assume Now! is available for every product/postcode combination.

---

## 12. Order model

```ts
export type ShipmentPromise = {
  shipmentId: string
  confirmedPromiseMin: string
  confirmedPromiseMax: string
  currentEtaMin: string
  currentEtaMax: string
  deliveryMethod: DeliveryMethod
  providerId: string
  status: 'confirmed' | 'preparing' | 'in_transit' | 'delivered'
}
```

Confirmed promise fields are immutable after order creation.

`currentEta*` may change.

Delay condition:

```ts
currentEtaMax > confirmedPromiseMax
```

---

## 13. Demo orders

Create four prebuilt orders:

1. `#100421` — on time
2. `#100422` — delayed
3. `#100423` — split order; shipment 1 delivered, shipment 2 in transit
4. `#100424` — fully delivered

The delayed order must have:

- confirmed promise earlier than current ETA
- visible original promise
- visible new ETA
- corresponding delay email preview

---

## 14. Tracking UX

### On time

Show normal current ETA and timeline.

### Delayed

Lead with:

> Ihre Lieferung verspätet sich

Then:

> Neuer Liefertermin: [new ETA]

Secondary:

> Ursprünglich angekündigt: [confirmed promise]

Tracking timeline should remain visible underneath.

Do not silently replace the confirmed promise.

---

## 15. Delay email preview

Route example:

```txt
/email-preview/100422
```

The email must be generated from the same order data used on the tracking page.

No separate hardcoded email dates.

Suggested trigger logic:

```ts
if (currentEtaMax > confirmedPromiseMax) {
  delayNotificationRequired = true
}
```

No actual email send is required.

---

## 16. Repository structure

```txt
src/
  data/
    products.ts
    postcodes.ts
    predictionMatrix.ts
    calibrationData.ts
    carrierRules.ts
    pickupLocations.ts
    nowPickupEligibility.ts
    demoOrders.ts

  domain/
    promisePolicy.ts
    businessCalendar.ts
    cutoffPolicy.ts
    shipmentPlanner.ts
    deliveryOptions.ts
    orderPromise.ts
    trackingEta.ts

  pages/
    ProductPage.tsx
    BasketPage.tsx
    CheckoutAddressPage.tsx
    CheckoutDeliveryPage.tsx
    ConfirmationPage.tsx
    OrdersPage.tsx
    TrackingPage.tsx
    DelayEmailPreview.tsx

  components/
    Header.tsx
    ProductCard.tsx
    DeliveryEstimate.tsx
    CartItem.tsx
    ShipmentCard.tsx
    DeliveryMethodSelector.tsx
    CarrierOption.tsx
    PickupStationModal.tsx
    TrackingTimeline.tsx
    DelayBanner.tsx

  stores/
    cartStore.ts
    customerStore.ts
    checkoutStore.ts
    orderStore.ts

  config/
    promisePolicyConfig.ts

  utils/
    dates.ts
    locale.ts
```

---

## 17. Demo matrix / README scenarios

README must include a concise `Try these scenarios` table so reviewers can explore the prototype without hidden controls.

Example:

| Scenario | Product | Postcode | Expected behavior |
|---|---|---|---|
| Fast, calibrated | Voltaren | 50667 | precise fast window |
| Medium | Voltaren | 22083 | precise 1–2 / 2–3 style window |
| Slower | Vagisan | 80331 | precise longer window |
| Low calibration | Vitamin D3 | 80331 | fallback 1–3 |
| Unsupported fulfilment | External demo product | any | fallback / separate fulfilment |
| Unknown postcode | any | 99999 | safe fallback |

Also document at least two basket examples:

- same fulfilment group -> single shipment
- mixed fulfilment groups -> split shipment

And list the demo tracking order IDs.

---

## 18. UI / copy rules

### Do

- use German customer-facing copy
- use calendar dates
- show cutoff discreetly
- preserve current Shop Apotheke hierarchy and visual patterns
- show different lead times per carrier / pickup method where the mock rules produce them
- allow the information to guide the customer's choice

### Do not

- show model confidence percentages
- show q10/q50/q90
- show warehouse names
- show internal logistics rationale
- show `Recommended` steering badges for PUDO
- mention that PUDO is cheaper for Redcare
- put home-delivery carriers and pickup locations at the same hierarchy level
- show Sunday delivery promises
- overwrite the original confirmed promise after a delay

---

## 19. Testing requirements

At minimum add unit tests for:

### Promise policy

- calibrated prediction -> precise
- low calibration -> fallback
- unsupported product -> fallback
- unknown postcode -> fallback

### Business calendar

- skip Saturday / Sunday
- skip configured German public holiday
- cutoff after 19:00 shifts effective start
- no generated delivery end date on weekend

### Shipment planner

- same fulfilment group -> one shipment
- different fulfilment group -> split

### Tracking

- ETA inside promise -> not delayed
- ETA later than promise -> delayed
- confirmed promise remains unchanged

---

## 20. Definition of done

The prototype is ready when a reviewer can, without any hidden demo control panel:

1. Open a PDP
2. Enter different documented postcodes and see precise vs fallback behavior
3. Add 4–5 products to a basket
4. See a simple basket-level delivery envelope
5. Enter checkout using current-style address / pickup selection
6. See one- or two-shipment behavior depending on the basket
7. Choose home or pickup, then the relevant carrier / station options
8. See different delivery dates by option
9. Confirm an order and see frozen shipment promises
10. Open prebuilt tracking orders showing on-time, delayed, split, and delivered states
11. Open the delayed-order email preview
12. Verify no customer-facing screen exposes prediction-model or fulfilment complexity
