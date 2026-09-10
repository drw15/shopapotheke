# Visual fidelity map

Which reference screenshot governs which surface. Inspect the listed file
before building or changing that surface; do not work from memory.

Reference directory: `docs/reference/shop-apotheke-reference-screenshots/`

| Screenshot | Governs |
|---|---|
| `01-basket.jpg` | Retail header (white main row + peach category nav), basket width and row density, `Versand durch Shop Apotheke` peach panel and free-shipping progress, product row proportions, add-more product cards |
| `02-checkout-address-form.jpg` | Checkout header and stepper, form field geometry and rounding, info/error blocks, primary CTA proportions, page background |
| `03-checkout-home-selected.jpg` | `An eine Lieferadresse` selected state, red radio treatment, address card geometry, right-hand `Weitere Lieferoptionen` card, trust row, footer |
| `04-checkout-pickup-selected.jpg` | `An einen Abholort` selected state, pickup CTA, saved pickup-location row |
| `05-pickup-station-modal.jpg` | Pickup modal proportions: top search, filter checkbox row, station list left, map-style panel right, bottom selection CTA |
| `06-checkout-carrier-options.jpg` | `Versand` step: `Lieferung nach Hause:` block, DHL/Hermes radio rows, green `Lieferzeitraum` line, order summary card, `Weiter zur Zahlungsart` CTA |
| `07-pdp-postcode-known.jpg` | PDP delivery line with postcode set, green delivery text, red pin + postcode placement, NOW! block, quantity + basket CTA row |
| `08-pdp-postcode-unknown.jpg` | PDP fallback delivery line, `Ihre PLZ` affordance, NOW! prompt variant |
| `09-email-reference.jpg` | Email width and proportions, header/branding, peach brand and support surfaces, red pill CTA, support block typography |

## Known deliberate deviations

- The pickup modal uses a static map-style panel instead of a live map. No map
  SDK is loaded; the panel exists for layout fidelity only.
- The email reference is a registration email. The delay email borrows its
  visual language (peach surfaces, red CTA, support block), not its content.
  The secondary lavender app promo block is reference only and is not rebuilt.
- Personal data visible in the references is replaced with generic fixture
  data (`Max Mustermann`, `Musterstraße`).
- The thin top utility strip visible above the retail header in the basket
  reference is cropped in the source image and is not reproduced.
