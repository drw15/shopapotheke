# Delivery Promise Prototype Implementation Plan Index

**Goal:** Implement the approved Shop Apotheke delivery-promise prototype without product or visual drift.

**Architecture:** The work is split into three independently testable plans: (1) domain/model/promise logic, (2) pre-purchase UI and checkout, and (3) confirmation/tracking/email/handover. All plans consume the approved design in `docs/superpowers/specs/2026-09-10-delivery-promise-design.md`.

**Tech stack:** React, TypeScript, Vite, React Router, Vitest, Testing Library, Playwright, date-fns, date-fns-tz, date-holidays, plain CSS.

## Global Constraints

- The approved design is authoritative. Earlier `docs/DESIGN.md` and `docs/SPEC.md` are drafts and must not override it.
- Do not redesign Shop Apotheke. Match the provided screenshots and change only the delivery-promise behavior.
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

## Plan order

1. `docs/superpowers/plans/2026-09-10-delivery-promise-core-domain.md`
2. `docs/superpowers/plans/2026-09-10-delivery-promise-prepurchase-ui.md`
3. `docs/superpowers/plans/2026-09-10-delivery-promise-postpurchase-handover.md`

Each plan must be completed and green before starting the next. If an implementation agent finds a product or visual requirement that conflicts with the approved design, stop and update the design first rather than silently changing behavior.
