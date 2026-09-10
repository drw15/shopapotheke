# Delivery Promise Pre-Purchase UI Implementation Plan

**Goal:** Build a high-fidelity Shop Apotheke-like PDP, basket, and checkout that expose the approved delivery-promise behavior without adding visible model or fulfilment complexity.

**Architecture:** React pages consume the domain services from the core-domain plan through shared state. Storefront and checkout use separate headers and page shells. Split fulfilment is only surfaced in basket when material and is rendered in checkout as repeated existing-style shipping blocks.

**Tech stack:** React, TypeScript, React Router, Testing Library, Playwright, plain CSS using locked Shop Apotheke tokens.

## Global Constraints

- Read the approved design and implementation index before coding.
- Do not use Tailwind or a component library.
- Use only the locked screenshot-derived visual tokens from the implementation index.
- No DPD. DHL and Hermes only.
- No generic ecommerce redesign, green promo banners, oversized cards, or recommendation badges.
- Retail pages use the retail header; checkout uses the stripped-down checkout header.
- Home vs pickup remains first-level. Carrier/provider choice follows it.
- NOW! may remain as a static unchanged legacy block only where useful for fidelity; it is not wired into the new prediction engine.
- No raw model metadata is rendered.
- No hidden demo-control UI.

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

`AGENTS.md` must repeat the Global Constraints and exact visual token table. It must state that the approved design is authoritative and agents may not silently change product rules.

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

**Behavior:**
- No postcode -> `Lieferung in 1–3 Werktagen` + `Ihre PLZ`.
- Supported postcode -> use pre-carrier home envelope from core domain.
- One home carrier unsafe -> PDP broadens to fallback.
- Calendar dates are customer-facing; raw days are not.
- Cutoff appears only when domain says it changes the displayed promise.
- Postcode changes silently recalculate. Do not show `Lieferzeit aktualisiert`.

**Failing test first:**

```tsx
it('replaces fallback silently after a supported postcode', async () => {
  const user = userEvent.setup()
  renderProduct('voltaren', null)
  expect(screen.getByText('Lieferung in 1–3 Werktagen')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name:/PLZ/i }))
  await user.type(screen.getByLabelText('PLZ'), '50667')
  await user.keyboard('{Enter}')
  expect(screen.getByText(/Voraussichtliche Lieferung/)).toBeInTheDocument()
  expect(screen.queryByText(/aktualisiert/i)).not.toBeInTheDocument()
})
```

Expected failure: PDP components missing.

**Visual implementation:**
- Match screenshot order: price area -> divider -> delivery line + postcode -> shipping line -> optional legacy NOW! card -> quantity + red `In den Warenkorb`.
- Purchase surface is `--sa-surface`.
- Availability/delivery green is `--sa-green`.
- CTA is pill-shaped `--sa-red`.
- Do not add new prediction card or explanation panel.
- Download current public product images and bundle locally. If exact image is unavailable, use neutral white placeholder with text; do not generate substitute art.

Run:

```bash
npm run test:run -- src/pages/ProductPage.test.tsx
npm run check:design
npm run build
```

**Commit:** `git commit -m "feat: add postcode-aware product promise UI"`

## Task 3: Build the Shop Apotheke basket and material-split treatment

**Create:**
- `src/components/basket/BasketItem.tsx`
- `src/components/basket/BasketDeliverySummary.tsx`
- `src/components/basket/BasketShipmentSummary.tsx`
- `src/components/basket/ProductSuggestionCard.tsx`
- `src/pages/BasketPage.tsx`
- `src/pages/BasketPage.test.tsx`
- `src/styles/basket.css`

**Failing test first:**

```tsx
it('shows a material split with product names but no fulfilment internals', () => {
  renderBasket({ productIds:['voltaren','vitamin-d3','vagisan'], postcode:'22083' })
  expect(screen.getByText('Ihre Bestellung kommt in 2 Lieferungen')).toBeInTheDocument()
  expect(screen.getByText(/Voltaren/)).toBeInTheDocument()
  expect(screen.getByText(/Vagisan/)).toBeInTheDocument()
  expect(screen.queryByText(/Sevenum/i)).not.toBeInTheDocument()
})
```

Expected failure: basket page missing.

**Visual implementation:**
- Match retail screenshot: `Ihr Warenkorb (n)` centered content.
- Recreate `Versand durch Shop Apotheke` panel with `--sa-peach-soft`, rounded 16px, progress bar in red.
- Product rows show image, name, pack/PZN, availability, quantity, delete icon, red price.
- If split is non-material, show one compact delivery summary.
- If split is material, show `Ihre Bestellung kommt in 2 Lieferungen`; each shipment shows small thumbnails + product names + calendar promise. Cutoff only if meaningful for that shipment.
- Do not repeat prices/quantity inside split summary.
- Keep `Gratis Versand? Einfach Warenkorb füllen` recommendation row to let reviewers add demo products naturally.

Run:

```bash
npm run test:run -- src/pages/BasketPage.test.tsx
npm run check:design
npm run build
```

**Commit:** `git commit -m "feat: add material split basket UI"`

## Task 4: Build checkout address and pickup selection

**Create:**
- `src/state/CheckoutContext.tsx`
- `src/data/demoAddresses.ts`
- `src/data/pickupLocations.ts`
- `src/components/checkout/DeliveryMethodSelector.tsx`
- `src/components/checkout/PickupStationModal.tsx`
- `src/components/checkout/PickupStationModal.test.tsx`
- `src/pages/CheckoutAddressPage.tsx`
- `src/pages/CheckoutAddressPage.test.tsx`
- `src/styles/checkout.css`

**State interface:**

```ts
export type Destination =
  | { method:'home'; addressId:string }
  | { method:'pickup'; pickupLocationId:string }

export type CheckoutState = {
  orderDestination: Destination
  shipmentDestinations: Record<string, Destination>
}
```

**Failing test first:**

```tsx
it('keeps home and pickup as first-level choices', async () => {
  renderCheckoutAddress('22083')
  expect(screen.getByText('An eine Lieferadresse')).toBeInTheDocument()
  expect(screen.getByText('An einen Abholort')).toBeInTheDocument()
  expect(screen.queryByText('Standard mit DHL')).not.toBeInTheDocument()
})
```

Expected failure: page missing.

**Visual implementation:**
- Match screenshot title `Wohin sollen wir Ihre Bestellung liefern?`.
- Left: address section then pickup section. Right: `Weitere Lieferoptionen` card.
- Use generic demo identity/address, never the user's screenshot address.
- Pickup modal mirrors screenshot: wide white overlay, title, full-width search input, filters, station list left, static map-style panel right.
- No live map integration.
- Create one fictional Hermes PaketShop, one DHL Paketshop/Filiale, one DHL Packstation per supported postcode.

Run tests/build/design check.

**Commit:** `git commit -m "feat: add checkout destination selection"`

## Task 5: Build single and split shipping-option checkout

**Create:**
- `src/domain/checkout/deliveryOptions.ts`
- `src/domain/checkout/deliveryOptions.test.ts`
- `src/components/checkout/CarrierOption.tsx`
- `src/components/checkout/ShipmentShippingCard.tsx`
- `src/components/checkout/ShipmentShippingCard.test.tsx`
- `src/pages/CheckoutShippingPage.tsx`
- `src/pages/CheckoutShippingPage.test.tsx`

**Interface:**

```ts
export type ShippingOption = {
  id:string
  method:'home'|'pickup'
  provider:'dhl'|'hermes'
  label:string
  destinationLabel:string
  promise:CustomerPromise
}

export function getDeliveryOptions(input:{ shipment:PlannedShipment; destination:Destination; postcode:string; now:Date }): ShippingOption[]
```

**Rules:**
- Home -> DHL and Hermes home options.
- Pickup -> selected station/provider option only.
- Split shipments inherit order-level destination at initialization.
- `Lieferart ändern` expands inline for the selected shipment only.
- Changing shipment 1 must not mutate shipment 2.

**Failing test first:**

```tsx
it('changes only the selected shipment destination', async () => {
  const user = userEvent.setup()
  renderSplitShipping()
  const buttons = screen.getAllByRole('button', { name:'Lieferart ändern' })
  await user.click(buttons[0])
  await user.click(screen.getByLabelText('An einen Abholort'))
  selectFirstHermesPickup(user)
  expect(screen.getByTestId('shipment-1-destination')).toHaveTextContent('Abholort')
  expect(screen.getByTestId('shipment-2-destination')).toHaveTextContent('Nach Hause')
})
```

Expected failure: split shipping card missing.

**Visual implementation:**
- Single shipment keeps screenshot title `Bitte wählen Sie eine Versandoption`.
- Main left shipping card + right totals summary; preserve ~565px / ~398px relation.
- Carrier rows: radio, `Standard mit DHL` / `Standard mit HERMES`, green `Lieferzeitraum`, `€ 0,00`.
- Split: show `Ihre Bestellung kommt in 2 Lieferungen`, then two existing-style shipping blocks stacked in same main column.
- Shipment header uses tiny thumbnails + `2 Artikel` / `1 Artikel`, no repeated names.
- Show inherited destination and `Lieferart ändern`.
- `Lieferart ändern` reuses home/pickup hierarchy inline.
- No new wizard, no recommendation badge, no DPD.

Run:

```bash
npm run test:run -- src/domain/checkout src/components/checkout src/pages/CheckoutShippingPage.test.tsx
npm run check:design
npm run build
```

**Commit:** `git commit -m "feat: add split shipment shipping checkout"`

## Pre-purchase completion gate

At 1440x900 manually compare PDP, basket, address, pickup modal, and shipping checkout against the provided screenshots. Then run:

```bash
npm run test:run
npm run check:design
npm run build
```

Do not proceed if tests are green but the pages visually drift into a generic ecommerce design.
