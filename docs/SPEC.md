# Delivery Promise Experience — Product & System Specification

**Status:** Design-approved draft, ready for implementation planning  
**Owner:** Daniel Roiz Walss  
**Date:** 2026-09-09  
**Purpose:** Redcare Pharmacy Senior Product Manager take-home prototype  
**Next artifact:** implementation plan. This document defines *what* must be built and how it must behave; it is intentionally not a coding task list.

---

## 0. Executive decision

The prototype will **not create a new delivery-prediction feature in the UI**. It will make the delivery information Shop Apotheke already shows progressively more precise as more order context becomes available.

The customer should never need to understand model confidence, quantiles, warehouses, fulfilment groups, cut-off calculations, carrier rules, or fallback logic.

The core experience is:

1. **PDP:** show a product-level estimate; use a precise calendar window only when the prediction is trustworthy.
2. **Basket:** show one simple overall basket delivery envelope. Do not expose split shipments yet.
3. **Checkout:** once address, basket, delivery method and cut-off are known, show the actual shipment plan and the delivery time for the choices the customer can make.
4. **Confirmation:** freeze the customer-facing delivery commitment as the **confirmed promise**.
5. **Tracking:** maintain a separate **current ETA**. If it moves beyond the confirmed promise, tell the customer proactively instead of silently replacing the original promise.
6. **Delay email:** use the same tracking state to render a proactive delay notification.

The guiding rule is:

> **All complexity stays behind the UI. The customer only sees the best delivery information we can responsibly stand behind.**

---

# 1. Problem statement

Shop Apotheke currently uses broad delivery messaging such as `1–3 Werktage` across the customer journey. The case asks how a new delivery-prediction API should be introduced when it can sometimes predict a faster window and sometimes a slower but more realistic one.

The prototype must demonstrate the product-system answer to that problem, not just a visual redesign.

It must show that delivery information changes in meaning as Redcare learns more:

- a PDP estimate is based on one product and limited customer context;
- a basket estimate accounts for all items but should remain simple;
- checkout can use the full address, shipment plan, delivery method, provider and cut-off;
- after purchase the estimate becomes a promise;
- after fulfilment starts, live events may change the ETA without changing the historical promise.

The case explicitly requires handling uncertainty, mixed baskets, missing address, low confidence, missed cut-off, API failure and operational disruption. The prototype must make those rules observable without adding customer-facing complexity.

---

# 2. Goals

## 2.1 Product goals

The prototype must demonstrate that Redcare can:

1. give customers more useful delivery information earlier in the funnel;
2. show precise predictions only when the model is sufficiently trustworthy;
3. preserve a safe fallback when it is not;
4. avoid exposing fulfilment complexity in the basket;
5. preserve the existing Shop Apotheke delivery-choice hierarchy in checkout;
6. support split shipments without redesigning the entire checkout;
7. make lead-time differences visible so the customer can make an informed choice;
8. preserve the original confirmed promise after purchase;
9. proactively communicate a changed ETA before the customer needs to create a WISMO contact;
10. feel visually native to Shop Apotheke rather than like a separate concept product.

## 2.2 Prototype goals

The submitted build must be deterministic enough that reviewers can test it themselves by:

- switching among known postcodes;
- viewing multiple products;
- creating both single- and split-shipment baskets;
- choosing home delivery or pickup;
- comparing delivery times across eligible delivery options;
- viewing pre-built on-time and delayed orders;
- opening the proactive delay-email preview.

No hidden demo-control panel is required. The system should react through normal customer actions.

---

# 3. Non-goals

The prototype will **not**:

- implement a production ML model;
- call Redcare production APIs;
- implement real inventory, WMS, OMS or carrier integrations;
- process a real payment;
- send real email;
- reproduce every Shop Apotheke screen or feature;
- calculate shipping economics for the customer;
- label pickup as `recommended` or expose internal cost advantages;
- expose model confidence, prediction intervals, calibration or warehouse identifiers in customer-facing UI;
- implement a complete parcel-shop map backend;
- claim that the fictional fulfilment assignment of any demo SKU reflects Redcare's actual operation.

---

# 4. Source-of-truth hierarchy

When requirements conflict, use this order:

1. this specification;
2. the agreed product design in `docs/DESIGN.md`;
3. the Redcare case-study requirements;
4. the current Shop Apotheke interaction patterns captured during discovery;
5. implementation convenience.

Prototype-only assumptions must remain clearly separable from claims about Redcare's real systems.

---

# 5. Product invariants

These are hard rules. Implementation may change, but these behaviors may not.

### INV-1 — no postcode, no false precision
If a customer location is not known, use the approved fallback estimate.

### INV-2 — low-confidence predictions never become precise customer promises
A raw model result may exist and still be hidden by product policy.

### INV-3 — the UI never reads raw model output directly
Every customer-facing delivery date comes through the delivery-promise policy layer.

### INV-4 — basket remains basket-level
The basket may internally contain multiple fulfilment groups but must not display `Lieferung 1 / 2` or warehouse logic.

### INV-5 — checkout preserves delivery-choice hierarchy
The customer chooses **home vs pickup first**. Provider / carrier / pickup point choices are subordinate to that choice.

Do not show `DHL nach Hause` and `Hermes PaketShop` as peer choices in one flat list.

### INV-6 — split shipment is a fulfilment result, not a customer-created concept
The fulfilment planner determines whether the order contains one or more shipments. The UI explains that plan simply.

### INV-7 — initial destination choice is inherited
If checkout produces two shipments, both inherit the customer's order-level delivery method and destination by default. Extra choices appear only if the customer explicitly changes one shipment.

### INV-8 — confirmed promise is immutable
After order confirmation, new ETA information may not overwrite the original customer promise.

### INV-9 — delayed means delayed
If the current ETA extends beyond the confirmed promise, the UI must acknowledge a delay and show the new ETA.

### INV-10 — delivery dates respect the delivery calendar
For this prototype, deliveries occur Monday–Friday and no later than 18:00. Weekends and applicable public holidays are not customer promise dates.

### INV-11 — failure is safe
A missing prediction, unsupported postcode, low-confidence output or prediction-service failure must never block shopping or checkout. The customer receives the fallback promise.

### INV-12 — no operational persuasion in delivery choice
Pickup may be operationally cheaper, but the prototype does not tell the customer to choose it for Redcare's benefit. The customer sees the service and lead-time difference and chooses.

---

# 6. Terminology

| Term | Definition in this prototype |
|---|---|
| **Raw prediction** | Model-like output for a product/postcode combination before product-policy gating |
| **Prediction interval** | Lower and upper model-derived business-day bounds plus mean prediction |
| **Confidence** | Data-owned score indicating whether the model result is safe enough to expose precisely; mocked in this prototype |
| **Fallback** | Existing broad `1–3 Werktage` experience used when precision is unavailable or not trusted |
| **Estimate** | Pre-purchase customer-facing delivery information that may change as more context becomes available |
| **Confirmed promise** | Delivery commitment frozen when the order is confirmed |
| **Current ETA** | Best current estimate after fulfilment starts; may change with events |
| **Promise breach** | `current ETA latest date > confirmed promise latest date` |
| **Fulfilment group** | Backend grouping used to decide whether items can travel in the same shipment |
| **Shipment** | One parcel / fulfilment unit shown to the customer after checkout has a shipment plan |
| **Home** | Delivery to a customer address |
| **Pickup / PUDO** | Delivery to a parcel shop, Packstation, branch or eligible Now! pickup location |

---

# 7. Prototype system boundary

The prototype is client-side, but it must be architected as if the UI consumes domain services.

```text
Customer UI
    |
    v
Delivery Promise Facade
    |
    +--> Mock Prediction API
    |      raw mean + lower/upper bounds + confidence
    |
    +--> Promise Policy
    |      precise vs fallback
    |
    +--> Business Calendar / Cut-off
    |      business-day dates
    |
    +--> Fulfilment Planner
    |      one vs multiple shipments
    |
    +--> Delivery Options
           home / pickup -> provider/location -> promise
```

The React components must consume the facade/domain results, not the raw prediction matrix.

---

# 8. Demo catalogue and locations

## 8.1 Products

Use five products visible in or consistent with the current Shop Apotheke experience.

| ID | Product | Demo fulfilment | Model eligible |
|---|---|---|---:|
| `voltaren` | Voltaren Schmerzgel forte 23,2 mg/g Gel mit Diclofenac | Sevenum | yes |
| `vitamin-d3` | Vitamin D3 2000 I.E. VIGANTOLVIT Weichkapseln | Sevenum | yes |
| `fenistil` | Fenistil Kühl Roll-on | Sevenum | yes |
| `ibu` | Ibu-ratiopharm 400 mg akut Schmerztabletten | Sevenum | yes |
| `vagisan` | Vagisan FeuchtCreme | **external demo fulfilment** | no |

**Important:** the `vagisan` fulfilment assignment is intentionally fictional and exists only to exercise the unsupported-model / split-shipment path. The UI must not claim where the product is really fulfilled.

## 8.2 Postcodes

| Postcode | City | Region purpose in demo |
|---|---|---|
| `50667` | Köln | close / fast Sevenum lane |
| `60311` | Frankfurt | western-central / fast lane |
| `22083` | Hamburg | northern / mixed 1–2 and 2–3 behavior |
| `10115` | Berlin | eastern / mixed and sometimes longer |
| `80331` | München | southern / mixed, slower and low-confidence example |

Unknown postcodes must use fallback rather than error.

---

# 9. Raw prediction contract

The mocked Data API returns numeric model-like outputs. It must **not** return customer labels such as `1–2 days`.

```ts
export type DeliveryPrediction = {
  productId: string
  postcode: string
  meanBusinessDays: number
  lowerBusinessDays: number
  upperBusinessDays: number
  confidenceScore: number
  modelVersion: string
}
```

`lowerBusinessDays` and `upperBusinessDays` represent quantile-derived model bounds. The exact production quantiles are Data-owned and intentionally not asserted by this prototype.

`confidenceScore` represents a calibrated Data-owned confidence signal. The prototype consumes it; the frontend does not invent confidence from the mean.

### 9.1 Prototype confidence threshold

```ts
MIN_PRECISE_CONFIDENCE = 0.90
```

This number is a **prototype assumption**, not a Redcare recommendation. It exists to demonstrate the product behavior.

### 9.2 Raw demo matrix

Values below are fictional prototype data, designed only to produce geographically sensible scenarios.

Format: `mean / lower / upper / confidence` in business days.

| Product | Köln 50667 | Frankfurt 60311 | Hamburg 22083 | Berlin 10115 | München 80331 |
|---|---|---|---|---|---|
| Voltaren | `1.1 / 0.6 / 1.6 / .97` | `1.2 / 0.7 / 1.7 / .96` | `1.4 / 0.9 / 1.9 / .95` | `1.9 / 1.1 / 2.6 / .95` | `2.1 / 1.2 / 2.8 / .94` |
| Vitamin D3 | `1.2 / 0.7 / 1.8 / .96` | `1.3 / 0.8 / 1.9 / .96` | `1.8 / 1.1 / 2.4 / .94` | `2.0 / 1.2 / 2.7 / .93` | `2.4 / 1.4 / 3.4 / .86` |
| Fenistil | `1.2 / 0.8 / 1.9 / .96` | `1.3 / 0.9 / 1.9 / .95` | `1.9 / 1.2 / 2.5 / .94` | `3.2 / 2.1 / 4.2 / .94` | `3.5 / 2.2 / 4.6 / .93` |
| Ibu-ratiopharm | `1.0 / 0.6 / 1.5 / .98` | `1.1 / 0.7 / 1.6 / .97` | `1.4 / 0.9 / 1.9 / .96` | `1.8 / 1.1 / 2.4 / .95` | `2.0 / 1.2 / 2.6 / .94` |
| Vagisan | no model result | no model result | no model result | no model result | no model result |

This yields deliberate demo cases:

- Köln / Frankfurt are predominantly precise 1–2-day style windows;
- Hamburg mixes faster and 2–3-day style windows;
- Berlin / München contain longer predictions;
- `Vitamin D3 + 80331` has a valid raw prediction but fails confidence gating;
- `Vagisan` is unsupported and therefore always follows fallback / external fulfilment logic.

---

# 10. Promise policy

## 10.1 Eligibility

A precise product promise may be created only if:

1. postcode is present;
2. postcode is in the supported demo matrix;
3. product is model-eligible;
4. a raw prediction exists;
5. `confidenceScore >= MIN_PRECISE_CONFIDENCE`;
6. the prediction service did not fail.

Otherwise use fallback.

## 10.2 Build the business-day window

The model returns continuous lower/upper bounds. Product policy converts them into conservative customer-facing business-day bounds.

Prototype rule:

```ts
minBusinessDays = Math.max(1, Math.ceil(lowerBusinessDays))
maxBusinessDays = Math.max(minBusinessDays, Math.ceil(upperBusinessDays))
```

Examples:

- `0.6–1.6` -> `1–2` business days
- `1.1–2.6` -> `2–3` business days
- `2.1–4.2` -> `3–5` business days

The UI never shows these abstract buckets if it can show calendar dates. They are an intermediate product-policy representation.

## 10.3 Fallback

Fallback is:

> `Lieferung in 1–3 Werktagen`

Use fallback for:

- no postcode;
- unknown postcode;
- unsupported fulfilment;
- missing prediction;
- confidence below threshold;
- prediction-service error.

Fallback must still allow add-to-basket and checkout.

## 10.4 API failure

The mocked prediction service must expose an error path in tests, even if there is no customer-facing demo control.

On failure:

- render fallback;
- do not show an error toast about the prediction system;
- do not block the transaction;
- record an internal diagnostic event.

---

# 11. Delivery calendar and cut-off

## 11.1 Delivery calendar

Prototype rule:

- delivery days: Monday–Friday;
- latest promised delivery time: 18:00;
- Saturday and Sunday are non-delivery days;
- applicable German public holidays are non-delivery days;
- destination postcode determines the German state used for holiday calculation where relevant;
- all displayed dates use German locale formatting.

The same calendar service must be used on PDP, basket, checkout, confirmation and tracking.

## 11.2 Customer-facing cut-off

Prototype assumption:

- carrier / operational cut-off: 23:00;
- packing / processing requirement: 3 hours;
- safety buffer: 1 hour;
- customer-facing cut-off: **19:00 Europe/Berlin**.

Before purchase, where applicable:

> `Bei Bestellung bis 19:00`

If current time is after the customer-facing cut-off, the effective dispatch start shifts to the next business day before the delivery window is calculated.

## 11.3 Missed cut-off after confirmation

Once an order is confirmed, missing an internal cut-off does **not** permit rewriting the promise.

It creates a later current ETA. If that ETA exceeds the confirmed promise, the order becomes delayed and triggers the proactive-delay experience.

---

# 12. Product Detail Page specification

## 12.1 Entry state — postcode unknown

Match the current Shop Apotheke delivery block closely.

Required copy:

> **Lieferung in 1–3 Werktagen**

> **Ihre PLZ**

The customer can enter/change postcode using the existing location interaction pattern.

## 12.2 Postcode known + precise prediction

Replace only the delivery information; do not introduce a new card or technical explanation.

Required structure:

> **Voraussichtliche Lieferung: [calendar range]**

> `Bei Bestellung bis 19:00`

> `[postcode]`

Example:

> **Voraussichtliche Lieferung: Fr., 11. – Mo., 14. Sept.**

> Bei Bestellung bis 19:00

## 12.3 Postcode known + fallback

Keep the normal broad message:

> **Lieferung in 1–3 Werktagen**

The postcode remains visible so the customer understands that location has been set.

Do not render `low confidence`, `unsupported`, `model unavailable` or similar customer-facing explanations.

## 12.4 PDP acceptance criteria

- changing among the five demo postcodes changes the result according to the matrix;
- `Vitamin D3 + 80331` falls back despite having a raw model result;
- `Vagisan + any postcode` falls back;
- unknown postcode falls back safely;
- displayed precise dates skip weekends and holidays;
- after the cut-off, dates shift correctly;
- raw model values are never visible.

---

# 13. Basket specification

## 13.1 Design intent

The basket should answer:

> **When should I expect this order if I continue now?**

It should not explain fulfilment topology.

## 13.2 Basket promise calculation

For every basket item, resolve its product promise using the active postcode.

The basket envelope is:

- earliest = earliest minimum date among item promises;
- latest = latest maximum date among item promises.

If one item uses fallback, its fallback dates participate normally in the envelope.

If an external item will later produce a separate shipment, the basket still displays only the overall order envelope.

## 13.3 Basket UI

Preserve the current basket layout. Add a compact delivery summary inside the `Versand durch Shop Apotheke` order section, not a new complex module.

Required content:

> **Voraussichtliche Lieferung: [overall date range]**

Show the cut-off line only when it is valid for the whole displayed basket promise. If one fulfilment group cannot support that cut-off, omit the cut-off rather than imply false precision.

Do **not** show:

- shipment count;
- warehouse / fulfilment node;
- which item causes the later date;
- carrier selection.

## 13.4 Basket acceptance criteria

- a basket with only Sevenum items remains one simple delivery summary;
- adding the external demo item can widen the overall range but does not reveal the split;
- removing the external item recalculates the range;
- the basket uses the same date engine as PDP;
- checkout receives the same basket state without recomputing from unrelated mock values.

---

# 14. Fulfilment planning

The fulfilment planner runs before checkout shipping options are rendered.

Prototype rule:

```text
all items in Sevenum fulfilment group -> one shipment
external demo fulfilment item present -> separate shipment
```

This is intentionally simple. It demonstrates the concept without pretending to implement Redcare's real OMS.

For the canonical split demo basket:

- Shipment 1: Sevenum items
- Shipment 2: Vagisan external demo item

The customer never sees the fulfilment-node names.

---

# 15. Checkout destination hierarchy

The prototype must preserve the current Shop Apotheke conceptual hierarchy captured in the reference screenshots.

## 15.1 Level 1 — destination method

Customer chooses:

1. **An eine Lieferadresse** — home delivery
2. **An einen Abholort** — pickup / PUDO

This selection is initially order-level.

## 15.2 Home path

Customer selects / confirms the delivery address.

At the shipping step, eligible home carriers may be shown, for example:

- DHL
- Hermes

Each carrier shows its own delivery date/window.

## 15.3 Pickup path

Customer chooses `An einen Abholort` and opens an existing-style station selector.

Supported demo station types:

- Hermes PaketShop
- DHL Paketshop / Filiale
- DHL Packstation
- eligible Now! pickup location

Selecting a station determines the provider/location for that pickup choice. The customer is not then asked to choose an unrelated home carrier.

## 15.4 PUDO economics

Pickup may be cheaper operationally, but this is backend/business knowledge only.

The UI may make a pickup option attractive because its **actual service information** is better, e.g. an earlier collection date. It may not use `recommended`, `cheaper for us`, `help us save cost`, or equivalent steering copy.

---

# 16. Delivery-option timing

Delivery-option promises are calculated after the shipment and destination method are known.

The model output provides the baseline product/shipment delivery distribution. Mock delivery-option rules may create different timings for:

- DHL home;
- Hermes home;
- Hermes PaketShop;
- DHL Paketshop / Filiale;
- DHL Packstation;
- Now! pickup when eligible.

Standard PUDO must **not** be hard-coded as universally faster. In the demo it should usually be similar to home delivery. A faster pickup scenario should come from a specific mocked option such as eligible Now! pickup or a specific provider/location result.

The customer sees those different dates and decides.

---

# 17. Checkout — single-shipment behavior

If the fulfilment planner returns one shipment, keep the current shipping-selection pattern.

Example for home delivery:

> **Standard mit DHL**  
> Lieferzeitraum: Do., 10. – Fr., 11. September

> **Standard mit HERMES**  
> Lieferzeitraum: Fr., 11. – Mo., 14. September

The customer selects a carrier using the current radio-button interaction.

For pickup, show the selected pickup point and its pickup availability / date.

---

# 18. Checkout — split-shipment behavior

## 18.1 Design objective

Support the better product outcome — sending available items earlier — **without replacing the existing checkout model**.

## 18.2 Header

When the fulfilment planner returns multiple shipments, add one simple explanation:

> **Ihre Bestellung kommt in 2 Lieferungen**

> So können verfügbare Artikel früher bei Ihnen ankommen.

## 18.3 Shipment cards

Render one shipping-options block per shipment using the existing visual language.

Each shipment block contains:

- `Lieferung 1 von 2` / `Lieferung 2 von 2`;
- small product summary / thumbnails;
- inherited destination method;
- inherited home address or pickup point;
- `Lieferart ändern`;
- valid provider / carrier options for that method;
- a delivery / pickup date for each option.

## 18.4 Inheritance rule

The order-level destination choice applies to **all shipments by default**.

The customer is not forced to configure two parcels separately just because Redcare created two shipments.

## 18.5 Per-shipment override

If the customer clicks `Lieferart ändern` on one shipment, reopen the same destination hierarchy **scoped to that shipment**:

- home -> select address -> home carrier choices;
- pickup -> select station -> pickup provider/location and collection date.

Canonical demo end state:

- Shipment 1 -> pickup at a selected Hermes/DHL/Now! location
- Shipment 2 -> home address

This capability is a prototype assumption. Keep it behind a capability flag:

```ts
PER_SHIPMENT_DESTINATION_OVERRIDE = true
```

If disabled, the same design must still work with one order-level destination applied to every shipment.

## 18.6 Split acceptance criteria

- adding the external demo product creates two shipments at checkout;
- the basket before checkout still showed one overall window;
- both shipments inherit the original destination method;
- changing shipment 1 to pickup does not change shipment 2;
- pickup station selection follows the pickup flow, not a flat carrier list;
- home delivery continues to offer home carriers;
- each shipment displays its own date/window;
- no warehouse names are visible.

---

# 19. NOW! pickup

Use NOW! only as a targeted demo capability, not a universal PUDO rule.

At least one product/postcode combination may be configured as Now!-eligible. Recommended canonical case:

- `Voltaren + 22083 Hamburg`

Customer-facing behavior should follow the current interaction pattern, e.g.:

> **Abholung heute möglich**

Eligibility is mock data and must be isolated from the core promise model.

If Now! is unavailable, standard pickup options remain.

---

# 20. Checkout completion and confirmation

The prototype does not process real payment. It may use a minimal static payment/review step so that the current checkout stepper can remain visually coherent.

At final confirmation, create an order fixture from the selected shipment plan.

For each shipment freeze:

```ts
export type ConfirmedShipment = {
  shipmentId: string
  productIds: string[]
  deliveryMethod: 'home' | 'pickup'
  providerId: string
  destinationLabel: string
  confirmedPromiseMin: string
  confirmedPromiseMax: string
  currentEtaMin: string
  currentEtaMax: string
  status: 'confirmed' | 'preparing' | 'in_transit' | 'delivered'
}
```

`confirmedPromiseMin/Max` are immutable after order creation.

On the confirmation page show one promise per shipment if the order is split.

---

# 21. Tracking state model

Tracking uses pre-built orders so the review can demonstrate post-purchase states without hidden controls.

Required demo orders:

| Order | State | Purpose |
|---|---|---|
| `#100421` | on time | current ETA remains within promise |
| `#100422` | delayed | current ETA is later than confirmed promise |
| `#100423` | split | shipment 1 delivered; shipment 2 in transit |
| `#100424` | delivered | completed normal order |

Dates should be generated relative to the demo clock / current date so the prototype does not become obviously stale.

## 21.1 Delay rule

```ts
isDelayed = currentEtaMax > confirmedPromiseMax
```

The original promise remains stored even when delayed.

## 21.2 On-time UX

Show current delivery expectation and normal tracking timeline.

## 21.3 Delayed UX

Lead with:

> **Ihre Lieferung verspätet sich**

> Neuer Liefertermin: **[new ETA]**

Secondary context:

> Ursprünglich angekündigt: [confirmed promise]

Then show the normal tracking timeline below.

Do not simply replace the old date with the new one.

## 21.4 Split tracking

For a split order, show each shipment separately with its own:

- status;
- provider;
- confirmed promise;
- current ETA;
- tracking timeline.

A delay in one shipment does not make an already delivered shipment appear delayed.

---

# 22. Proactive delay email

## 22.1 Trigger

A delay notification becomes eligible when:

```ts
currentEtaMax > confirmedPromiseMax
```

The prototype does not send an email. It renders an HTML preview from the **same order data** used by tracking.

No separate hard-coded email dates are permitted.

## 22.2 Route

Example:

```text
/email-preview/100422
```

## 22.3 Email content

Match the visual language of the provided Shop Apotheke registration email:

- Shop Apotheke header;
- restrained peach / red brand treatment;
- short headline;
- new delivery date prominently shown;
- original promised date as context;
- reassurance that no action is required;
- `Sendung verfolgen` CTA;
- familiar support/contact footer block.

Suggested copy:

> **Ihre Lieferung verspätet sich**
>
> Guten Tag Daniel Roiz,
>
> leider kommt Ihre Bestellung später als ursprünglich erwartet.
>
> **Neuer Liefertermin**  
> [new ETA]
>
> Ursprünglich angekündigt: [confirmed promise]
>
> Sie müssen nichts tun. Wir halten Sie über den weiteren Verlauf Ihrer Lieferung auf dem Laufenden.

The point of the email is to get in front of WISMO, not to explain the logistics failure.

---

# 23. Operational disruption behavior

Operational disruption is modeled only after order confirmation.

When a disruption changes the ETA:

1. update `currentEtaMin/Max`;
2. preserve `confirmedPromiseMin/Max`;
3. recompute `isDelayed`;
4. if delayed, show the tracking delay state;
5. make the delay-email preview available.

Before purchase, an equivalent disruption should only change the estimate. It is not a broken promise yet.

---

# 24. Customer-facing copy rules

All primary prototype UI is German.

### Use

- `Lieferung in 1–3 Werktagen`
- `Voraussichtliche Lieferung`
- `Bei Bestellung bis 19:00`
- `An eine Lieferadresse`
- `An einen Abholort`
- `Lieferzeitraum`
- `Lieferart ändern`
- `Ihre Bestellung kommt in 2 Lieferungen`
- `Ihre Lieferung verspätet sich`
- `Neuer Liefertermin`
- `Ursprünglich angekündigt`

### Do not use customer-facing

- confidence score;
- q10/q50/q90;
- model probability;
- Sevenum;
- warehouse ID;
- fallback reason;
- calibration;
- fulfilment group;
- SLA jargon;
- Redcare cost-to-serve rationale.

---

# 25. Visual design requirements

The goal is **Shop Apotheke fidelity**, not a redesign.

Reference patterns captured during discovery:

- Shop Apotheke red logo / CTA treatment;
- white page backgrounds with warm off-white / peach content surfaces;
- green delivery and availability text;
- large rounded red buttons;
- rounded white / off-white cards;
- thin neutral borders;
- existing checkout stepper: Adresse / Versand / Zahlung / Prüfen;
- existing radio-button selection patterns;
- existing pickup station modal structure;
- existing carrier rows with `Lieferzeitraum` beneath the provider name.

The delivery-promise feature should appear to be an incremental product improvement inside the current site.

No custom dashboard styling, model visualizations, confidence chips or additional UI chrome.

---

# 26. Accessibility and responsive behavior

Even though this is a prototype:

- all interactive controls must be keyboard reachable;
- radio choices must use semantic inputs or equivalent accessible roles;
- focus state must be visible;
- color must not be the only signal for selected / delayed states;
- delivery dates must be readable as text, not embedded in images;
- desktop is the primary review target, but layouts should not break at tablet width;
- no horizontal scrolling for the core flow.

---

# 27. Internal diagnostics / observability

No analytics backend is required, but domain events should be easy to inspect in development.

Recommended event hooks:

- `postcode_set`
- `delivery_prediction_resolved`
- `delivery_prediction_fallback`
- `delivery_promise_viewed`
- `basket_promise_viewed`
- `shipment_plan_created`
- `delivery_method_selected`
- `carrier_selected`
- `pickup_location_selected`
- `shipment_destination_overridden`
- `order_promise_confirmed`
- `promise_breached`
- `delay_notification_rendered`

Do not log full customer addresses in prototype diagnostics.

---

# 28. Canonical reviewer scenarios

The README must include a concise matrix so reviewers know what they can test without a demo-control panel.

## 28.1 PDP scenarios

| Scenario | Product | Postcode | Expected behavior |
|---|---|---|---|
| Fast precise | Voltaren | `50667` | precise 1–2-style calendar window |
| Fast precise | Ibu-ratiopharm | `60311` | precise 1–2-style window |
| Medium | Vitamin D3 | `22083` | precise 2–3-style window |
| Long | Fenistil | `10115` | precise 3–5-style window |
| Low confidence | Vitamin D3 | `80331` | fallback `1–3 Werktage` |
| Unsupported fulfilment | Vagisan | any known postcode | fallback `1–3 Werktage` |
| Unknown postcode | any | `99999` | fallback safely |

## 28.2 Basket scenarios

### Single shipment

Basket: Voltaren + Ibu-ratiopharm  
Expected: one overall basket window; one shipment at checkout.

### Split shipment

Basket: Voltaren + Vitamin D3 + Vagisan  
Expected: one overall basket window; two shipments revealed at checkout because Vagisan uses the external demo fulfilment group.

## 28.3 Post-purchase scenarios

- `/orders` -> show all four demo orders;
- `#100422` -> delayed tracking state;
- `/email-preview/100422` -> proactive delay email generated from the same order state;
- `#100423` -> split-order tracking with different shipment statuses.

---

# 29. Acceptance criteria — end-to-end

The prototype is complete only when all of the following are true.

## Prediction / policy

- [ ] raw matrix stores numeric model outputs, never customer-facing buckets;
- [ ] precise output requires confidence threshold pass;
- [ ] low-confidence and unsupported cases fall back;
- [ ] unknown postcode falls back;
- [ ] prediction failure falls back without blocking the flow.

## Calendar

- [ ] all precise promises resolve to calendar dates;
- [ ] no Saturday or Sunday delivery promise is rendered;
- [ ] German holidays are skipped;
- [ ] after 19:00, pre-purchase promise calculation shifts to the next business-day start;
- [ ] all pages use one calendar implementation.

## PDP

- [ ] postcode change visibly recalculates delivery information;
- [ ] customer never sees confidence/model internals;
- [ ] cutoff is displayed discreetly when applicable.

## Basket

- [ ] basket shows one overall promise envelope;
- [ ] basket does not reveal split shipment;
- [ ] mixed basket can widen the promise correctly.

## Checkout

- [ ] home vs pickup is the first-level destination decision;
- [ ] home path offers home carrier choices with lead times;
- [ ] pickup path uses pickup location/provider selection;
- [ ] split order repeats the existing shipping pattern by shipment rather than creating a new checkout model;
- [ ] both shipments inherit the original destination method;
- [ ] changing one shipment's destination does not alter the other;
- [ ] standard PUDO is not automatically presented as faster;
- [ ] a specifically eligible Now! pickup can be faster and is shown through its date/service only.

## Confirmation / tracking

- [ ] confirmation freezes one promise per shipment;
- [ ] current ETA is stored separately;
- [ ] delayed ETA does not overwrite confirmed promise;
- [ ] delayed tracking shows both new ETA and original promise;
- [ ] split tracking treats shipments independently.

## Email

- [ ] delay email uses the same order state as tracking;
- [ ] email is an HTML preview only;
- [ ] no duplicate hard-coded promise/ETA dates exist;
- [ ] email visually resembles existing Shop Apotheke communications.

## UX quality

- [ ] no customer-facing model or fulfilment jargon;
- [ ] no demo-control panel;
- [ ] current Shop Apotheke design patterns are recognisable;
- [ ] core walkthrough can be completed comfortably within the 15-minute review window.

---

# 30. Required automated tests before implementation is considered complete

The implementation plan must include tests for at least these behaviors:

1. high-confidence raw prediction -> precise business-day window;
2. low-confidence raw prediction -> fallback;
3. unsupported product -> fallback;
4. unknown postcode -> fallback;
5. API exception -> fallback;
6. Thursday + 2–3 business days skips weekend correctly;
7. public holiday is skipped;
8. after-cutoff calculation shifts effective start;
9. basket envelope combines multiple item promises;
10. basket does not expose shipment plan in its view model;
11. external demo item creates second shipment;
12. split shipments inherit initial order-level destination;
13. per-shipment override mutates only the targeted shipment;
14. pickup and home options preserve the method -> provider hierarchy;
15. order confirmation freezes promise;
16. ETA change inside promise is not delayed;
17. ETA beyond promise creates delayed state;
18. delay email renders dates from tracking/order state, not independent fixtures.

---

# 31. Open assumptions to validate during implementation planning

These are intentionally explicit rather than silently invented.

1. **Per-shipment destination override:** prototype will support it because it demonstrates a better split-shipment experience, but Redcare OMS capability is unknown.
2. **19:00 customer cut-off:** illustrative assumption derived from a 23:00 operational cut-off, 3-hour processing requirement and 1-hour buffer.
3. **Confidence threshold 0.90:** demo policy only; production threshold would be defined with Data / Last Mile based on calibration and customer-risk tolerance.
4. **External fulfilment assignment:** Vagisan is external only in the fictional demo data.
5. **NOW! eligibility:** mocked for selected combinations only; no claim about actual product/postcode coverage.
6. **Carrier timing:** provider-specific demo timing is fictional and exists to demonstrate that the UI can show different lead times without telling the customer which option to prefer.
7. **Public-holiday source:** implementation plan must choose a deterministic Germany holiday library or local fixture strategy.

None of these assumptions should block the implementation plan; each must remain isolated so it can be changed without redesigning the whole prototype.

---

# 32. Definition of ready for implementation plan

This spec is ready to become an implementation plan when:

- product scope and non-goals are accepted;
- the five-product / five-postcode demo matrix is accepted;
- the home -> carrier and pickup -> location hierarchy is accepted;
- the split-shipment inheritance/override behavior is accepted;
- the business-day/cut-off assumptions are accepted;
- the estimate -> confirmed promise -> current ETA state model is accepted;
- the canonical demo scenarios are accepted.

The implementation plan should then break this specification into small, test-first tasks with exact files, tests, validation steps and commit boundaries. It should not redesign the product while coding.
