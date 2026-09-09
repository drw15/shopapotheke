# Delivery Promise Experience — Product Design

## Purpose

This prototype explores how Shop Apotheke could replace the broad `1–3 working days` message with a more precise delivery promise **without adding complexity to the customer UI**.

The core product idea is simple:

> Make the delivery information customers already see smarter as Redcare learns more about the order.

The operational and model complexity stays behind the UI.

---

## Product principles

### 1. Precision only when we can trust it

The customer never sees model confidence, quantiles, warehouse IDs, carrier logic, or fallback reasons.

If the prediction passes the agreed calibration / confidence policy, show a precise calendar-date window.

If it does not, fall back to the existing safe estimate.

### 2. Use calendar dates, not abstract lead-time buckets

Customer-facing copy should answer the real question: **when will I get it?**

Preferred:

> Voraussichtliche Lieferung: Fr., 11. – Mo., 14. Sept.

Not:

> 1–2 working days

The bucket is derived from model outputs in the backend and then translated into valid delivery dates.

### 3. Keep the funnel simple

The prototype should preserve the current Shop Apotheke interaction model as much as possible.

- PDP: product-level estimate
- Basket: overall basket estimate
- Checkout: actual fulfilment / shipment promise and delivery-method choice
- Confirmation: confirmed promise
- Tracking: current ETA versus original promise

### 4. Estimate, promise, and ETA are different states

**Estimate**
- Used before purchase
- Can change as Redcare learns more

**Confirmed promise**
- Frozen when the order is accepted
- Becomes the baseline against which promise accuracy is measured

**Current ETA**
- Can change as warehouse and carrier events arrive
- Never overwrites the original confirmed promise

### 5. Proactively communicate when the ETA moves beyond the promise

If the current ETA becomes later than the confirmed promise, the customer should see a clear delay state and receive a proactive notification.

The goal is to answer the WISMO question before the customer needs to contact Customer Service.

---

# Customer journey

## 1. Product Detail Page (PDP)

### Current-state behavior to preserve

Before the customer provides a postcode:

> Lieferung in 1–3 Werktagen

> Ihre PLZ

### After postcode entry

The delivery-promise service evaluates the product × postcode prediction.

If the result passes the calibration threshold:

> Voraussichtliche Lieferung: Fr., 11. – Mo., 14. Sept.

> Bei Bestellung bis 19:00

> 22083

If the result does not pass the threshold:

> Lieferung in 1–3 Werktagen

The UI should not explain why the precise prediction was not shown.

### Design intent

The feature should feel like a smarter version of the current delivery line, not a new product module.

---

## 2. Basket

The basket should stay simple.

At this point Redcare knows the full product mix, but the customer does not need to see warehouse or shipment-group complexity yet.

Show the overall order envelope:

> Voraussichtliche Lieferung: Fr., 11. – Mi., 16. Sept.

> Bei Bestellung bis 19:00

The basket may internally already contain multiple fulfilment groups, but it should not yet show `Parcel 1` / `Parcel 2`.

### Design intent

The basket answers:

> When should I expect this order if I continue now?

It does not explain how Redcare will fulfil it.

---

## 3. Checkout — address / fulfilment method

Keep the existing hierarchy:

1. Customer chooses **home delivery** or **pickup / PUDO**.
2. The available carrier / location choices depend on that method.

Do not invert this hierarchy.

### Home delivery

Customer chooses an address first.

### Pickup / PUDO

Customer chooses `An einen Abholort`, then selects a location using the existing-style station picker.

Possible station types in the prototype:

- Hermes PaketShop
- DHL Paketshop / Filiale
- DHL Packstation
- Now! pickup when eligible

---

## 4. Checkout — shipping options

### Single-shipment order

Keep the current carrier-choice pattern.

Example:

**Standard mit DHL**

> Lieferzeitraum: Fr., 11. – Mo., 14. Sept.

**Standard mit HERMES**

> Lieferzeitraum: Mo., 14. – Di., 15. Sept.

The customer chooses the option based on the information shown.

The UI should not label a PUDO option as `Recommended`, should not mention Redcare's cost advantage, and should not try to steer with internal economics.

### Split-shipment order

When the fulfilment plan contains multiple parcels, keep the checkout structure but repeat the delivery-options block by shipment.

Top-level copy:

> Ihre Bestellung kommt in 2 Lieferungen

> So können verfügbare Artikel früher bei Ihnen ankommen.

Then show:

### Lieferung 1 von 2
- Products in shipment 1
- Current fulfilment method
- Current address / pickup point
- `Lieferart ändern`
- Existing-style carrier options for that shipment

### Lieferung 2 von 2
- Products in shipment 2
- Current fulfilment method
- Current address / pickup point
- `Lieferart ändern`
- Existing-style carrier options for that shipment

### Default behavior

The customer's initial fulfilment choice should apply to all shipments by default.

The customer should only make an additional decision if they choose to change the delivery method for an individual shipment.

This avoids forcing extra complexity into every checkout.

### Optional per-shipment method override

A customer may choose, for example:

- Shipment 1 → pickup / PUDO
- Shipment 2 → home delivery

This is a prototype assumption. If Redcare's OMS cannot support delivery-method selection independently per split shipment, the design should collapse to one order-level delivery method while keeping the same promise logic.

---

## 5. Cutoff behavior

The prototype should show a small cutoff line wherever it is useful before purchase.

Prototype assumption:

- Operational carrier cutoff: 23:00
- Packing / processing requirement: 3 hours
- Safety buffer: 1 hour
- Customer-facing cutoff: 19:00

Example:

> Bei Bestellung bis 19:00

If the cutoff is missed before purchase, the estimate is recalculated and the customer sees the later delivery date before placing the order.

If Redcare misses an operational cutoff **after** the order has been confirmed, that is a delay. The original promise is not rewritten.

---

## 6. Order confirmation

At confirmation the estimate becomes a confirmed promise.

Example:

> Bestellung bestätigt

> Voraussichtliche Lieferung: Montag, 14. September

For a split order, show one confirmed promise per shipment.

The confirmed promise is immutable in the prototype data model.

---

## 7. Tracking

The prototype should include a `Meine Bestellungen` area with prebuilt orders.

Recommended demo states:

- On time
- Delayed
- Split order: one parcel delivered, one in transit
- Fully delivered

### On-time order

Show the current ETA normally.

### Delayed order

If `current ETA > confirmed promise`, show a clear delay state:

> Ihre Lieferung verspätet sich

> Neuer Liefertermin: Dienstag, 15. September

Secondary text:

> Ursprünglich angekündigt: Montag, 14. September

The original promise remains stored and visible as historical context.

---

## 8. Proactive delay email

The prototype should include an HTML email preview driven by the same order state as tracking.

Suggested structure, matching the visual language of existing Shop Apotheke emails:

- Shop Apotheke header
- Short headline
- New delivery date
- Original promised date
- Reassurance that no action is required
- `Sendung verfolgen` CTA
- Existing-style support / contact block

Example copy:

> Ihre Lieferung verspätet sich

> Guten Tag Daniel Roiz,
>
> leider kommt Ihre Bestellung später als ursprünglich erwartet.
>
> Neuer Liefertermin: Dienstag, 15. September
>
> Ursprünglich angekündigt: Montag, 14. September
>
> Sie müssen nichts tun. Wir halten Sie über den weiteren Verlauf Ihrer Lieferung auf dem Laufenden.

The prototype does not actually send email. It renders a preview from the same `confirmedPromise` and `currentEta` data used by the tracking experience.

---

# Visual design direction

The prototype should feel native to the current Shop Apotheke site rather than like a redesigned concept.

Use the current visual language:

- Shop Apotheke red for CTAs and active controls
- Dark body text
- Green delivery / availability messaging
- Warm off-white / pale peach surfaces
- White cards
- Thin light-grey borders
- Large rounded primary buttons
- Rounded cards and form controls
- Generous whitespace

Do not add unnecessary badges, recommendation labels, model explanations, tooltips, confidence percentages, warehouse names, or logistics jargon.

---

# Product decision the prototype should demonstrate

> We are not adding a new delivery-prediction feature to the interface. We are improving the delivery information customers already see, only when we have enough confidence to do so.

The customer experience should get simpler as the backend logic becomes more sophisticated.
