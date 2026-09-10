# Shop Apotheke Delivery Promise Prototype — Approved Product & System Design

**Status:** Approved design; ready for implementation planning after written-spec review  
**Date:** 2026-09-10  
**Repository:** `drw15/shopapotheke`  
**Scope:** Part 2 take-home prototype for the Redcare Pharmacy delivery and shipping experience case

---

## 1. Purpose

This prototype demonstrates how Shop Apotheke can replace broad delivery messaging with more precise customer-facing promises without adding visible complexity to the shopping experience.

The product decision is deliberately incremental:

> **Do not add a new delivery-prediction feature to the UI. Make the delivery information customers already see smarter as Redcare learns more about the order.**

The model, calibration, carrier, fulfilment, cutoff, calendar, and fallback logic remain behind the interface. The customer should mainly see the answer to one question:

> **When will I get this?**

After purchase, the question becomes:

> **Is the date Redcare promised still true?**

---

## 2. What this prototype must demonstrate

The prototype must make the following product-system behavior tangible:

1. A PDP can become more precise after postcode entry.
2. Precision is exposed only when the underlying prediction is safe enough to use.
3. Before a carrier is selected, the promise covers all eligible standard-home carrier options rather than assuming a carrier.
4. The basket may surface split delivery when the split creates meaningful customer value.
5. Checkout preserves the current Shop Apotheke hierarchy of home vs pickup first, then the applicable carrier/provider choice.
6. Split shipments do not force the customer to configure every parcel independently; they inherit the order-level destination unless the customer changes one.
7. Carrier/service is part of the prediction input, not a fixed adjustment applied after a generic prediction.
8. Deterministic operational rules such as cutoffs and delivery calendars are separate from the ML model.
9. The estimate becomes an immutable confirmed promise at order confirmation.
10. Tracking maintains a separate current ETA.
11. If the ETA moves beyond the promise, Redcare acknowledges the delay and communicates proactively.
12. Tracking and proactive email use the same source of truth.

---

## 3. Non-goals

The prototype does not attempt to:

- build or train a real delivery model;
- reproduce Redcare's WMS, OMS, inventory, routing, or carrier systems;
- call production Shop Apotheke APIs;
- process real payments;
- send real emails;
- redesign the entire Shop Apotheke site;
- expose model confidence, calibration, quantiles, warehouse IDs, or fallback reasons to customers;
- optimize or expose Redcare's transport costs in the UI;
- claim that the fictional demo fulfilment assignments reflect Redcare's real product flows;
- redesign or re-model the existing NOW! service.

The prototype is a product-system demonstration, not a production implementation.

---

# 4. Product principles

## 4.1 Precision only when Redcare can stand behind it

A model result existing does not automatically make it customer-facing.

The prototype uses three gating dimensions:

- model confidence;
- calibration quality;
- minimum sample support.

If the result fails any agreed gate, the experience falls back to the existing broad promise.

The customer never sees why the fallback happened.

## 4.2 Raw predictions and customer promises are different things

The prediction service returns a distribution. Product policy transforms that distribution into a simple delivery window.

For the prototype:

- q10 becomes the lower bound;
- q90 becomes the upper bound;
- bounds are rounded conservatively to whole business days;
- the resulting business-day window is translated into real calendar dates.

This q10/q90 policy is deliberately a **prototype assumption**. In production, Product, Data, and Last Mile/Operations should jointly agree the quantiles, exposure thresholds, and desired promise-accuracy target.

## 4.3 Progressive precision

The promise should become more specific only as relevant customer and operational context becomes known.

- PDP: product + postcode, before carrier selection.
- Basket: all products + postcode, before final shipment/delivery-method choice.
- Checkout: address + shipment plan + delivery method + carrier/provider + operational context.
- Confirmation: final checkout estimate becomes the confirmed promise.
- Tracking: live operational events drive current ETA.

Routine pre-purchase recalculations are silent. The UI simply shows the current best estimate.

## 4.4 Do not expose fulfilment complexity unless it helps the customer

The UI should not reveal a split merely because the backend has two fulfilment groups.

The basket surfaces a split only when it creates meaningful customer value, such as a materially earlier shipment or an actionable cutoff.

## 4.5 Do not create artificial urgency

A cutoff appears only when missing it would change the customer-facing promise.

`Bei Bestellung bis 19:00` is useful when 18:59 can still produce Friday but 19:01 moves the promise to Monday. It is noise when the displayed date would remain the same.

## 4.6 Preserve the promise after purchase

A later ETA does not overwrite the original promise.

Once Redcare has promised Monday, a new Tuesday ETA means the delivery is delayed. The UI should say so.

---

# 5. Current-experience fidelity

The prototype should look like an incremental change to the current Shop Apotheke site shown in the reference screenshots, not a generic ecommerce redesign.

Implementation must preserve the recognizable patterns from those screens:

- the current Shop Apotheke header and page proportions;
- red primary controls and selected radio states;
- pale/off-white content containers;
- green delivery/availability messaging where appropriate;
- large rounded red CTAs;
- thin neutral borders;
- the existing checkout stepper (`Adresse`, `Versand`, `Zahlung`, `Prüfen`);
- the current home-vs-pickup interaction hierarchy;
- DHL and Hermes as the standard carriers used in the demo;
- existing-style pickup station selection;
- existing `Lieferzeitraum` treatment under carrier options.

Do not introduce DPD or another carrier that is absent from the reference checkout.

The split-shipment UI should feel like the existing `Versand` section repeated per shipment, not like a new shipment-management product.

---

# 6. Prototype catalogue and postcode coverage

## 6.1 Products

The demo uses five products:

| ID | Product | Demo fulfilment | Standard model eligible |
|---|---|---|---:|
| `voltaren` | Voltaren Schmerzgel forte | Sevenum | yes |
| `vitamin-d3` | Vitamin D3 2000 I.E. | Sevenum | yes |
| `fenistil` | Fenistil Kühl Roll-on | Sevenum | yes |
| `ibu` | Ibu-ratiopharm 400 mg akut | Sevenum | yes |
| `vagisan` | Vagisan FeuchtCreme | external demo fulfilment | no |

The `vagisan` fulfilment assignment is fictional and exists only to exercise the unsupported-model and split-shipment paths. The customer-facing UI must not state where any demo product is actually fulfilled.

## 6.2 Postcodes

The five supported demo postcodes are:

| Postcode | City | Demo purpose |
|---|---|---|
| `50667` | Köln | nearby / predominantly fast Sevenum lane |
| `60311` | Frankfurt | western-central / predominantly fast lane |
| `22083` | Hamburg | northern / mixed 1–2 and 2–3 behavior |
| `10115` | Berlin | eastern / mixed, sometimes longer |
| `80331` | München | southern / mixed, slower, and one low-support example |

Unknown postcodes must never break the journey. They use fallback.

---

# 7. Mock prediction model contract

## 7.1 Carrier/service is part of the model input

The prototype does **not** model a generic delivery time and later add arbitrary carrier offsets.

The conceptual model request includes:

```text
product
+ postcode
+ delivery method
+ carrier/provider
+ current order time
+ relevant fulfilment/basket context
+ current operational state
```

For standard delivery, the mock data supports predictions for:

- home + DHL;
- home + Hermes;
- pickup + DHL;
- pickup + Hermes.

The exact real production feature set is unknown. The prototype contract represents the product expectation that carrier/service and relevant operational conditions should be part of the model context.

## 7.2 Raw model output

Each prediction returns:

```ts
type RawDeliveryPrediction = {
  productId: string
  postcode: string
  method: 'home' | 'pickup'
  provider: 'dhl' | 'hermes'
  meanBusinessDays: number
  q10BusinessDays: number
  q50BusinessDays: number
  q90BusinessDays: number
  confidenceScore: number
  calibrationError: number
  supportN: number
  modelVersion: string
}
```

`calibrationError` is the absolute difference between nominal and observed interval coverage for the mocked q10–q90 interval. It is used only to make the prototype gating rule concrete.

## 7.3 Prototype exposure rule

The prototype uses these illustrative thresholds:

```text
confidenceScore >= 0.90
calibrationError <= 0.03
supportN >= 500
```

All three must pass before the result may become a precise customer promise.

These thresholds are **not Redcare recommendations**. They are deterministic demo policy values chosen so reviewers can exercise safe and fallback states.

## 7.4 Production API direction

In production, after Product, Data, and Last Mile/Operations agree the exposure policy, the prediction API should return a simple eligibility result such as:

```text
safe_to_expose = true | false
```

The UI should not independently reimplement statistical governance.

The raw model metadata should remain available for Data/diagnostics, while the product-facing contract becomes easy and safe to consume.

---

# 8. From raw model output to customer-facing days

## 8.1 Prototype rounding policy

For a safe prediction:

```text
minBusinessDays = max(1, ceil(q10BusinessDays))
maxBusinessDays = max(minBusinessDays, ceil(q90BusinessDays))
```

Examples:

| Raw interval | Rounded business-day window |
|---|---|
| `0.6 – 1.6` | `1–2` |
| `1.1 – 2.6` | `2–3` |
| `2.1 – 4.2` | `3–5` |

The customer normally sees calendar dates rather than the abstract bucket.

## 8.2 Why the raw matrix is part of the handover

The reviewer-facing README must include or link to a flattened matrix showing, for each demo combination:

- product;
- postcode;
- method;
- carrier/provider;
- mean;
- q10;
- q50;
- q90;
- confidence;
- calibration error;
- sample support;
- `safe_to_expose` result;
- rounded business-day window;
- rendered customer promise for the demo date.

This is intentional. The matrix lets reviewers see the difference between what the model predicts and what Product chooses to show.

---

# 9. Realism rules for carrier predictions

DHL and Hermes are carrier-specific inputs, but the mock data must not exaggerate the differences.

The fixture should follow these rules:

1. DHL and Hermes raw distributions normally differ slightly.
2. Most raw differences round to the same customer-facing window.
3. Only a small number of combinations cross a rounding boundary and produce a visible difference.
4. Standard DHL/Hermes visible differences should not exceed roughly one business day in the demo.
5. Standard pickup is not hard-coded as universally faster than home delivery.
6. A lead-time difference is shown only when the model fixture actually produces one.

This supports the product decision that the model may detect a difference without requiring the UI to expose a difference.

---

# 10. Fallback policy

The standard fallback remains:

> **Lieferung in 1–3 Werktagen**

Use fallback when any of the following is true:

- postcode is missing;
- postcode is unsupported by the demo matrix;
- product is outside the standard prediction scope;
- prediction is missing;
- confidence is below threshold;
- calibration is outside threshold;
- sample support is below threshold;
- prediction service fails.

Fallback never blocks add-to-basket or checkout.

Internal code may preserve a fallback reason for tests and diagnostics. The customer UI must not render the reason.

---

# 11. Deterministic operational rules

## 11.1 Cutoff belongs to operational policy, not to ML

Known operational constraints are deterministic inputs/rules.

Prototype assumption:

- operational carrier handover cutoff: 23:00;
- packing/processing requirement: 3 hours;
- safety buffer: 1 hour;
- customer-facing cutoff: **19:00 Europe/Berlin**.

This is an illustrative prototype assumption, not a claim about Redcare's actual cutoff.

The model predicts within the current operational context; the UI does not ask the model to infer a cutoff from historical behavior.

## 11.2 Delivery calendar

For the prototype:

- customer delivery occurs Monday–Friday;
- customer delivery promise time is no later than 18:00;
- Saturday and Sunday are not delivery-promise days;
- applicable German public holidays are not delivery-promise days;
- destination postcode determines the German state used for state-specific holidays;
- all customer-facing dates use German locale formatting.

Dispatch-side closures and operational disruptions before confirmation are treated as model context, not as ad-hoc UI adjustments.

## 11.3 Cutoff visibility

Show `Bei Bestellung bis 19:00` only when crossing the cutoff changes the displayed promise.

Example:

```text
18:59 -> Friday latest promise
19:01 -> Monday latest promise
```

This qualifies even though Friday-to-Monday is only one business-day step, because it is three calendar days to the customer.

If the displayed delivery date is unchanged before and after the cutoff, do not show the cutoff.

---

# 12. PDP design

## 12.1 Postcode unknown

Preserve the current Shop Apotheke pattern:

> **Lieferung in 1–3 Werktagen**  
> Ihre PLZ

No precise date is shown without location.

## 12.2 Postcode known: build an envelope across standard home carriers

Before checkout the customer has not selected DHL or Hermes.

For each standard home carrier:

1. request/resolve its carrier-specific prediction;
2. apply exposure gating independently;
3. convert a safe result to a customer window;
4. replace an unsafe result with fallback;
5. build an envelope across the resulting customer-safe carrier promises.

Example:

```text
DHL Home     -> Fri–Mon
Hermes Home  -> Mon–Tue
PDP          -> Fri–Tue
```

If one carrier is precise and one falls back:

```text
DHL Home     -> 1–2 days
Hermes Home  -> fallback 1–3 days
PDP          -> 1–3 days
```

The upper funnel must not become more certain than the set of standard options available later.

## 12.3 PDP copy

When precise:

> **Voraussichtliche Lieferung: Fr., 11. – Mo., 14. Sept.**

Show cutoff below only if it changes the promise:

> Bei Bestellung bis 19:00

When fallback:

> **Lieferung in 1–3 Werktagen**

The postcode may remain visible so the customer knows location is set.

## 12.4 PDP postcode changes

If the customer changes postcode, recalculate silently.

Do not show `Lieferzeit aktualisiert`, a modal, or an explanation. Before purchase, this is still an estimate and the customer may simply be checking a different address.

---

# 13. Basket design

## 13.1 Basket promise before carrier selection

The basket uses the same standard-home carrier-envelope policy as PDP, now applied to all products and the preliminary shipment plan.

The basket should not assume a carrier that the customer has not selected.

## 13.2 Material split rule

The basket may know that fulfilment will produce more than one shipment. It surfaces that split only when the split gives the customer useful information.

A split is material when **either**:

1. the earlier shipment's latest promise is at least one eligible delivery day earlier than the later shipment's latest promise; or
2. an actionable cutoff changes the earlier shipment's displayed promise.

Friday vs Monday is material even though it is one business-day step because the customer experiences a three-calendar-day difference.

## 13.3 Non-material split

If both shipments would arrive at essentially the same time, keep the basket simple and show one overall delivery envelope.

Example:

```text
Shipment 1 -> Mon–Tue
Shipment 2 -> Mon–Tue
Basket     -> Mon–Tue
```

Do not reveal the split just because the backend contains two fulfilment groups.

## 13.4 Material split presentation

When material, show a compact split inside the existing basket/order structure:

> **Ihre Bestellung kommt in 2 Lieferungen**

For each shipment show:

- `Lieferung 1 von 2` / `Lieferung 2 von 2`;
- small product thumbnails;
- product names;
- customer-facing delivery date/window;
- cutoff only when it changes that shipment's promise.

Do not repeat:

- prices;
- quantity controls;
- carrier selection;
- warehouse names;
- fulfilment group IDs.

Those controls or details already exist elsewhere or belong to checkout.

## 13.5 Basket conversion nudge

The cutoff is allowed to act as a small conversion nudge because it communicates a real service consequence.

Example:

> **Lieferung 1 von 2**  
> Voraussichtlich Freitag  
> **Bei Bestellung bis 19:00**

> **Lieferung 2 von 2**  
> Voraussichtlich Montag–Dienstag

No urgency message is added beyond the factual cutoff.

---

# 14. Fulfilment planning

The fulfilment planner decides whether the order contains one or multiple shipments.

Prototype rule:

```text
Sevenum demo products can consolidate into one shipment.
External demo fulfilment is a separate shipment.
```

A canonical split basket is:

- Voltaren + Vitamin D3 -> Sevenum demo shipment;
- Vagisan -> external demo shipment.

The customer never sees `Sevenum` or `external fulfilment` labels.

For several products inside one shipment, the prototype uses the slowest item as the shipment constraint. This is an implementation simplification. A production prediction service could instead model basket/shipment composition directly.

---

# 15. Checkout design

## 15.1 Preserve the current checkout structure

Keep the current progression:

> **Adresse -> Versand -> Zahlung -> Prüfen**

The new concept primarily changes the information shown within `Versand`.

## 15.2 Preserve the delivery-choice hierarchy

The customer first chooses the destination method:

1. **An eine Lieferadresse**;
2. **An einen Abholort**.

Only then does the UI show the applicable provider choice.

### Home

- select/confirm home address;
- then show eligible home carriers such as DHL and Hermes;
- each carrier shows its own predicted `Lieferzeitraum`.

### Pickup / PUDO

- select `An einen Abholort`;
- use an existing-style `Abholstation finden` flow;
- the selected station determines the relevant DHL or Hermes pickup service;
- show the prediction for that method/provider/location.

Do not flatten `DHL nach Hause` and `Hermes PaketShop` into the same first-level list.

## 15.3 Single shipment

For one shipment, the `Versand` step should look essentially like the current Shop Apotheke experience.

Example:

> **Standard mit DHL**  
> Lieferzeitraum: Fr., 11. – Mo., 14. September

> **Standard mit HERMES**  
> Lieferzeitraum: Fr., 11. – Mo., 14. September

If one of the few mock combinations produces a visible one-business-day difference, show it without additional explanation.

## 15.4 Split shipment

When checkout contains two shipments, remain on the same `Versand` step and render two shipping blocks.

Top-level copy:

> **Ihre Bestellung kommt in 2 Lieferungen**  
> So können verfügbare Artikel früher bei Ihnen ankommen.

Each shipment header contains:

- tiny product thumbnails;
- `2 Artikel` / `1 Artikel`;
- no product names by default;
- current destination method and destination label;
- `Lieferart ändern`.

Then render the same current-style carrier/provider option rows for that shipment.

This should feel like two instances of an existing shipping-option block, not a new split-order wizard.

## 15.5 Default inheritance

The customer's order-level destination choice applies to all shipments by default.

Example:

```text
Order destination: home -> Schumannstr. 11
Shipment 1: inherits home -> Schumannstr. 11
Shipment 2: inherits home -> Schumannstr. 11
```

The customer is not forced to configure each parcel just because Redcare split the order.

## 15.6 Per-shipment override

Each shipment exposes `Lieferart ändern`.

Clicking it expands the same method hierarchy inline for that shipment:

- `An eine Lieferadresse`;
- `An einen Abholort`.

If pickup is chosen, open the existing-style station picker.

Changing shipment 1 must not change shipment 2.

Canonical demo end state:

- shipment 1 -> pickup;
- shipment 2 -> home.

This capability is a prototype product assumption because Redcare's real OMS capability is unknown. If production cannot support per-shipment destination selection, the same design can collapse to one order-level destination while keeping the promise logic.

## 15.7 No PUDO steering copy

Pickup may be cheaper operationally, but that is not customer-facing rationale in this case.

Do not show:

- `Recommended`;
- `Best option`;
- `Help us save costs`;
- equivalent internal-economics messaging.

The customer sees location, service, and lead-time differences and chooses based on their own preference.

---

# 16. NOW! service decision

NOW! is explicitly outside the redesigned prediction flow.

The reason is product discipline, not technical inability:

> NOW! appears to be a separate expedited service with its own eligibility and operating model. We do not have enough information about how it works internally to redesign or merge it into the new standard prediction experience responsibly.

The prototype therefore does not model NOW! predictions, cutoffs, or fulfilment rules.

If current-page fidelity requires an existing NOW! element to remain visible, it should remain visually unchanged and clearly outside the new standard-promise logic. It is not an interactive demo scenario.

---

# 17. Address and context changes before purchase

Before confirmation, all displayed delivery information is still an estimate.

If postcode, full address, basket, carrier/service, or relevant operational context changes:

- rerun/re-resolve the prediction using the current context;
- apply the same promise policy;
- render the new estimate silently.

Do not show a special `Lieferzeit aktualisiert` message for routine pre-purchase recalculation.

Known operational disruptions before confirmation belong in the model context. They are not applied as ad-hoc `+1 day` UI adjustments.

---

# 18. Confirmation: estimate becomes promise

At order confirmation, freeze the final customer-facing promise for each shipment.

Conceptually:

```ts
type ConfirmedShipment = {
  shipmentId: string
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
```

`confirmedPromiseMin` and `confirmedPromiseMax` are immutable after confirmation.

A split order has one confirmed promise per shipment.

---

# 19. Tracking design

## 19.1 Separate promise and ETA

Tracking maintains:

- **confirmed promise** — what Redcare committed to at confirmation;
- **current ETA** — the latest expected delivery based on fulfilment/carrier events.

If current ETA stays inside the confirmed promise, show normal tracking.

If current ETA exceeds the promise, the shipment becomes delayed.

## 19.2 Delay rule

```text
isDelayed = currentEtaMax > confirmedPromiseMax
```

## 19.3 Delayed UX

Lead with:

> **Ihre Lieferung verspätet sich**

Then:

> Neuer Liefertermin: **[new ETA]**

Secondary context:

> Ursprünglich angekündigt: [confirmed promise]

Keep the normal Shop Apotheke-style tracking timeline below.

Do not silently replace the old promise with the new ETA.

## 19.4 Split tracking

Each shipment is independent after confirmation.

Example:

- shipment 1: delivered Friday;
- shipment 2: in transit for Monday.

If shipment 2 becomes delayed, only shipment 2 receives delay treatment.

---

# 20. Prebuilt tracking orders

The prototype includes four deterministic orders so reviewers can explore post-purchase behavior without hidden controls:

| Order | State | Demonstrates |
|---|---|---|
| `#100421` | on time | ETA remains within promise |
| `#100422` | delayed | ETA moves beyond promise |
| `#100423` | split | shipment 1 delivered, shipment 2 in transit |
| `#100424` | completed | normal delivered lifecycle |

Demo dates should be generated relative to a deterministic demo clock/current date so the prototype does not become obviously stale.

---

# 21. Operational disruption after confirmation

After confirmation, operational disruption no longer changes the original promise.

It changes `currentEta`.

Flow:

```text
carrier/fulfilment event
        -> update current ETA
        -> compare with confirmed promise
        -> if outside promise: delayed state
        -> tracking delay treatment
        -> proactive delay notification eligible
```

This is the boundary between a changing estimate and a broken customer commitment.

---

# 22. Proactive delay email

The prototype includes an HTML email preview for the delayed demo order.

It does not send real email.

The email must read the same order/shipment state as tracking. No separate hard-coded promise or ETA dates are allowed.

Recommended structure, based on the provided Shop Apotheke email reference:

- Shop Apotheke header/branding;
- short delay headline;
- new delivery date prominently shown;
- original promised date as context;
- short reassurance that no action is required;
- `Sendung verfolgen` CTA;
- familiar support/footer treatment.

Suggested copy:

> **Ihre Lieferung verspätet sich**
>
> Guten Tag Daniel Roiz,
>
> leider kommt Ihre Lieferung später als ursprünglich erwartet.
>
> **Neuer Liefertermin**  
> Dienstag, 15. September
>
> Ursprünglich angekündigt: Montag, 14. September
>
> Sie müssen nichts tun. Wir halten Sie über den weiteren Verlauf Ihrer Lieferung auf dem Laufenden.

The product purpose is to answer the likely WISMO question before the customer needs to contact Customer Service.

---

# 23. Error and fallback behavior

Failures should be deliberately boring for the customer.

| Condition | Customer behavior |
|---|---|
| prediction service error | fallback `1–3 Werktage`; shopping continues |
| unknown postcode | fallback |
| model-ineligible product | fallback |
| low confidence | fallback |
| poor calibration | fallback |
| insufficient support | fallback |
| one PDP home carrier safe, one unsafe | unsafe carrier contributes fallback; PDP envelope widens accordingly |
| both standard home carriers unsafe | fallback |

Do not show an ML/API error toast or prevent checkout.

Internal diagnostics may retain the reason.

---

# 24. Prototype architecture

Recommended stack:

- React;
- TypeScript;
- Vite;
- client-side mock services and deterministic fixtures;
- React Router for the journey routes;
- a small shared store for postcode, basket, checkout selection, and generated order state.

Domain boundaries should remain explicit:

```text
src/
  data/
    products
    postcodes
    predictionMatrix
    pickupLocations
    demoOrders

  domain/
    predictionService
    exposurePolicy
    promiseWindow
    businessCalendar
    cutoffPolicy
    shipmentPlanner
    deliveryOptions
    orderPromise
    trackingEta

  pages/
    product
    basket
    checkout
    confirmation
    orders
    tracking
    emailPreview
```

The exact file names are implementation-plan decisions. The boundary is the requirement: UI components do not read raw prediction fixtures directly.

---

# 25. Routes and demo journey

The implementation should support a short, coherent walkthrough such as:

```text
/product/:productId
/basket
/checkout/address
/checkout/shipping
/checkout/payment
/checkout/review
/confirmation/:orderId
/orders
/orders/:orderId
/email-preview/:orderId
```

Payment and review may be lightweight static prototype steps; delivery behavior is the priority.

---

# 26. Handover README requirements

The final handover README is part of the product deliverable, not just setup documentation.

It must contain the following sections.

## 26.1 Product decisions and assumptions

For each meaningful decision, document:

- **Decision** — what was chosen;
- **Why** — customer/product rationale;
- **Alternative considered** — what was deliberately not chosen;
- **Prototype assumption** — what is mocked or unknown;
- **Production validation** — which teams/capabilities would need to confirm it.

At minimum, document these decisions:

1. q10/q90 are used as prototype promise bounds.
2. Confidence + calibration + support gate precision.
3. Production API should expose `safe_to_expose` after policy is jointly agreed.
4. Carrier/service is part of model input.
5. PDP uses the envelope across eligible standard home carriers.
6. An unsafe carrier contributes fallback to that PDP envelope.
7. Raw carrier differences often round to the same displayed window.
8. Cutoff is deterministic and only shown when it changes the promise.
9. Split shipment is shown in basket only when materially useful.
10. Basket split shows thumbnails + product names.
11. Checkout split shows tiny thumbnails + item count, not repeated product names.
12. Split shipments inherit the order-level destination by default.
13. Per-shipment `Lieferart ändern` is optional and scoped to that shipment.
14. Home vs pickup remains the first-level delivery-method decision.
15. PUDO is not customer-steered using Redcare cost economics.
16. NOW! remains out of scope because its operating model is insufficiently known.
17. Routine pre-purchase recalculation is silent.
18. Pre-confirmation disruption is model context, not an ad-hoc promise adjustment.
19. Confirmed promise is immutable.
20. Tracking and email share one ETA/promise source of truth.

## 26.2 Try these scenarios

Provide exact product/postcode/basket/order combinations reviewers can enter themselves.

The scenario list must include:

- fast safe prediction;
- slower safe prediction;
- raw DHL/Hermes difference that rounds to the same customer window;
- one visible DHL/Hermes difference;
- low-confidence/low-support fallback;
- unsupported external product;
- non-material split basket;
- material Friday-vs-Monday style split;
- single-shipment checkout;
- split checkout with one shipment changed to pickup;
- on-time order;
- delayed order;
- split tracking order;
- email preview for the delayed order.

## 26.3 Prediction matrix

Include or link to the full flattened fixture matrix so reviewers can understand and reproduce every modeled combination.

## 26.4 What is mocked

Explicitly identify:

- prediction values;
- thresholds;
- fulfilment grouping;
- carrier/service timing;
- 19:00 cutoff;
- per-shipment destination capability;
- tracking events;
- email sending.

## 26.5 Running the prototype

Provide normal local run/build/test instructions and the main demo routes.

---

# 27. Testing strategy

The prototype should be test-first at the domain-rule level and use a small number of integration/E2E tests for the journey.

## 27.1 Required domain tests

1. q10/q90 rounding produces the expected whole-business-day bounds.
2. confidence failure returns fallback.
3. calibration failure returns fallback.
4. sample-support failure returns fallback.
5. unsupported product returns fallback.
6. unknown postcode returns fallback.
7. prediction exception returns fallback without blocking.
8. PDP envelope combines safe DHL/Hermes home promises.
9. unsafe home carrier contributes fallback to PDP envelope.
10. Thursday + business-day window skips weekend.
11. applicable public holiday is skipped.
12. pre-cutoff vs post-cutoff promise shifts when the cutoff matters.
13. cutoff is suppressed when crossing it does not change the promise.
14. non-material split remains hidden in basket.
15. one-delivery-day material split appears in basket.
16. Friday-vs-Monday qualifies as material.
17. same-fulfilment products consolidate.
18. external demo fulfilment creates a separate shipment.
19. split shipments inherit order-level destination.
20. per-shipment destination override changes only the target shipment.
21. home and pickup preserve method -> provider hierarchy.
22. confirmation freezes the promise.
23. current ETA may change without mutating confirmed promise.
24. ETA within promise is on time.
25. ETA beyond promise is delayed.
26. split shipments track delay independently.
27. email preview reads the same promise/ETA values as tracking.

## 27.2 Integration/E2E flows

At minimum:

- PDP postcode change -> precise/fallback behavior;
- add mixed products -> basket split visibility rule;
- checkout single shipment -> DHL/Hermes carrier promises;
- checkout split -> inherited home destination -> change one shipment to pickup;
- confirm order -> promise frozen;
- open delayed demo order -> delay treatment;
- open corresponding email preview -> same dates as tracking.

---

# 28. Acceptance criteria

The design is implemented correctly when all of the following are observable.

## Model/policy

- raw fixture contains carrier/service-specific model-like predictions;
- customer components never render raw model metadata;
- safe exposure requires confidence + calibration + support;
- unsafe/missing/error states fall back safely;
- q10/q90 are transformed into whole-business-day promise bounds.

## Calendar/cutoff

- no customer promise lands on Saturday or Sunday;
- applicable German holidays are skipped;
- delivery is modeled as Monday–Friday, latest 18:00;
- 19:00 cutoff is shown only when it changes the displayed promise.

## PDP

- five supported postcodes produce deterministic scenarios;
- standard-home carrier promises are enveloped before carrier selection;
- an unsafe carrier can widen the PDP back to `1–3 Werktage`;
- postcode changes recalculate silently.

## Basket

- non-material split is hidden;
- material split is shown;
- material split shows thumbnails + names;
- cutoff may appear per shipment only when meaningful.

## Checkout

- current Shop Apotheke hierarchy is preserved;
- home vs pickup is first-level;
- DHL/Hermes are the standard demo carriers;
- split order stays on the same `Versand` step;
- both shipment blocks are visible together;
- shipment headers use tiny thumbnails + item count;
- both shipments inherit the original destination;
- `Lieferart ändern` works inline for one shipment;
- changing shipment 1 does not alter shipment 2;
- no PUDO cost-steering copy appears;
- NOW! is not integrated into the new prediction logic.

## Confirmation/tracking/email

- final checkout promise is frozen per shipment;
- current ETA is independent;
- delayed ETA never overwrites confirmed promise;
- delayed tracking shows both new ETA and original promise;
- split shipments can have different states;
- proactive email preview uses the same data as tracking.

## Fidelity/demo quality

- the prototype resembles the provided Shop Apotheke screens rather than a generic ecommerce template;
- no DPD appears;
- no demo-control panel is required;
- reviewers can reproduce important states through the supplied matrix/scenario guide;
- the core story can be demonstrated within the 15-minute prototype portion of the interview.

---

# 29. Core product-decision summary

The prototype tells one coherent story:

> Redcare can expose more precise delivery information without exposing more complexity.

We use model output only when confidence, calibration, and support justify it. We do not assume a carrier before the customer chooses one, so upper-funnel promises cover the eligible standard options. We show split fulfilment in the basket only when it materially helps the customer. At checkout we preserve the current delivery hierarchy and let the customer see carrier/pickup lead-time differences without telling them what to choose. Once the order is confirmed, the estimate becomes a promise that is never rewritten. If reality changes, the ETA changes, the customer is told that the shipment is delayed, and the same state drives proactive communication.

That is the behavior the implementation plan must preserve.
