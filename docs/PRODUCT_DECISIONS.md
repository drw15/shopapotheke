# Product Decisions — Shop Apotheke Delivery Promise Prototype

**Status:** Approved decision log for implementation and reviewer handover  
**Date:** 2026-09-10  
**Related PRD:** `docs/PRD.md`  
**Approved design:** `docs/superpowers/specs/2026-09-10-delivery-promise-design.md`  
**Implementation plan index:** `docs/superpowers/plans/2026-09-10-delivery-promise-implementation-index.md`

This file exists so implementation agents do not lose the product reasoning behind the prototype. It records the decisions that were made deliberately during design, why they were made, what alternatives were rejected, which choices are prototype-only assumptions, and what would need validation in production.

If an implementation detail appears easier to build but conflicts with a decision below, **do not silently change the product**. Follow the approved design or stop and raise the conflict.

---

## Decision 1 — Keep complexity behind the UI

**Decision**  
Do not create a visible “delivery prediction” feature. Improve the delivery information Shop Apotheke already shows.

**Why**  
The customer wants to know when the order will arrive, not how the model works. Confidence, calibration, quantiles, support, fulfilment nodes, and fallback reasons are internal concerns.

**Rejected alternative**  
A new prediction card, confidence badge, “AI estimate,” or explanatory model UI.

**Implementation consequence**  
Customer-facing components consume customer-ready promise objects only. Raw prediction metadata must never appear in UI components.

---

## Decision 2 — Use q10 and q90 as prototype promise bounds

**Decision**  
For the demo, q10 is the lower bound and q90 is the upper bound. Both are rounded conservatively to whole business days.

**Why**  
It is a transparent mapping from a model distribution to a customer-facing range and makes the transformation easy to explain in the case review.

**Rejected alternative**  
Constructing an arbitrary Product-defined band around the mean or asking the UI to interpret uncertainty itself.

**Prototype assumption**  
The exact production quantiles are not decided here.

**Production validation**  
Product, Data, and Last Mile/Operations should jointly choose the interval based on calibration, customer-risk tolerance, and the target promise-accuracy level.

---

## Decision 3 — Precision requires confidence + calibration + sample support

**Decision**  
The demo exposes a precise promise only when all three gates pass:

```text
confidence >= 0.90
calibration error <= 0.03
support N >= 500
```

Otherwise it falls back to `Lieferung in 1–3 Werktagen`.

**Why**  
A precise-looking prediction is not useful if it is poorly calibrated or based on too little evidence.

**Rejected alternative**  
Expose every available model prediction.

**Prototype assumption**  
The thresholds above are fictional demo values chosen to create testable states.

**Production validation**  
Thresholds should be agreed jointly by Product, Data, and Last Mile/Operations.

---

## Decision 4 — Production API should ultimately return `safe_to_expose`

**Decision**  
The prototype keeps the raw confidence/calibration/support fields visible in the mocked backend for explanation and diagnostics, but the desired production product-facing contract is a simple eligibility field such as:

```text
safe_to_expose: true | false
```

**Why**  
Once the exposure policy is agreed, the UI should not duplicate statistical governance or threshold logic.

**Rejected alternative**  
Every frontend implementation independently recalculates confidence/calibration/sample rules.

**Production validation**  
Agree ownership and API semantics with Data and the delivery platform team.

---

## Decision 5 — Carrier/service is part of the model input

**Decision**  
Predictions are specific to the delivery option, including DHL Home, Hermes Home, DHL Pickup, and Hermes Pickup.

**Why**  
Carrier/service performance is part of the delivery process. It is more credible for the model to predict within the actual service context than to calculate a generic lead time and add arbitrary offsets later.

**Rejected alternative**  
Generic product/postcode prediction plus fixed `+x` or `-x` carrier adjustments.

**Implementation consequence**  
The mock prediction matrix contains carrier/method-specific distributions.

---

## Decision 6 — Do not exaggerate DHL/Hermes differences

**Decision**  
DHL and Hermes raw distributions usually differ slightly, but most differences round to the same customer-facing promise. Only a small number of demo cases cross a visible boundary, and visible standard-carrier differences should be roughly one business day at most.

**Why**  
This is more operationally credible than inventing dramatic carrier gaps for demo effect. The model can detect small differences without the UI needing to expose noise.

**Rejected alternative**  
Force visibly different dates for every carrier just to make the prototype look dynamic.

**Reviewer value**  
The shared prediction matrix lets the hiring team inspect the raw differences and see the Product decision to round them into understandable delivery windows.

---

## Decision 7 — PDP uses an envelope across standard home carriers

**Decision**  
Before a carrier is selected, resolve DHL Home and Hermes Home independently and display the customer-facing envelope that covers both.

Example:

```text
DHL Home    -> Fri–Mon
Hermes Home -> Mon–Tue
PDP         -> Fri–Tue
```

**Why**  
There is no defensible “default” carrier at PDP from the information available to us, and showing only the fastest option would create an expectation that may disappear later.

**Rejected alternatives**  
Assume a default carrier, or show the fastest eligible carrier.

**Production validation**  
If Redcare has a deterministic routing/default-carrier policy before checkout, that could justify a different upper-funnel contract. We do not assume one in the prototype.

---

## Decision 8 — An unsafe carrier contributes fallback to the PDP envelope

**Decision**  
If DHL is safe at 1–2 days but Hermes is unsafe and falls back to 1–3, the PDP remains 1–3.

**Why**  
The upper funnel should not appear more certain than the set of standard options available later.

**Rejected alternative**  
Ignore the unsafe carrier and advertise the more attractive safe prediction.

---

## Decision 9 — Routine pre-purchase recalculation is silent

**Decision**  
When postcode, address, carrier, basket, or another pre-purchase context changes, simply show the new current estimate.

**Why**  
The customer may intentionally be checking another address or service. A message like `Lieferzeit aktualisiert` creates another question without helping them make the purchase decision.

**Rejected alternative**  
Show a warning/notice every time the estimate changes.

---

## Decision 10 — Operational disruption before confirmation is model context

**Decision**  
Known warehouse backlog, carrier capacity, route disruption, or service degradation before purchase belongs in the prediction context.

**Why**  
The pre-purchase estimate should represent the best current prediction under real operating conditions. Product/UI should not patch the model with ad-hoc delay adjustments.

**Rejected alternative**  
UI-side `+1 day`, disruption banners that manually alter dates, or separate post-processing rules that are not part of the prediction context.

---

## Decision 11 — Cutoff is deterministic operational logic

**Decision**  
The demo uses a customer-facing cutoff of 19:00 Europe/Berlin, derived from a fictional operational assumption of 23:00 handover cutoff, 3 hours processing, and 1 hour buffer.

**Why**  
Known operational constraints should be explicit and testable rather than implicitly learned by the prediction model.

**Rejected alternative**  
Infer cutoff from model behavior or put the cutoff calculation in the UI.

**Prototype assumption**  
19:00 is not claimed to be Redcare's real cutoff.

---

## Decision 12 — Show cutoff only when it changes the promise

**Decision**  
Render `Bei Bestellung bis 19:00` only when ordering after 19:00 would actually change the displayed delivery date/window.

**Why**  
This creates a factual conversion nudge without fake urgency.

**Important edge case**  
Friday versus Monday is particularly meaningful: it may be only one business-day difference but three calendar days for the customer.

**Rejected alternative**  
Display a countdown/cutoff everywhere regardless of impact.

---

## Decision 13 — Use Monday–Friday delivery days and real holiday logic

**Decision**  
Customer promises land only Monday–Friday, no later than 18:00, and skip applicable German public holidays.

**Why**  
A mathematically precise model output is not a valid customer promise if the calculated date is not an eligible delivery day.

**Implementation consequence**  
Business-calendar logic is part of the promise domain, not date formatting in the UI.

---

## Decision 14 — Show split shipment in basket only when it is materially useful

**Decision**  
A split is surfaced in basket when either:

1. the earlier shipment's latest promise is at least one eligible delivery day earlier than the later shipment's latest promise; or
2. an actionable cutoff changes the earlier shipment's promise.

Otherwise the basket stays simple and shows one overall promise.

**Why**  
We originally considered hiding every split until checkout, but that throws away useful customer information when part of the order can arrive materially earlier.

**Rejected alternatives**  
Always show every fulfilment split, or never show splits before checkout.

---

## Decision 15 — Basket split shows product names + thumbnails

**Decision**  
When the basket exposes a material split, each shipment block shows compact product thumbnails and names.

**Why**  
The customer needs to understand which items are arriving in which window.

**Rejected alternative**  
Only show `2 Artikel` / `1 Artikel` in basket, which forces the customer to remember the grouping.

---

## Decision 16 — Checkout split uses thumbnails + item count only

**Decision**  
In `Versand`, shipment headers use tiny thumbnails plus `2 Artikel` / `1 Artikel`, without repeating product names by default.

**Why**  
Checkout is now about choosing delivery, not re-reading basket composition. This preserves the current page density.

**Rejected alternative**  
Repeat full basket content inside every shipping block.

---

## Decision 17 — Preserve the existing home-vs-pickup hierarchy

**Decision**  
The first-level choice remains:

```text
An eine Lieferadresse
An einen Abholort
```

Carrier/provider choice happens after that method is selected.

**Why**  
That matches the current Shop Apotheke checkout and the customer's mental model.

**Rejected alternative**  
One flat list containing DHL Home, Hermes Home, DHL Packstation, Hermes PaketShop, etc.

**Implementation consequence**  
The prototype extends the current flow instead of redesigning it.

---

## Decision 18 — Both split shipments are visible on the same Versand step

**Decision**  
For a split order, show two shipment shipping blocks on the same `Versand` screen.

**Why**  
Customers can compare the delivery windows without introducing another mini-wizard or extra checkout steps.

**Rejected alternatives**  
Configure one shipment at a time, or hide each shipment behind accordions by default.

---

## Decision 19 — Split shipments inherit the order-level destination

**Decision**  
If the customer chose home delivery, every shipment starts with the same home address. If the order-level choice is pickup, the relevant destination state is inherited.

**Why**  
Redcare choosing to split fulfilment should not force the customer to configure two deliveries from scratch.

**Rejected alternative**  
Require a method/destination selection for every shipment.

---

## Decision 20 — `Lieferart ändern` is optional and scoped per shipment

**Decision**  
Each shipment may expose `Lieferart ändern` inline. Changing shipment 1 to pickup does not alter shipment 2.

**Why**  
It gives the customer flexibility to use delivery lead-time differences without adding required complexity.

**Prototype assumption**  
We do not know whether Redcare's production OMS supports different destination methods per shipment.

**Production validation**  
Validate capability with OMS/checkout owners. If unsupported, the design can collapse to one order-level destination without changing the prediction architecture.

---

## Decision 21 — Do not steer PUDO with internal economics

**Decision**  
Do not label PUDO as `Recommended`, `Best option`, or tell customers it saves Redcare money.

**Why**  
PUDO may be operationally cheaper, but the customer-facing value in this case should be service-based. If one option has a better lead time, showing that date is enough to let the customer choose for themselves.

**Rejected alternative**  
Explicit cost-saving or recommendation copy.

---

## Decision 22 — NOW! remains outside the new prediction flow

**Decision**  
Do not redesign or model NOW! in this prototype. Preserve its existing visual treatment only where needed for Shop Apotheke page fidelity.

**Why**  
We do not have enough reliable information about its true eligibility, home-vs-pickup behavior, cutoffs, and operating model. Guessing would weaken the case.

**Rejected alternative**  
Fold NOW! into the same mocked DHL/Hermes prediction engine and invent its mechanics.

**Production validation**  
Investigate NOW! with the internal service owner before changing it.

---

## Decision 23 — Use a simple demo fulfilment split

**Decision**  
Four products belong to the Sevenum demo group and one product belongs to an external demo group. Mixing the external product with Sevenum products creates a split.

**Why**  
Five products × five postcodes gives enough combinations for a 15-minute demonstration without hidden controls, and one external product naturally creates the split-shipment scenarios.

**Prototype assumption**  
The product-to-fulfilment assignment is fictional and must not be presented as a real Redcare fact.

---

## Decision 24 — Use the slowest item as the shipment constraint in the prototype

**Decision**  
When several products consolidate into one shipment, the prototype uses the slowest item as the shipment-level constraint.

**Why**  
It keeps the demo deterministic and understandable without building a second basket-level ML model.

**Prototype assumption**  
This is a simplification, not the proposed final production architecture.

**Production validation**  
A real prediction service could take basket/shipment composition directly as model input and learn consolidation effects.

---

## Decision 25 — Confirmation freezes the promise

**Decision**  
The final checkout promise is stored per shipment at order confirmation and is immutable.

**Why**  
Once the customer has purchased, Redcare has made a commitment. Keeping the original promise is necessary for honest communication, promise-accuracy measurement, and trust.

**Rejected alternative**  
Continuously overwrite the customer promise with the latest ETA.

---

## Decision 26 — Current ETA is separate from confirmed promise

**Decision**  
Post-purchase tracking maintains a `current ETA` independently from the immutable confirmed promise.

**Why**  
Operational reality can change after the order. We need to tell the customer what is now expected without pretending the original commitment never existed.

---

## Decision 27 — A breached promise is communicated explicitly

**Decision**  
When the current latest ETA moves beyond the confirmed latest promise, tracking shows:

> **Ihre Lieferung verspätet sich**
>
> Neuer Liefertermin: [new ETA]
>
> Ursprünglich angekündigt: [confirmed promise]

**Why**  
Do not hide a broken promise by rewriting history. Acknowledge the delay clearly and give the customer the new information.

---

## Decision 28 — Tracking and proactive email share one source of truth

**Decision**  
The proactive delay email reads the same order/shipment promise and ETA state as tracking.

**Why**  
The customer must not receive different dates across channels.

**Rejected alternative**  
A separate hard-coded email fixture with independently maintained delivery dates.

---

## Decision 29 — Proactive delay email is part of the WISMO strategy

**Decision**  
If Redcare already knows the promise is broken, the prototype shows how an email could be triggered proactively rather than waiting for the customer to contact support.

**Why**  
The best WISMO contact is one the customer never needs to make because the answer arrived first.

**Prototype scope**  
Render the email preview only; do not build email infrastructure.

---

## Decision 30 — No hidden demo controls

**Decision**  
Do not build an admin/scenario control panel. Reviewers create states through normal customer actions and documented fixture combinations.

**Why**  
The prototype should demonstrate how the product behaves in real life, not how easily the presenter can manipulate it.

**Implementation consequence**  
The README must include a `Try these scenarios` guide and a complete prediction matrix.

---

## Decision 31 — The raw prediction matrix is part of the product handover

**Decision**  
Expose the fictional matrix in reviewer documentation with raw mean/q10/q50/q90, confidence, calibration, support, exposure decision, rounded window, and displayed outcome.

**Why**  
The hiring team can see exactly where the model ends and Product policy begins. It makes the rounding, fallback, and carrier-envelope decisions inspectable rather than magical.

---

## Decision 32 — Visual fidelity is a product requirement, not decoration

**Decision**  
Implementation must use `docs/reference/shop-apotheke-reference-screenshots/` as the visual source of truth and extend those patterns rather than invent a new ecommerce UI.

**Why**  
The take-home is about improving Shop Apotheke's delivery experience, not proposing a rebrand or design-system replacement. A product manager should show how the concept fits the current customer journey.

**Implementation consequence**  
Use the locked color/layout contract, DHL/Hermes only, existing-style headers, radio rows, pickup modal, checkout proportions, and email treatment. Do not use a UI library that imposes another design language.

---

# Decision hierarchy during implementation

When deciding what to build, use this order:

1. `docs/superpowers/specs/2026-09-10-delivery-promise-design.md` — approved behavioral/system design.
2. `docs/PRODUCT_DECISIONS.md` — explicit rationale and non-negotiable decisions.
3. `docs/PRD.md` — business context, goals, end-to-end requirements, and reviewer story.
4. `docs/IMPLEMENTATION_HANDOFF.md` — explanatory context for engineers/agents.
5. `docs/reference/shop-apotheke-reference-screenshots/` — visual authority for customer-facing surfaces.
6. `docs/superpowers/plans/` — execution order and exact tasks.
7. `AGENTS.md` — operational non-drift rules.

Older `docs/DESIGN.md` and `docs/SPEC.md` are historical drafts and must not override these approved artifacts.

If two approved documents appear to conflict, do not resolve the conflict by choosing the easier implementation. Stop and reconcile the product decision first.
