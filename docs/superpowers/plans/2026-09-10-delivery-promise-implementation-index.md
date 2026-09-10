# Delivery Promise Prototype Implementation Plan Index

**Goal:** Implement the approved Shop Apotheke delivery-promise prototype without product or visual drift.

**Architecture:** The work is split into three independently testable plans: (1) domain/model/promise logic, (2) pre-purchase UI and checkout, and (3) confirmation/tracking/email/handover. All plans consume the approved design, product decision log, PRD, and implementation handoff. Customer-facing implementation must use the supplied Shop Apotheke screenshots as the visual source of truth.

**Tech stack:** React, TypeScript, Vite, React Router, Vitest, Testing Library, Playwright, date-fns, date-fns-tz, date-holidays, plain CSS.

## Mandatory reading order before any implementation

1. `docs/PRD.md` — business/product context, goals, non-goals, journey, and reviewer story.
2. `docs/PRODUCT_DECISIONS.md` — explicit approved decisions, rationale, rejected alternatives, prototype assumptions, and production-validation notes.
3. `docs/IMPLEMENTATION_HANDOFF.md` — engineering/agent explanation of the intent behind the design and the details most likely to be lost during implementation.
4. `docs/superpowers/specs/2026-09-10-delivery-promise-design.md` — approved behavioral/system design; authoritative for implementation behavior.
5. `docs/reference/shop-apotheke-reference-screenshots/` — authoritative visual references. Inspect the relevant screenshots before modifying a customer-facing screen.
6. This implementation index.
7. The relevant execution plan:
   - `docs/superpowers/plans/2026-09-10-delivery-promise-core-domain.md`
   - `docs/superpowers/plans/2026-09-10-delivery-promise-prepurchase-ui.md`
   - `docs/superpowers/plans/2026-09-10-delivery-promise-postpurchase-handover.md`
8. `AGENTS.md` — non-drift rules for implementation agents.

Earlier `docs/DESIGN.md` and `docs/SPEC.md` are historical drafts. They must not override the approved Superpowers design, `docs/PRODUCT_DECISIONS.md`, the PRD, or the handoff.

## Source-of-truth hierarchy

For product behavior and implementation decisions:

1. `docs/superpowers/specs/2026-09-10-delivery-promise-design.md`
2. `docs/PRODUCT_DECISIONS.md`
3. `docs/PRD.md`
4. `docs/IMPLEMENTATION_HANDOFF.md`
5. this implementation index and the relevant phase plan
6. `AGENTS.md`

For visual behavior, the screenshots in `docs/reference/shop-apotheke-reference-screenshots/` are authoritative for layout, hierarchy, spacing, density, and styling.

If two approved sources appear to conflict, do not pick the easiest implementation. Stop and reconcile the requirement before coding.

## Global Constraints

- Do not redesign Shop Apotheke. Match the provided screenshots and change only the delivery-promise behavior.
- **Visual reference directory:** `docs/reference/shop-apotheke-reference-screenshots/`. If it is missing from the local checkout, stop before customer-facing UI work and resolve the repository state. Do not substitute a generic ecommerce interpretation.
- Do not introduce DPD. Standard demo carriers are DHL and Hermes only.
- Home vs pickup remains the first-level choice. Carrier/provider selection follows that choice.
- NOW! remains outside the new prediction model. Preserve only its existing visual treatment if needed for fidelity.
- Raw model fields are never customer-facing.
- Precise promises require confidence + calibration + sample support to pass.
- PDP and pre-carrier basket promises envelope the eligible standard home carriers.
- Cutoff is deterministic and shown only when crossing it changes the displayed promise.
- Delivery calendar is Monday-Friday, no later than 18:00, skipping applicable German public holidays.
- Pre-confirmation operational disruption belongs in model context; no ad-hoc UI delay adjustment.
- Basket shows split only when materially useful.
- Split shipments inherit the order-level destination; per-shipment override affects only the selected shipment.
- Confirmed promise is immutable; current ETA is separate.
- Tracking and delay email share the same order state.
- No hidden demo-control UI.
- Do not invent new product rules because they are easier to code. If a requirement appears ambiguous, check the approved design and `docs/PRODUCT_DECISIONS.md` first; if still unresolved, stop and ask rather than silently changing behavior.

## Locked visual contract

Use these screenshot-derived tokens exactly:

| Token | Value | Use |
|---|---|---|
| `--sa-red` | `#E90033` | CTAs, selected radios, red links/icons |
| `--sa-green` | `#006C48` | delivery and availability text |
| `--sa-text` | `#1B1C1B` | primary text |
| `--sa-white` | `#FFFFFF` | page/card background |
| `--sa-surface` | `#FBF9F8` | checkout/PDP warm neutral surfaces |
| `--sa-peach-soft` | `#FFECE6` | basket shipping/free-shipping panel |
| `--sa-peach-nav` | `#FFC8B3` | retail category navigation row |
| `--sa-border` | `#E5E4E3` | borders/separators |
| `--sa-email-peach` | `#FDD1BC` | email branded/support blocks |
| `--sa-email-lavender` | `#D3CFFF` | existing-email secondary promo block only |
| `--dhl-yellow` | `#FFCC00` | DHL badge only |
| `--hermes-blue` | `#009AD8` | Hermes badge only |

Additional visual rules:

- Font stack: `Arial, Helvetica, sans-serif`.
- Desktop primary viewport: 1440x900.
- Main retail content width: 980-1080px centered.
- Checkout content: approximately 980px centered, with ~565px main column + ~16px gap + ~398px summary column.
- Primary button: 52-56px high, radius ~28px, red, white text, no gradient.
- Cards: radius 14-16px.
- Selected radio: red ring + red center, ~24px.
- Retail header: white main row + peach category nav.
- Checkout header: white header + `Adresse / Versand / Zahlung / Prüfen`; no category nav.
- Basket `Versand durch Shop Apotheke` panel uses `#FFECE6` and the existing red progress treatment.
- Pickup modal: white, wide, search field across top, filter row, station list left, static map-style panel right.
- No generic dashboard, giant ecommerce cards, green promo banners, recommendation badges, or invented carrier rows.

## Screenshot-specific visual authority

Implementation agents must use the reference set for these responsibilities:

- PDP screenshots: placement and styling of delivery copy, postcode treatment, purchase card, and untouched NOW! treatment.
- Basket screenshot: retail header, peach nav, basket width, `Versand durch Shop Apotheke` surface, product-row density, free-shipping panel.
- Address/home/pickup screenshots: checkout stepper, address cards, home-vs-pickup hierarchy, radio/button treatment, footer/trust row.
- Pickup station modal screenshot: modal proportions, search/filter layout, station list, provider badges, and map-side balance.
- Carrier-options screenshot: DHL/Hermes row hierarchy, `Lieferzeitraum` placement, selected radio, order-summary column.
- Email screenshot: email width, Shop Apotheke header proportions, peach surfaces, CTA and support/footer treatment.

Do not treat the screenshots as optional inspiration. They are the visual acceptance reference.

## Plan order

1. `docs/superpowers/plans/2026-09-10-delivery-promise-core-domain.md`
2. `docs/superpowers/plans/2026-09-10-delivery-promise-prepurchase-ui.md`
3. `docs/superpowers/plans/2026-09-10-delivery-promise-postpurchase-handover.md`

Each plan must be completed and green before starting the next. If an implementation agent finds a product or visual requirement that conflicts with the approved design or `docs/PRODUCT_DECISIONS.md`, stop and reconcile the requirement first rather than silently changing behavior.
