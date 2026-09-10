# Implementation Handoff — Shop Apotheke Delivery Promise Prototype

**Purpose:** Give an implementation agent enough context to execute the approved prototype without relying on the original ChatGPT conversation.

**Read before coding:**

1. `docs/PRD.md`
2. `docs/superpowers/specs/2026-09-10-delivery-promise-design.md`
3. `docs/reference/shop-apotheke-reference-screenshots/`
4. `docs/superpowers/plans/2026-09-10-delivery-promise-implementation-index.md`
5. the relevant implementation plan
6. `AGENTS.md`

This handoff explains the intent behind the plan and the important decisions that are easiest to lose during implementation.

---

## 1. What the assignment is really testing

The prototype is not primarily a frontend exercise. It is meant to show product judgment around delivery promises in an e-pharmacy context.

The case asks how Redcare should use a new delivery-prediction capability when the model can sometimes produce faster promises and sometimes slower but more realistic ones. The product tension is between short-term conversion and long-term trust.

The prototype must therefore demonstrate:

- more precision where justified;
- restraint where not justified;
- progressive precision through the funnel;
- operational/system thinking behind a simple UI;
- honest post-purchase handling of broken promises;
- a native Shop Apotheke experience rather than an invented redesign.

A visually impressive prototype that ignores those rules is the wrong outcome.

---

## 2. The single most important product idea

> **All complexity stays behind the UI.**

The customer should not need to understand how the prediction was generated.

The model can use product, postcode, delivery method, carrier, time, basket context, fulfilment context, and operational state. Product policy can use confidence, calibration, support, cutoffs, and calendars. Fulfilment can create one or two shipments.

The customer should still mostly see:

- when an item/order will arrive;
- which standard delivery option they are choosing;
- whether there will be one or two deliveries when that matters;
- whether the original promise is still valid after purchase.

Do not surface internal complexity simply because it exists in the mock domain.

---

## 3. Why the model contract looks the way it does

The prototype assumes the Data/API layer can produce carrier/service-specific prediction distributions.

This is intentional. The model should not predict a generic 1.4-day lead time and then have Product add `+0.3 for Hermes` or `-0.2 for PUDO`. Carrier/service performance should be part of the prediction input.

The mock result includes:

- mean;
- q10;
- q50;
- q90;
- confidence;
- calibration;
- sample support.

For the prototype, q10 and q90 define the proposed customer window. This is deliberately simple and transparent.

Do **not** interpret that as a production recommendation. The handover must say that the exact quantiles, calibration target, minimum sample, and promise-accuracy policy should be decided jointly by Product, Data, and Last Mile/Operations.

The intended production contract is simpler for UI consumers:

```text
safe_to_expose = true | false
```

The statistical reasoning can remain inspectable for Data while the product/UI layer consumes a safe decision.

---

## 4. Why PDP uses a carrier envelope

At PDP, the customer has not yet chosen DHL or Hermes.

The prototype must not quietly assume a default carrier, and it must not advertise the fastest carrier as though that service were guaranteed.

Therefore:

1. resolve the customer-safe DHL Home promise;
2. resolve the customer-safe Hermes Home promise;
3. take the envelope across both.

If DHL is Friday–Monday and Hermes is Monday–Tuesday, PDP shows Friday–Tuesday.

If DHL is precise but Hermes must fall back to `1–3 Werktage`, the fallback contributes to the upper-funnel promise. Do not ignore the unsafe carrier in order to make the PDP more attractive.

This is a deliberate trust decision.

---

## 5. Why carrier differences should usually disappear after rounding

The raw model fixtures should make DHL and Hermes slightly different most of the time, because carrier is part of the model.

However, the customer should usually see the same rounded window.

Example:

```text
DHL q10/q90    0.8 / 1.85
Hermes q10/q90 0.9 / 1.96
```

Both become 1–2 business days.

Only a small number of deliberately selected combinations should cross a customer-facing boundary. Visible differences between standard DHL and Hermes should remain believable and roughly one business day at most.

The reviewer gets the prediction matrix specifically so they can see that Product is **rounding model differences into understandable customer promises rather than exposing statistical noise**.

---

## 6. Why the cutoff is deterministic

The 19:00 cutoff is not a learned UI effect.

For the prototype it is an illustrative operational rule derived from:

- 23:00 operational/carrier cutoff;
- 3 hours of processing/packing;
- 1 hour safety buffer.

Those numbers are assumptions, not Redcare facts.

The important product behavior is that the cutoff is shown **only if missing it changes the displayed promise**.

Do not render the cutoff everywhere as a conversion trick.

A Friday-to-Monday shift is especially meaningful even though it is one business-day difference, because the customer experiences three calendar days.

---

## 7. Why the basket can show split delivery

An earlier version of the concept hid all split shipments until checkout. That decision was changed deliberately.

The basket should surface the split when it gives the customer meaningful information.

Show the split if:

- the earlier shipment's latest promise is at least one eligible delivery day earlier than the later shipment's latest promise; or
- an actionable cutoff changes the earlier shipment's promise.

This is particularly useful around weekends. Friday versus Monday is a meaningful difference.

When the split is material, show:

- `Lieferung 1 von 2` / `Lieferung 2 von 2`;
- compact thumbnails;
- product names;
- delivery window;
- cutoff only where relevant.

Do not show the warehouse or why Redcare split it.

If both shipments arrive at essentially the same time, keep one simple order-level promise.

---

## 8. Why checkout uses a different amount of product detail

Basket is still about products and order composition, so product names are useful in the material-split block.

Checkout `Versand` is about choosing delivery options. To avoid turning it back into a basket, split shipment headers should use only:

- tiny product thumbnails;
- `2 Artikel` / `1 Artikel`;
- destination summary;
- `Lieferart ändern`.

Do not repeat full product names unless the user explicitly expands something later; expansion is not required for this prototype.

---

## 9. Preserve Shop Apotheke's current delivery hierarchy

The reference screenshots are important here.

The current conceptual hierarchy is:

```text
An eine Lieferadresse
  -> address
  -> DHL/Hermes home carrier

An einen Abholort
  -> station selection
  -> the relevant DHL/Hermes pickup service
```

Do not flatten these into one list such as:

```text
DHL Home
Hermes Home
DHL Packstation
Hermes PaketShop
```

That would redesign the checkout and contradict the approved product decision.

---

## 10. Split checkout should be an extension, not a new flow

If the order contains two shipments, remain on the same `Versand` step.

Render two instances of the existing-style shipping block.

Both shipments inherit the customer's order-level destination choice by default.

The customer should not have to configure both parcels because Redcare created the split.

Each shipment may expose `Lieferart ändern` inline. If the customer uses it, only that shipment changes.

The canonical demo can end with:

```text
Shipment 1 -> pickup
Shipment 2 -> home
```

This demonstrates flexibility without forcing complexity.

The ability to select destination method per split shipment is a **prototype assumption**. The final README must say that production OMS support would need to be validated.

---

## 11. PUDO strategy in this case

The project owner brings logistics domain knowledge that PUDO may be cheaper operationally than home delivery.

That does **not** mean the customer-facing prototype should say this or push it with a recommendation badge.

Do not add:

- `Recommended`;
- `Best option`;
- savings-for-Redcare copy;
- environmental or cost claims not already part of the approved design.

If a specific PUDO option has a better modeled lead time, simply show the better date. Let the customer choose based on service value.

---

## 12. NOW! must stay out of the redesign

NOW! appears to be a separate expedited Shop Apotheke service. The team does not have enough information about its real operating model, eligibility, home-delivery behavior, pickup behavior, or cutoffs.

Therefore:

- do not model NOW! inside the new standard prediction API;
- do not invent NOW! rules;
- do not remove existing NOW! visual elements if they are needed to faithfully recreate the reference screen;
- keep NOW! visually separate and static.

This restraint is itself a product decision and should be visible in the handover.

---

## 13. Pre-purchase recalculation versus post-purchase delay

This distinction is critical.

Before confirmation, delivery information is an **estimate**.

If the customer changes postcode/address or chooses a different service, recalculate silently and show the new estimate.

Do not show `Lieferzeit aktualisiert`. A changed address may naturally produce a different date; calling attention to every recalculation creates unnecessary questions.

Known operational disruption before confirmation is **model context**. Do not patch the UI with an ad-hoc extra day.

After confirmation, the date becomes a **promise**.

From that point on, operational events can change the **current ETA**, but never the historical confirmed promise.

---

## 14. Why tracking must keep the original promise

Suppose Redcare promised Monday and now believes the parcel will arrive Tuesday.

Wrong behavior:

> change Monday to Tuesday and pretend Tuesday was always the estimate.

Correct behavior:

> **Ihre Lieferung verspätet sich**  
> Neuer Liefertermin: Dienstag  
> Ursprünglich angekündigt: Montag

This supports trust, promise-accuracy measurement, Customer Service understanding, and honest customer communication.

For split orders, compare ETA to promise per shipment.

---

## 15. Why the email exists

The proactive email is part of the WISMO strategy.

If Redcare already knows a promise is broken, do not wait for the customer to discover it on tracking or contact Customer Service.

The email preview uses the same order state as tracking. There should be no duplicate hard-coded date source.

The prototype does not need email infrastructure; an HTML preview is enough.

---

## 16. Demo fixtures are part of the product demonstration

There is no hidden scenario control panel.

Reviewers should be able to create states through real interactions:

- enter one of five supported postcodes;
- switch products;
- add products to basket;
- reach a single or material split;
- choose home/pickup;
- choose DHL/Hermes where applicable;
- open prebuilt tracking orders.

The final README must give them a scenario matrix showing exactly which combinations demonstrate which behavior.

The mock prediction matrix should be visible in the repository/handover because it explains the product transformation from raw distribution to final customer promise.

---

## 17. Visual fidelity is part of the acceptance criteria

The screenshot directory is:

`docs/reference/shop-apotheke-reference-screenshots/`

These screenshots were supplied specifically so implementation does not drift.

Before coding each surface, inspect its reference. Match the structure first, then add the approved delivery behavior.

Particular details that must remain recognizable:

- retail header with white main row and peach category navigation;
- stripped-down checkout header and `Adresse / Versand / Zahlung / Prüfen` stepper;
- pale warm checkout cards rather than generic white SaaS panels;
- large Shop Apotheke-red pill CTA;
- red radio selection treatment;
- green `Lieferzeitraum`/availability text;
- DHL/Hermes-only carrier rows;
- wide station picker with station list left and map-style area right;
- email proportions and peach support/brand blocks from the supplied email reference.

Do not import a design library and let it determine the aesthetic.

Do not add DPD.

Do not add large green promo cards or a dashboard aesthetic.

Do not turn the case into a concept redesign.

---

## 18. Important visual tokens

Use only the locked CSS tokens from the implementation index/AGENTS file:

```text
#E90033 Shop Apotheke red
#006C48 delivery green
#1B1C1B primary text
#FFFFFF white
#FBF9F8 warm neutral surface
#FFECE6 basket peach
#FFC8B3 navigation peach
#E5E4E3 border
#FDD1BC email peach
#D3CFFF email lavender reference
#FFCC00 DHL badge
#009AD8 Hermes badge
```

The screenshots remain authoritative if a token alone is insufficient to determine spacing or hierarchy.

---

## 19. Suggested 15-minute reviewer walkthrough

The build should support this without setup controls:

### PDP (~2 min)

Start with generic `1–3 Werktagen`, enter a known postcode, show a precise date and meaningful cutoff. Then use a documented low-confidence/support combination and demonstrate fallback.

### Basket (~2–3 min)

Create a material split. Explain that the basket surfaces it because part of the order can arrive materially earlier. Highlight Friday-vs-Monday/cutoff behavior.

### Checkout (~4 min)

Show home vs pickup first. Show DHL/Hermes lead times. In a split order, show both shipment blocks together and change one shipment to pickup while leaving the second at home.

### Confirmation (~1 min)

Explain that the final estimate becomes the confirmed promise.

### Tracking + email (~3 min)

Open the delayed demo order. Show new ETA plus original promise. Open the matching email preview and explain proactive WISMO handling.

### Architecture/matrix (~2 min)

Show the mock prediction matrix and explain the transformation:

```text
carrier-specific model distribution
  -> safe exposure decision
  -> rounded customer days
  -> business calendar/cutoff
  -> simple UI
```

---

## 20. What not to optimize away during development

Do not simplify away these parts even if they add implementation effort:

- carrier-specific model fixtures;
- separate confidence/calibration/support gating;
- carrier envelope before selection;
- business-day/weekend/holiday handling;
- cutoff shown only when promise changes;
- material split logic in basket;
- correct home-vs-pickup hierarchy;
- per-shipment inherited destination and isolated override;
- immutable confirmed promise;
- separate current ETA;
- shared tracking/email state;
- reviewer matrix/decision documentation;
- visual comparison against supplied screenshots.

Those are the features that demonstrate the product thinking.

---

## 21. What can remain lightweight

To keep scope controlled, these may be deliberately shallow:

- search;
- account login;
- actual pricing logic;
- recommendations/free-shipping merchandising beyond reference fidelity;
- payment processing;
- review step;
- real parcel-shop lookup;
- map interactions;
- real carrier tracking;
- real email delivery;
- responsive behavior below the core tablet/desktop target.

Do enough to make the journey coherent, not to build a full pharmacy commerce platform.

---

## 22. Final acceptance mindset

Before calling implementation complete, ask:

1. Does this look like Shop Apotheke from the supplied screenshots?
2. Does the customer see less complexity than the backend contains?
3. Does precision disappear safely when the model is not trusted?
4. Is the upper-funnel promise honest across available carriers?
5. Does the split appear only when useful?
6. Does checkout preserve the current decision hierarchy?
7. Can a reviewer understand why a promise changed by inspecting the supplied matrix and README?
8. Is the confirmed promise preserved when the ETA changes?
9. Does the proactive communication directly support the WISMO story?
10. Are prototype assumptions clearly labeled rather than presented as Redcare facts?

If any answer is no, the implementation is not finished.
