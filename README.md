# Delivery Promise Experience — Shop Apotheke prototype

A working prototype for the Redcare Pharmacy delivery & shipping case, part 2.

It explores one product decision:

> **Don't add a delivery-prediction feature. Make the delivery information
> customers already see smarter as Redcare learns more about the order.**

The customer answers one question before buying — *when will I get this?* — and
one question after — *is that date still true?* Everything else stays behind
the interface.

---

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
```

```bash
npm run test:run     # domain + component tests
npm run check:design # visual/product contract check
npm run build        # typecheck + production build
```

Desktop, 1440×900. The prototype reads your device clock — see
[Calendar behaviour](#the-clock).

## Where to start

| | |
|---|---|
| **Try the scenarios** | [`docs/demo/scenarios.md`](docs/demo/scenarios.md) — exact combinations, no hidden controls |
| **See the model output** | [`docs/demo/prediction-matrix.md`](docs/demo/prediction-matrix.md) — all 100 combinations, raw values through to what the customer sees |
| **Decisions made while building** | [`docs/PRODUCT_DECISIONS.md`](docs/PRODUCT_DECISIONS.md) |
| **Visual references** | [`docs/reference/shop-apotheke-reference-screenshots/`](docs/reference/shop-apotheke-reference-screenshots/) |

Quickest tour: `/product/voltaren` → enter `50667` → basket with a second
product → checkout → `/orders/100422` → `/email-preview/100422`.

---

## What it demonstrates

**1. Precision only when Redcare can stand behind it.** A prediction becomes a
date only if confidence, calibration *and* sample support all pass. Otherwise
the customer sees the existing `Lieferung in 1–3 Werktagen` and is never told
that a model declined to commit. Failures are deliberately boring: an unknown
postcode, an out-of-scope product and a broken backend all end in the same
quiet fallback, and none of them block shopping.

**2. Progressive precision.** PDP knows the product and postcode. The basket
knows the whole order. Checkout knows the address, method and carrier.
Confirmation freezes the result. Each step is more specific than the last, and
pre-purchase recalculation is silent because it is still only an estimate.

**3. The upper funnel never promises more than the options behind it.** Before
the customer picks DHL or Hermes, both carriers are resolved independently and
the promise covers both. If either falls back, the whole envelope falls back —
the PDP does not advertise the attractive carrier as though it were guaranteed.

**4. Complexity is revealed only when it is useful.** Two fulfilment groups is
not a reason to show a split basket. The split appears when one parcel
genuinely arrives earlier, and stays hidden when both arrive together — the
same two products do both, depending only on the postcode.

**5. After confirmation, a promise is a commitment.** The confirmed promise is
immutable; the current ETA moves separately. When the ETA passes the promise,
tracking says so and keeps the original date visible instead of quietly
rewriting it. The same order state drives a proactive email, so the customer
hears about a broken promise before they have to ask.

---

## Architecture

```
src/
  config/promisePolicy.ts     exposure gates, cutoff, fallback copy
  data/                       products, postcodes, prediction matrix, demo orders
  domain/
    prediction/               raw fixtures + exposure gating
    promise/                  rounding, calendar promise, carrier envelope
    calendar/                 German business days and holidays
    cutoff/                   deterministic 19:00 policy
    fulfilment/               shipment planning, material-split rule
    checkout/                 shipping view model
    order/                    confirmation, immutable promise
    tracking/                 promise vs ETA
    notifications/            delay email, from the same state
    deliveryFacade.ts         the only delivery entry point the UI uses
  components/ pages/ state/ styles/
```

One boundary matters: **components never read prediction fixtures.** They
consume a `CustomerPromise`, which by construction carries no quantiles,
confidence, calibration, support counts, warehouse ids or fallback reasons.
`npm run check:design` fails the build if raw model fields, internal fulfilment
names, invented carriers, steering copy or stray hex colours reach the UI.

**Tests:** 167 across 20 files, covering rounding, each exposure gate
independently, weekend and holiday handling, cutoff visibility, the carrier
envelope, split materiality, destination inheritance and override isolation,
promise immutability, delay detection, and that email and tracking agree.

---

## Prototype assumptions

Everything here is a demo assumption, not a Redcare fact, and would need
validating before any of it shipped.

| Assumption | Validate with |
|---|---|
| **q10/q90 as promise bounds.** Simple and transparent for a demo; production quantile policy is a joint decision | Product + Data + Last Mile |
| **Gate thresholds** (confidence ≥ 0.90, calibration ≤ 0.03, support ≥ 500). Chosen so reviewers can exercise both safe and fallback states | Product + Data + Last Mile |
| **The UI shouldn't own this logic at all.** In production the API should return a simple `safe_to_expose` after the policy is agreed, with the statistics inspectable for Data | Data/Product contract |
| **Carrier is a model input**, not a fixed offset on a generic prediction | Confirm the real feature set with Data |
| **19:00 cutoff**, derived from an illustrative 23:00 handover − 3h processing − 1h buffer | Last Mile / Operations |
| **Fulfilment grouping.** Two fictional external products exist only to exercise fallback and split paths, and say nothing about where Redcare fulfils anything | OMS |
| **Per-shipment destinations.** Whether the OMS can accept different destinations per parcel is unknown; if not, the design collapses to one order-level destination without changing the promise architecture | OMS |
| **All prediction values, tracking events and carrier timings** are fabricated | — |
| **No email is sent**; the email route is a preview | — |

**NOW! is deliberately untouched.** It appears to be a separate expedited
service, and we do not know enough about its eligibility, delivery, pickup or
cutoff mechanics to redesign it responsibly. It stays on the page as an
unchanged existing element, outside the new prediction model. The restraint is
the decision.

**PUDO is not steered.** Pickup may be cheaper to operate, but that is not the
customer's reason to choose it. Where pickup has a better modelled lead time,
the date says so; there is no "recommended" badge and no cost rationale.

<a name="the-clock"></a>

## The clock

There is no pinned demo date and no clock control. All dates come from your
device clock, evaluated in `Europe/Berlin`, so a reviewer in any timezone sees
the promise Redcare would make — and the prototype behaves like the shop rather
than a slideshow.

To see calendar-dependent behaviour (the Friday-to-Monday cutoff case, holiday
skipping), change your system clock; `docs/demo/scenarios.md` lists which times
produce which behaviour. The demo tracking orders are generated relative to the
current date, so they never go stale.

## Not in scope

No real model, no Redcare systems, no payment processing, no email delivery, no
map or parcel-shop backend, no full catalogue, no NOW! redesign, no responsive
work below the desktop target. Search, login and pricing are shallow by
intent — enough to make the journey coherent, not a commerce platform.

## Known gaps

- Basket and checkout state live in memory, so a hard page reload starts over.
  Navigate within the app.
- The pickup modal's map is a static panel; no map SDK is loaded.
- Product imagery is abstract placeholder art rather than real packaging.
- The email reference is a registration email, so the delay email borrows its
  visual language rather than its content.
