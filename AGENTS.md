# Implementation Agent Instructions — Shop Apotheke Delivery Promise Prototype

This repository is a take-home product prototype. The goal is **not** to invent a new ecommerce experience. The goal is to implement the approved delivery-promise concept inside a high-fidelity Shop Apotheke experience.

## Mandatory reading order

Before writing or modifying code, read:

1. `docs/PRD.md`
2. `docs/superpowers/specs/2026-09-10-delivery-promise-design.md`
3. `docs/reference/shop-apotheke-reference-screenshots/`
4. `docs/superpowers/plans/2026-09-10-delivery-promise-implementation-index.md`
5. the relevant execution plan under `docs/superpowers/plans/`

If a customer-facing screen is being implemented, inspect the relevant screenshot files before coding.

## Source of truth

For product behavior, the order of authority is:

1. `docs/superpowers/specs/2026-09-10-delivery-promise-design.md`
2. `docs/PRD.md`
3. the implementation plan files
4. older `docs/DESIGN.md` and `docs/SPEC.md` only as historical context

If documents conflict, do not silently choose the easiest option. Follow the hierarchy above. If an ambiguity remains, stop and ask.

## Visual source of truth

The reference screenshots under:

`docs/reference/shop-apotheke-reference-screenshots/`

are authoritative for layout, visual hierarchy, spacing, card shapes, radio controls, headers, checkout structure, and email treatment.

Do not create a generic Shop Apotheke-inspired design from memory.

### Locked design tokens

| Token | Value | Use |
|---|---|---|
| `--sa-red` | `#E90033` | CTA, selected radio, red links/icons |
| `--sa-green` | `#006C48` | delivery / availability text |
| `--sa-text` | `#1B1C1B` | primary text |
| `--sa-white` | `#FFFFFF` | page/card background |
| `--sa-surface` | `#FBF9F8` | warm checkout/PDP surfaces |
| `--sa-peach-soft` | `#FFECE6` | basket shipping/free-shipping panel |
| `--sa-peach-nav` | `#FFC8B3` | retail navigation row |
| `--sa-border` | `#E5E4E3` | borders and separators |
| `--sa-email-peach` | `#FDD1BC` | email branded/support surfaces |
| `--sa-email-lavender` | `#D3CFFF` | existing-email secondary promo reference only |
| `--dhl-yellow` | `#FFCC00` | DHL badge only |
| `--hermes-blue` | `#009AD8` | Hermes badge only |

### Layout rules

- Font: `Arial, Helvetica, sans-serif`.
- Primary desktop viewport: 1440x900.
- Retail content: approximately 980-1080px centered.
- Checkout: approximately 980px centered, ~565px main column + ~16px gap + ~398px summary column.
- Primary CTA: 52-56px high, pill radius ~28px, red with white text.
- Cards: 14-16px radius.
- Selected radio: red outer ring + red center, ~24px.
- Retail header: white main row + peach category navigation.
- Checkout header: white header + `Adresse / Versand / Zahlung / Prüfen`; no category nav.
- Pickup modal: wide white modal, search field at top, filter row, station list left, static map-like panel right.
- Delay email: centered body around 600px, white/warm background, peach surfaces, red CTA.

## Product rules that must not drift

- Standard demo carriers are DHL and Hermes only. No DPD.
- NOW! is out of scope for the new prediction model. Preserve it only as an unchanged existing visual element when needed for fidelity.
- Model outputs are carrier/service-specific.
- Raw model fields are not customer-facing.
- Prototype exposure requires confidence + calibration + minimum sample support to pass.
- Prototype q10/q90 define the display bounds, but the README must state that production quantile policy is cross-functional with Product, Data, and Last Mile/Operations.
- In production the API should expose a simple `safe_to_expose` decision after those teams agree the policy.
- Before a carrier is selected, PDP and basket use an envelope across standard home carrier promises.
- If one eligible home carrier falls back, its fallback participates in the envelope.
- Carrier raw predictions may differ slightly while rounding to the same customer-facing promise.
- Do not exaggerate DHL/Hermes differences; visible standard-carrier differences should be rare and around one business day at most in the demo.
- Cutoff is deterministic operational logic, not an ML-learned UI effect.
- Show `Bei Bestellung bis 19:00` only if crossing the cutoff changes the displayed promise.
- Customer delivery days are Monday-Friday, no later than 18:00, skipping applicable German public holidays.
- Known operational disruption before confirmation is part of model context, never an ad-hoc `+1 day` UI adjustment.
- Basket shows a split only when materially useful: the earlier shipment is at least one eligible delivery day earlier, or an actionable cutoff changes that shipment's promise.
- Friday vs Monday is material even though it is one business-day step because the customer experiences multiple natural days of difference.
- Material basket split shows thumbnails + product names.
- Checkout split shows tiny thumbnails + item count only.
- Home vs pickup is always the first-level checkout choice. Provider/carrier comes after that.
- Split shipments inherit the order-level destination by default.
- `Lieferart ändern` is optional, inline, and affects only the targeted shipment.
- Do not promote PUDO using Redcare cost economics. Let service/lead-time differences speak for themselves.
- Pre-purchase estimate recalculation is silent.
- Confirmation freezes the promise for each shipment.
- Tracking maintains a separate current ETA.
- A later ETA never overwrites the confirmed promise.
- Tracking and proactive delay email read the same order state.
- No hidden demo control panel.

## Customer-facing language guardrails

Customer-facing UI may use terms such as:

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

Do not render:

- q10/q50/q90
- confidence
- calibration
- sample support
- Sevenum
- warehouse IDs
- fulfilment groups
- fallback reason
- internal cost rationale

## Demo data

Use five products and five postcodes defined in the PRD/design. The external fulfilment assignment is fictional and must never be presented as a real Redcare fact.

Do not use personal information visible in screenshots. Use generic fixture data such as `Max Mustermann`, `Musterstraße`, and one of the approved demo postcodes.

## Implementation discipline

- Work test-first according to the relevant plan.
- Keep raw prediction fixtures behind domain services.
- Customer-facing React components consume customer-ready view models only.
- Do not introduce Tailwind, Material UI, Chakra, Bootstrap, shadcn, or another component system.
- Do not scatter raw hex colors through components; use design tokens.
- Before accepting visual work, capture Playwright screenshots at 1440x900 and compare against the supplied references.
- A technically correct but visually generic implementation is not complete.
- If a clever implementation would change the product story, do not do it.
