# Delivery Promise Pre-Purchase UI Implementation Plan

**Goal:** Build a high-fidelity Shop Apotheke-like PDP, basket, and checkout that expose the approved delivery-promise behavior without adding visible model or fulfilment complexity.

**Architecture:** React pages consume the domain services from the core-domain plan through shared state. Storefront and checkout use separate headers and page shells. Split fulfilment is only surfaced in basket when material and is rendered in checkout as repeated existing-style shipping blocks.

**Tech stack:** React, TypeScript, React Router, Testing Library, Playwright, plain CSS using locked Shop Apotheke tokens.

## Mandatory context before coding

Read in this order:

1. `docs/PRD.md`
2. `docs/superpowers/specs/2026-09-10-delivery-promise-design.md`
3. `docs/reference/shop-apotheke-reference-screenshots/`
4. `docs/superpowers/plans/2026-09-10-delivery-promise-implementation-index.md`
5. this plan
6. `AGENTS.md`

Before implementing a customer-facing screen, inspect the screenshot(s) for that screen. The screenshots are authoritative for layout, hierarchy, spacing, colors, card shapes, radio treatment, and visual density. Do not make a generic Shop Apotheke-inspired page from memory.

## Global Constraints

- Do not use Tailwind or a component library.
- Use only the locked screenshot-derived visual tokens from the implementation index.
- No DPD. DHL and Hermes only.
- No generic ecommerce redesign, green promo banners, oversized cards, or recommendation badges.
- Retail pages use the retail header; checkout uses the stripped-down checkout header.
- Home vs pickup remains first-level. Carrier/provider choice follows it.
- NOW! may remain as a static unchanged legacy block only where useful for fidelity; it is not wired into the new prediction engine.
- No raw model metadata is rendered.
- No hidden demo-control UI.
- Do not use real personal data visible in the reference screenshots. Use generic fixture customer/address data.

## Screenshot map

Use the files in `docs/reference/shop-apotheke-reference-screenshots/` as follows (match by descriptive filename if numbering differs):

- basket reference -> StoreHeader, category nav, basket density, shipping/free-shipping surface;
- PDP postcode known/unknown references -> PDP purchase card, delivery line, postcode and NOW! placement;
- checkout address form -> checkout header/stepper, field widths and page proportions;
- checkout home selected -> `An eine Lieferadresse` card and CTA treatment;
- checkout pickup selected -> first-level pickup selection hierarchy;
- pickup station modal -> modal proportions, search/filter/station-list/map split;
- checkout carrier options -> DHL/Hermes radio rows, `Lieferzeitraum`, right-hand total card;
- email reference is not implemented in this plan but defines shared brand treatment for the post-purchase plan.

## Task 1: Build the visual shell and enforce design tokens

**Create:**
- `src/main.tsx`
- `src/app/App.tsx`
- `src/styles/tokens.css`
- `src/styles/global.css`
- `src/components/brand/ShopApothekeWordmark.tsx`
- `src/components/layout/StoreHeader.tsx`
- `src/components/layout/CheckoutHeader.tsx`
- `src/pages/PlaceholderPage.tsx`
- `src/app/App.test.tsx`
- `scripts/check-design-contract.mjs`
- `docs/reference/visual-fidelity.md`
- `AGENTS.md`

**Interfaces:**

```ts
export function AppRoutes(): JSX.Element
export function StoreHeader(): JSX.Element
export function CheckoutHeader(props: { activeStep:'address'|'shipping'|'payment'|'review' }): JSX.Element
```

**Failing test first:**

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from './App'

it('keeps retail and checkout headers separate', () => {
  const { unmount } = render(<MemoryRouter initialEntries={['/product/voltaren']}><AppRoutes /></MemoryRouter>)
  expect(screen.getByText('Kategorien')).toBeInTheDocument()
  unmount()
  render(<MemoryRouter initialEntries={['/checkout/address']}><AppRoutes /></MemoryRouter>)
  expect(screen.getByText('Adresse')).toBeInTheDocument()
  expect(screen.queryByText('Kategorien')).not.toBeInTheDocument()
})
```

Run `npm run test:run -- src/app/App.test.tsx`.

Expected failure: missing app/header modules.

**Minimal implementation:** create routes for product, basket, address, shipping, payment, review, confirmation, orders, tracking, email preview. Build two headers only.

`src/styles/tokens.css` must contain exactly:

```css
:root {
  --sa-red:#E90033;
  --sa-green:#006C48;
  --sa-text:#1B1C1B;
  --sa-white:#FFFFFF;
  --sa-surface:#FBF9F8;
  --sa-peach-soft:#FFECE6;
  --sa-peach-nav:#FFC8B3;
  --sa-border:#E5E4E3;
  --sa-email-peach:#FDD1BC;
  --sa-email-lavender:#D3CFFF;
  --dhl-yellow:#FFCC00;
  --hermes-blue:#009AD8;
}
```

`check-design-contract.mjs` must fail if:
- a hex literal appears outside `tokens.css`;
- UI source contains `DPD`, `Recommended`, `Best option`;
- page/component source contains `q10BusinessDays`, `q90BusinessDays`, `confidenceScore`, `calibrationError`, or `supportN`.

`AGENTS.md` must repeat the Global Constraints, mandatory reading order, screenshot-reference directory, exact visual token table, and the rule that approved product behavior may not be silently changed.

`docs/reference/visual-fidelity.md` must list every screenshot in `docs/reference/shop-apotheke-reference-screenshots/` and state which UI surface it governs.

Run:

```bash
npm run test:run -- src/app/App.test.tsx
npm run check:design
npm run build
```

Expected: pass.

**Commit:** `git commit -m "chore: lock Shop Apotheke visual shell"`

## Task 2: Build the postcode-aware PDP

**Create:**
- `src/state/ShopContext.tsx`
- `src/state/DemoClockContext.tsx`
- `src/components/delivery/DeliveryEstimate.tsx`
- `src/components/product/PostcodeControl.tsx`
- `src/components/product/ProductPurchaseCard.tsx`
- `src/components/product/ExistingNowServiceCard.tsx`
- `src/pages/ProductPage.tsx`
- `src/pages/ProductPage.test.tsx`
- `src/styles/product.css`
- `public/assets/products/*`

**Visual authority:** inspect the PDP postcode-known and postcode-unknown screenshots before coding. Match the purchase card proportions, delivery line, green text treatment, location row, quantity/CTA row, and static NOW! block. Do not create a new delivery-prediction card.

**Behavioral requirements:**
- before postcode: show `Lieferung in 1–3 Werktagen` and the postcode affordance;
- after supported postcode: render the standard-home carrier envelope returned by the domain facade;
- if a carrier falls back, the envelope may widen accordingly;
- show `Bei Bestellung bis 19:00` only when the domain result says the cutoff changes the promise;
- postcode changes recalculate silently;
- NOW! remains visually separate and is not wired into prediction logic;
- add-to-basket works with all five demo products.

**Test cases:**
- precise postcode renders calendar window;
- low-confidence/support scenario renders fallback;
- unknown postcode renders fallback;
- raw model metadata does not appear in DOM.

Run:

```bash
npm run test:run -- src/pages/ProductPage.test.tsx
npm run check:design
npm run build
```

Expected: pass.

**Visual verification:** Playwright screenshot at 1440×900. Compare side-by-side to the relevant PDP reference screenshots before accepting.

**Commit:** `git commit -m "feat: add postcode-aware PDP promise"`

## Task 3: Build basket promise and material-split presentation

**Create:**
- `src/components/basket/BasketItemRow.tsx`
- `src/components/basket/BasketDeliverySummary.tsx`
- `src/components/basket/BasketShipmentPreview.tsx`
- `src/pages/BasketPage.tsx`
- `src/pages/BasketPage.test.tsx`
- `src/styles/basket.css`

**Visual authority:** inspect the basket reference before coding. Preserve the retail header, peach category nav, `Versand durch Shop Apotheke` surface, product-row density and CTA treatment.

**Behavioral requirements:**
- non-material split -> one simple overall promise envelope;
- material split -> `Ihre Bestellung kommt in 2 Lieferungen`;
- basket shipment preview uses compact thumbnails + product names;
- show cutoff only on the shipment for which crossing it changes promise;
- no carrier controls in basket;
- no warehouse/fulfilment labels;
- the factual cutoff is the only conversion nudge; no urgency badge/copy.

**Test cases:**
- non-material split hidden;
- material one-delivery-day split shown;
- Friday-vs-Monday split shown;
- shipment product names and thumbnails rendered when material;
- carrier choice absent from basket.

Run:

```bash
npm run test:run -- src/pages/BasketPage.test.tsx
npm run check:design
npm run build
```

Expected: pass.

**Visual verification:** capture 1440×900 basket screenshot and compare to the basket reference for layout density/header/surface treatment.

**Commit:** `git commit -m "feat: add material basket delivery split"`

## Task 4: Build checkout address method and pickup-station flow

**Create:**
- `src/domain/checkout/types.ts`
- `src/state/CheckoutContext.tsx`
- `src/components/checkout/AddressCard.tsx`
- `src/components/checkout/DeliveryMethodChoice.tsx`
- `src/components/checkout/PickupStationModal.tsx`
- `src/pages/CheckoutAddressPage.tsx`
- `src/pages/CheckoutAddressPage.test.tsx`
- `src/styles/checkout-address.css`

**Visual authority:** inspect checkout address-form, home-selected, pickup-selected, and pickup-station-modal screenshots. Preserve the existing hierarchy and modal proportions.

**Behavioral requirements:**
- first-level choice is home vs pickup;
- home uses a generic demo address, not the real address in screenshots;
- pickup opens the existing-style station selector;
- station list contains demo DHL/Hermes locations only;
- static map-style panel is visual only; no map SDK;
- selecting a station stores method/provider/location for checkout;
- pre-purchase promise is recalculated silently when postcode/destination context changes.

**Test cases:**
- home and pickup are first-level radio choices;
- pickup modal opens;
- selecting station updates checkout context;
- no flat `DHL Home / Hermes PaketShop` peer list exists.

Run:

```bash
npm run test:run -- src/pages/CheckoutAddressPage.test.tsx
npm run check:design
npm run build
```

Expected: pass.

**Visual verification:** screenshots for home-selected, pickup-selected, and open modal at 1440×900; compare with the corresponding references.

**Commit:** `git commit -m "feat: add checkout destination flow"`

## Task 5: Build single- and split-shipment Versand

**Create:**
- `src/domain/checkout/buildShippingView.ts`
- `src/domain/checkout/buildShippingView.test.ts`
- `src/components/checkout/ShipmentHeader.tsx`
- `src/components/checkout/CarrierOptionRow.tsx`
- `src/components/checkout/ShipmentShippingBlock.tsx`
- `src/components/checkout/InlineMethodOverride.tsx`
- `src/pages/CheckoutShippingPage.tsx`
- `src/pages/CheckoutShippingPage.test.tsx`
- `src/styles/checkout-shipping.css`

**Visual authority:** inspect the checkout carrier-options screenshot before coding. A split checkout must look like the existing shipping-options block repeated per shipment; do not invent a wizard or dashboard.

**Interfaces:**

```ts
export type ShipmentShippingView = {
  shipmentId:string
  itemCount:number
  thumbnails:string[]
  method:'home'|'pickup'
  destinationLabel:string
  options:Array<{
    provider:'dhl'|'hermes'
    label:string
    promiseText:string
    cutoffText?:string
  }>
}

export function buildShippingView(input: CheckoutShippingInput): ShipmentShippingView[]
```

**Behavioral requirements:**
- single shipment preserves current DHL/Hermes radio-row pattern;
- split order shows both shipment blocks on the same `Versand` step;
- header uses tiny thumbnails + item count only;
- both shipments inherit order-level destination initially;
- `Lieferart ändern` expands inline for only the selected shipment;
- changing shipment 1 to pickup must not change shipment 2;
- home rows show DHL/Hermes predictions specific to home service;
- pickup uses the selected pickup service/location prediction;
- most DHL/Hermes raw differences round to the same customer window; only fixture-defined differences become visible;
- no PUDO recommendation/cost messaging.

**Test cases:**
- one shipment -> one shipping block;
- split -> two blocks visible simultaneously;
- inheritance works;
- per-shipment override is isolated;
- `Lieferzeitraum` is visible under carrier labels;
- no DPD/recommendation copy/raw-model terms.

Run:

```bash
npm run test:run -- src/domain/checkout/buildShippingView.test.ts src/pages/CheckoutShippingPage.test.tsx
npm run check:design
npm run build
```

Expected: pass.

**Visual verification:** capture single-shipment and split-shipment `Versand` at 1440×900. Compare single shipment directly to the carrier-options reference; ensure split version is a minimal extension of that same structure.

**Commit:** `git commit -m "feat: add carrier-aware split shipping checkout"`

## Final pre-purchase gate

Before moving to the post-purchase plan, run:

```bash
npm run test:run
npm run check:design
npm run build
npx playwright test
```

Manually review the reference screenshot directory and compare every implemented customer-facing surface. Do not approve visual baselines until the implementation visibly matches the reference language and structure.