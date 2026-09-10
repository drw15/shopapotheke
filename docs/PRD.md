# Product Requirements Document — Shop Apotheke Delivery Promise Prototype

**Status:** Approved product direction; implementation follows the Superpowers design and plans  
**Date:** 2026-09-10  
**Repository:** `drw15/shopapotheke`  
**Primary design source:** `docs/superpowers/specs/2026-09-10-delivery-promise-design.md`  
**Implementation plan index:** `docs/superpowers/plans/2026-09-10-delivery-promise-implementation-index.md`  
**Visual reference folder:** `docs/reference/shop-apotheke-reference-screenshots/`

---

## 1. Why this prototype exists

This prototype is Part 2 of a Redcare Pharmacy / Shop Apotheke Senior Product Manager take-home case focused on delivery and shipping experience.

The underlying customer problem is simple: the current experience broadly communicates a generic delivery promise such as `1–3 Werktage`, while Redcare has built a new prediction capability that can sometimes make that promise more precise. For a meaningful share of Sevenum-served products the model can predict a shorter lead time than the current generic window, while other cohorts need a longer or more realistic promise such as 2–3 or 3–5 days.

The business opportunity is conversion: a customer may be more likely to purchase if they see a faster and more concrete delivery date. The trust risk is equally important: if a more attractive promise is not reliable, Redcare may gain an initial conversion and lose customer trust later through broken promises, WISMO contacts, delivery dissatisfaction, and lower repeat behavior.

The prototype therefore must not simply make every promise faster. It must demonstrate the product rule that **precision is valuable only when Redcare can stand behind it**.

The case also creates a natural stakeholder tension:

- Business wants to understand the conversion upside of earlier/faster promises.
- Last Mile / Operations needs customer promises to reflect operational reality.
- Customer Service already sees WISMO impact when delivery is late or unclear.
- Data owns prediction quality, calibration, and model performance.
- Product must integrate those inputs into a customer experience and own the final recommendation.

Part 1 of the case addresses the experiment and decision framework. Part 2 — this repository — turns the product-system thinking into a working prototype.

**Context only:** the prototype is not an experiment simulator and must not include experiment controls. It should behave like a real customer journey.

---

## 2. Core product thesis

> **Do not add a new “delivery prediction” feature to Shop Apotheke. Make the delivery information customers already see smarter as Redcare learns more about the order.**

The user interface should remain simple. Complexity belongs behind it.

The customer should not see:

- model confidence;
- q10/q50/q90;
- calibration;
- sample support;
- warehouse identifiers;
- fulfilment groups;
- fallback reasons;
- internal carrier logic;
- cost-to-serve rationale.

The customer should see:

> **When will I get this?**

After purchase, the relevant question becomes:

> **Is the date Redcare promised still true?**

---

## 3. Prototype scope

The prototype must cover one coherent end-to-end journey:

```text
PDP
  -> Basket
  -> Checkout / Address
  -> Checkout / Shipping
  -> lightweight Payment / Review
  -> Confirmation
  -> Orders
  -> Tracking
  -> proactive Delay Email preview
```

The minimum customer-facing screens are PDP, basket, and checkout. Confirmation and tracking are included deliberately because they are required to demonstrate the difference between an estimate, a confirmed promise, and a current ETA — and because this is where the trust/WISMO story becomes tangible.

---

## 4. Product goals

The prototype must demonstrate that Redcare could:

1. show more useful delivery information earlier in the funnel;
2. expose precise promises only when the prediction is safe enough;
3. preserve a safe fallback when precision is unavailable or unreliable;
4. become progressively more precise as postcode, basket, address, delivery method, carrier, and operational context become known;
5. surface split delivery before checkout only when doing so creates meaningful customer value;
6. preserve the current Shop Apotheke home-vs-pickup checkout hierarchy;
7. make carrier/service-specific lead-time differences visible without telling the customer what to choose;
8. freeze a confirmed promise after purchase;
9. maintain a separate current ETA during fulfilment;
10. tell the customer proactively when the ETA moves beyond the promise;
11. look and behave like an incremental Shop Apotheke product change rather than a new design system.

---

## 5. Non-goals

The prototype does not need to:

- build a real ML model;
- connect to Redcare production systems;
- recreate the complete Shop Apotheke catalogue;
- implement a real WMS/OMS/routing engine;
- implement real carrier APIs;
- process real payment;
- send real email;
- build a real map or parcel-shop search backend;
- redesign NOW!;
- optimize shipping cost in the UI;
- persuade the customer to choose PUDO using internal cost economics;
- recreate every Shop Apotheke page outside the delivery journey.

If an implementation decision does not help demonstrate the approved delivery-promise concept or Shop Apotheke fidelity, it is likely out of scope.

---

# 6. Product principles

## 6.1 Precision only when trusted

The existence of a model output is not enough to expose a precise customer promise.

For the prototype, a prediction is safe to expose only if all three illustrative gates pass:

- confidence score >= 0.90;
- calibration error <= 0.03;
- support sample >= 500.

If any gate fails, use the existing broad fallback.

These thresholds are demo assumptions. In production, Product, Data, and Last Mile/Operations should agree the exposure policy together based on calibration quality, customer-risk tolerance, and the desired promise-accuracy target.

Once that policy is agreed, the production API should ideally return a simple product-facing field such as:

```text
safe_to_expose: true | false
```

The UI should not independently reproduce model-governance logic.

## 6.2 q10/q90 are prototype promise bounds

The mock prediction service returns:

- mean;
- q10;
- q50;
- q90;
- confidence;
- calibration;
- sample support.

For this prototype, q10 becomes the lower bound and q90 the upper bound. Product policy rounds those bounds conservatively to whole business days, then converts them to real customer-facing calendar dates.

This is an intentional prototype decision, not a claim that Product alone should choose production quantiles.

## 6.3 Carrier/service is part of the prediction input

The prototype does not create one generic delivery prediction and then add fixed carrier offsets.

The prediction is conditional on the customer-relevant service context, including:

```text
product
+ postcode
+ home/pickup method
+ DHL/Hermes provider
+ current order time
+ relevant basket/fulfilment context
+ current operational state
```

DHL and Hermes predictions will usually be close. Their raw values may differ while rounding to the same customer-facing promise. Only a small number of demo combinations should cross a visible boundary, and standard DHL/Hermes differences should remain operationally believable — roughly no more than one business day in the demo.

## 6.4 Upper-funnel promises cannot assume a carrier

On PDP and before carrier selection, the customer has not selected DHL or Hermes.

Therefore the system resolves the standard home promise for each eligible carrier independently and shows the envelope that covers both customer-safe promises.

Example:

```text
DHL Home     -> Friday–Monday
Hermes Home  -> Monday–Tuesday
PDP          -> Friday–Tuesday
```

If one carrier is safe and the other falls back to 1–3 days, the fallback participates in the envelope. The PDP must not advertise the attractive carrier as if it were guaranteed before the customer has selected it.

## 6.5 Cutoff is deterministic operational policy

Known cutoffs should not be “learned” from the model.

Prototype assumption:

- operational carrier cutoff: 23:00;
- packing/processing requirement: 3 hours;
- safety buffer: 1 hour;
- customer-facing cutoff: 19:00 Europe/Berlin.

The cutoff appears in the UI only when crossing it changes the displayed promise.

This makes the message useful rather than decorative. Friday versus Monday is especially meaningful because one operational business-day difference can be three natural days for the customer.

## 6.6 Business calendar matters

For this prototype:

- customer delivery occurs Monday–Friday;
- promised delivery is no later than 18:00;
- Saturday and Sunday are not delivery-promise days;
- applicable German public holidays are skipped;
- destination postcode determines state-specific holiday behavior where needed.

A promise that would mathematically land on Sunday must move to the next eligible delivery day.

## 6.7 Operational disruption before confirmation belongs in model context

Before the customer has placed the order, known operational conditions — warehouse backlog, carrier capacity, route disruption, service degradation — are part of the prediction context.

Do not add a UI-side `+1 day` adjustment or a separate ad-hoc delay rule before confirmation.

The model returns a different distribution under the current context and the UI simply renders the latest valid estimate.

## 6.8 Promise becomes immutable after confirmation

Before purchase, the system is showing an estimate and may recalculate silently as context changes.

At confirmation, the final estimate becomes the confirmed promise.

After that moment, a later ETA does not rewrite the original promise.

---

# 7. Demo catalogue and locations

The prototype uses five products so reviewers can mix baskets and create both single- and split-shipment states.

| Product | Demo fulfilment | Standard prediction eligible |
|---|---|---:|
| Voltaren Schmerzgel forte | Sevenum demo group | yes |
| Vitamin D3 2000 I.E. | Sevenum demo group | yes |
| Fenistil Kühl Roll-on | Sevenum demo group | yes |
| Ibu-ratiopharm 400 mg akut | Sevenum demo group | yes |
| Vagisan FeuchtCreme | external demo group | no |

The external assignment is fictional. It exists only to demonstrate unsupported-model fallback and split fulfilment. The customer UI must never claim that this reflects Redcare's real product fulfilment.

Supported demo postcodes:

| Postcode | City | Purpose |
|---|---|---|
| 50667 | Köln | predominantly fast / close to Sevenum |
| 60311 | Frankfurt | fast western-central lane |
| 22083 | Hamburg | mixed 1–2 / 2–3 behavior |
| 10115 | Berlin | mixed and sometimes longer |
| 80331 | München | slower/mixed plus at least one low-confidence/support case |

Unknown postcodes safely fall back.

The reviewer-facing handover must expose the full prediction matrix so the hiring team can see the raw model-like output, the exposure decision, the rounded business-day window, and the resulting calendar promise.

---

# 8. PDP requirements

## 8.1 Preserve the existing page pattern

The delivery-promise concept should replace the existing delivery line rather than add a new card.

Before postcode:

> **Lieferung in 1–3 Werktagen**  
> Ihre PLZ

After postcode and safe prediction:

> **Voraussichtliche Lieferung: [calendar window]**

If crossing the cutoff matters:

> Bei Bestellung bis 19:00

The postcode remains visible/changeable.

If the result is not safe to expose:

> **Lieferung in 1–3 Werktagen**

Do not tell the customer `low confidence`, `insufficient sample`, `prediction unavailable`, or similar.

## 8.2 Recalculation is silent

If the customer enters another postcode, the estimate simply changes.

Do not show `Lieferzeit aktualisiert` or another message explaining normal pre-purchase recalculation. The customer may simply be checking another address.

## 8.3 NOW! stays separate

The current Shop Apotheke experience shows NOW! as a separate expedited service. We do not have enough information about its real eligibility, delivery, pickup, or cutoff mechanics to redesign it responsibly.

Product decision:

> **Leave NOW! out of the new standard prediction model and preserve it only as an unchanged existing visual element when needed for page fidelity.**

It is not a new prototype scenario and it must not affect DHL/Hermes standard promise logic.

---

# 9. Basket requirements

The basket is more informed than PDP because it knows the complete product mix and preliminary fulfilment grouping.

We initially considered keeping every split hidden until checkout. We deliberately changed that decision.

## 9.1 Show the split only when it matters

The basket surfaces a split when either:

1. the earlier shipment's latest customer promise is at least one eligible delivery day earlier than the later shipment's latest promise; or
2. an actionable cutoff changes the earlier shipment's promise.

Friday versus Monday is material even though it is one business-day step because it creates a three-calendar-day difference for the customer.

If both shipments are essentially the same:

```text
Shipment 1 -> Monday–Tuesday
Shipment 2 -> Monday–Tuesday
```

show one simple overall delivery window and do not expose the split.

## 9.2 Material split presentation

When material:

> **Ihre Bestellung kommt in 2 Lieferungen**

Each shipment shows:

- `Lieferung 1 von 2` / `Lieferung 2 von 2`;
- compact product thumbnails;
- product names;
- delivery date/window;
- cutoff only if crossing it changes that shipment's promise.

Do not repeat price or quantity controls inside this delivery block.

Do not show carrier, warehouse, fulfilment node, or internal reason for the split in basket.

The factual cutoff may act as a small conversion nudge. Do not add urgency language beyond the real service consequence.

---

# 10. Fulfilment planning

The prototype uses a deliberately small rule:

```text
Sevenum-demo products can consolidate together.
External-demo product travels separately.
```

The customer never sees those labels.

For several products inside one shipment, the prototype may use the slowest item as the shipment constraint. This is an implementation simplification. In production, basket/shipment composition could itself be an input to the prediction service.

---

# 11. Checkout requirements

## 11.1 Preserve the real hierarchy

Current Shop Apotheke checkout first asks **where/how** the customer wants the order, then shows the applicable provider/service choices.

That hierarchy must remain:

```text
An eine Lieferadresse
    -> address
    -> DHL or Hermes home service

An einen Abholort
    -> pickup-point selection
    -> DHL/Hermes pickup service based on the chosen location
```

Do not flatten `DHL nach Hause` and `Hermes PaketShop` into peer options in one list.

## 11.2 Single shipment

For a normal order, the `Versand` step should look almost exactly like the current Shop Apotheke checkout.

For home delivery:

> Standard mit DHL  
> Lieferzeitraum: [predicted date/window]

> Standard mit HERMES  
> Lieferzeitraum: [predicted date/window]

Most demo combinations should produce the same displayed window after rounding. A small number may show a one-business-day visible difference.

The customer sees the information and chooses. The UI does not tell them which carrier is better.

## 11.3 Split shipment

If fulfilment creates two parcels, stay on the same `Versand` step.

At the top:

> **Ihre Bestellung kommt in 2 Lieferungen**  
> So können verfügbare Artikel früher bei Ihnen ankommen.

Then render two shipment blocks using the same visual pattern as the existing shipping options.

Checkout shipment headers show:

- tiny product thumbnails;
- `2 Artikel` / `1 Artikel`;
- current destination method/address or pickup point;
- `Lieferart ändern`.

Do not repeat product names by default in checkout. Basket already did that.

## 11.4 Inherit the order-level destination

If the customer chose home delivery, both shipments inherit the same home address by default.

The customer must not be forced to configure two deliveries just because Redcare decided to split the order.

## 11.5 Optional per-shipment override

`Lieferart ändern` works inline and only for the affected shipment.

If the customer changes shipment 1 to pickup, reuse the same top-level home-vs-pickup hierarchy, then open the existing-style pickup station selector.

Shipment 2 remains unchanged.

Canonical demo example:

```text
Shipment 1 -> pickup
Shipment 2 -> home
```

This per-shipment capability is a prototype assumption because the real OMS capability is unknown. If Redcare cannot support it in production, the design can collapse to one order-level destination without changing the promise architecture.

## 11.6 PUDO is not promoted with internal economics

Domain knowledge informs us that PUDO may be operationally cheaper, but this case is not about exposing that rationale to the customer.

Do not show:

- `Recommended`;
- `Best option`;
- `Save us cost`;
- similar steering labels.

If pickup has a better lead time in a specific modeled case, that factual service difference is enough. The customer makes the decision themselves.

---

# 12. Confirmation requirements

At confirmation, copy the final customer-facing promise into an immutable confirmed-promise field for each shipment.

For split orders, each shipment owns its own promise.

The prototype may use a lightweight payment/review flow because payment is not the product focus, but the journey should remain coherent with the existing `Adresse / Versand / Zahlung / Prüfen` stepper.

---

# 13. Tracking requirements

Tracking must keep two different concepts:

- **confirmed promise** — the date/window Redcare committed to when the order was confirmed;
- **current ETA** — the latest expected delivery date/window based on fulfilment/carrier events.

If ETA remains inside the promise, tracking behaves normally.

If ETA exceeds the promise:

> **Ihre Lieferung verspätet sich**

> Neuer Liefertermin: **[new ETA]**

Secondary context:

> Ursprünglich angekündigt: **[confirmed promise]**

Do not simply replace the original date with the new one. The old promise is the baseline for promise accuracy and customer trust.

Split shipments track independently. A delivered shipment stays delivered even if another parcel is late.

Required deterministic demo orders:

| Order | State |
|---|---|
| #100421 | on time |
| #100422 | delayed |
| #100423 | split: one parcel delivered, one in transit |
| #100424 | fully delivered |

---

# 14. Proactive delay email

When `current ETA > confirmed promise`, the same order state that drives the tracking delay treatment also makes a proactive delay email eligible.

The prototype does not actually send email. It renders an HTML preview.

The email must use the exact same promise and ETA fields as tracking. There must not be an independent hard-coded email fixture with separate dates.

Purpose:

> **Get in front of WISMO. If Redcare already knows the promise is no longer true, tell the customer before they need to ask where the parcel is.**

The email should visually follow the provided Shop Apotheke email reference: restrained white/warm layout, peach brand/support sections, Shop Apotheke red CTA, familiar support styling, no generic SaaS template.

---

# 15. Failure behavior

Failures should be boring to the customer.

If the prediction service fails, a postcode is unknown, a product is outside model scope, calibration fails, confidence fails, or sample support is insufficient:

> **Lieferung in 1–3 Werktagen**

The shopping flow continues.

No ML/API error toast should appear.

Internal diagnostics may record the reason for engineering and experiment analysis.

---

# 16. Visual fidelity requirements

**This section is mandatory for implementation agents.**

The visual source of truth is the screenshot set under:

`docs/reference/shop-apotheke-reference-screenshots/`

Before implementing or modifying a customer-facing screen, the agent must inspect all relevant screenshots in that directory. If the directory is missing from the checkout/clone, stop and resolve that before visually implementing the screen. Do not substitute a generic interpretation from memory.

The prototype must look like an incremental modification to the current Shop Apotheke experience shown in those screenshots.

Locked color tokens:

| Token | Value | Use |
|---|---|---|
| `--sa-red` | `#E90033` | CTA, selected radio, red links/icons |
| `--sa-green` | `#006C48` | delivery / availability text |
| `--sa-text` | `#1B1C1B` | primary text |
| `--sa-white` | `#FFFFFF` | page/card background |
| `--sa-surface` | `#FBF9F8` | warm checkout/PDP neutral surface |
| `--sa-peach-soft` | `#FFECE6` | basket shipping/free-shipping panel |
| `--sa-peach-nav` | `#FFC8B3` | retail navigation strip |
| `--sa-border` | `#E5E4E3` | borders and dividers |
| `--sa-email-peach` | `#FDD1BC` | email branded/support surfaces |
| `--sa-email-lavender` | `#D3CFFF` | existing secondary email promo reference only |
| `--dhl-yellow` | `#FFCC00` | DHL badge only |
| `--hermes-blue` | `#009AD8` | Hermes badge only |

Geometry and style guidance:

- font stack: Arial, Helvetica, sans-serif;
- primary desktop review viewport: 1440×900;
- retail content approximately 980–1080px centered;
- checkout approximately 980px centered, with a ~565px main column and ~398px summary column separated by ~16px;
- primary CTAs 52–56px high with ~28px pill radius;
- rounded cards ~14–16px radius;
- selected radio ~24px with red outer ring and center;
- retail header uses a white main row plus peach category navigation;
- checkout header is stripped down and uses the checkout stepper, not the retail category navigation;
- delivery/availability copy follows the green treatment seen in the reference;
- pickup modal uses a wide white layout with search at top, filter controls, station list left, static map-style panel right;
- delay email uses a centered ~600px body with Shop Apotheke-like spacing, peach sections, red CTA, and restrained copy.

Do not introduce:

- DPD;
- generic ecommerce hero cards;
- dashboard navigation;
- new green promo/information banners;
- recommendation badges;
- gradients;
- a third-party component library that changes the visual system;
- raw confidence/model chips;
- warehouse or logistics-debug UI.

The implementation plan includes a design-contract check and visual-regression screenshots. Pixel/structural fidelity to the supplied reference set matters more than creative reinterpretation.

---

# 17. Product decisions that must appear in the final reviewer handover

The final README is part of the case deliverable. It must explain not only how to run the prototype but **why these decisions were made**.

For each major decision, capture:

| Decision | Why | Alternative not chosen | Production validation |
|---|---|---|---|
| q10/q90 define prototype bounds | simple transparent mapping from distribution to promise | arbitrary band around mean | agree with Data + Last Mile |
| confidence + calibration + sample gate precision | avoid exposing attractive but unreliable predictions | display every model result | agree thresholds jointly |
| production API should expose `safe_to_expose` | keep UI simple and prevent duplicate statistical logic | UI computes gating | Data/Product contract |
| carrier is model input | delivery performance is carrier/service-specific | generic prediction + fixed offsets | confirm real feature set with Data |
| PDP envelopes standard home carriers | carrier is not selected yet | assume a default or show fastest | confirm routing/default policy |
| unsafe carrier contributes fallback | upper funnel should not promise more than later choices support | ignore unsafe carrier | validate with experiment |
| raw carrier differences can round away | customers need understandable dates, not model noise | surface every small numerical difference | monitor promise accuracy |
| cutoff is deterministic | operational fact, easy to explain and test | model learns cutoff implicitly | validate actual service cutoffs |
| cutoff shown only when it changes promise | useful conversion nudge without artificial urgency | always display cutoff | measure funnel effect |
| material split shown in basket | Friday vs Monday is useful customer information | hide all splits until checkout | validate comprehension/conversion |
| basket split shows names + thumbnails | customer can tell which products arrive when | only show item counts | usability test |
| checkout split uses thumbnails + count | preserve current Versand simplicity | repeat basket details | usability test |
| split shipments inherit destination | Redcare split should not create forced customer work | configure each parcel | validate OMS capability |
| per-shipment delivery override | allows customer to choose pickup/home based on service | order-level only | validate OMS capability |
| home vs pickup stays first-level | matches current site and mental model | flat carrier list | current UX/source screenshots |
| do not advertise PUDO cost saving | customer should choose based on their own service value | operational steering copy | separate commercial experiment if desired |
| NOW! out of scope | not enough information to redesign a separate service safely | guess its rules | investigate with internal owners |
| pre-purchase recalculation is silent | still only an estimate; avoid unnecessary explanation | `Lieferzeit aktualisiert` notice | usability observation |
| pre-confirmation disruption is model context | avoids ad-hoc UI logic | add static +1 day | confirm model input architecture |
| confirmed promise is immutable | enables trust, promise accuracy, and honest delay handling | rewrite promise with ETA | Last Mile/CS alignment |
| tracking + email share state | one truth across channels | separate email dates | production event architecture |

---

# 18. Demo narrative for the 15-minute review

The prototype should be designed so the presenter can tell the whole story in about 15 minutes without using hidden controls.

Suggested flow:

**PDP — 2 minutes**  
Show generic `1–3 Werktage`, enter a supported postcode, show a precise date and meaningful cutoff. Change to a known low-confidence/support scenario and show the safe fallback without exposing why.

**Basket — 2–3 minutes**  
Add products that create a material split. Show that basket reveals the split only because one shipment can materially arrive earlier. Highlight the cutoff on the fast shipment when it actually changes the promise.

**Checkout — 4 minutes**  
Show the existing home-vs-pickup hierarchy. In Versand, show DHL/Hermes carrier-specific promises. Demonstrate a split order with both shipment blocks visible. Change one shipment to pickup while the other remains home.

**Confirmation — 1 minute**  
Explain that the final checkout estimate is now frozen as the confirmed promise.

**Tracking + email — 3 minutes**  
Open the delayed demo order. Show original promise and new ETA instead of silently rewriting the date. Open the corresponding email preview and explain that Redcare proactively answers the WISMO question.

**Architecture/handover — 2 minutes**  
Show the prediction matrix and explain that the UI is intentionally simple while the backend/mock domain handles carrier-specific distributions, safe exposure, business calendar, cutoff, fulfilment grouping, and immutable promises.

---

# 19. Definition of success for the build

The prototype succeeds if a reviewer can explore it without the presenter and understand these conclusions:

1. delivery information becomes more precise as the system learns more;
2. Redcare does not expose model precision it cannot trust;
3. the UI remains recognizably Shop Apotheke;
4. the basket uses delivery information to create value without unnecessary fulfilment complexity;
5. checkout preserves the current decision hierarchy while supporting split shipments cleanly;
6. the promise is treated as a customer commitment after confirmation;
7. delays are communicated honestly and proactively;
8. every important prototype assumption is visible in the README rather than disguised as a fact about Redcare.

If an implementation agent must choose between adding a clever feature and preserving this story, preserve the story.
