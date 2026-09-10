import type { Product } from '../domain/types'

/**
 * Demo catalogue. Five products so reviewers can build both single-shipment
 * and split-shipment baskets.
 *
 * MOCK DATA. The fulfilment assignment below is fictional and exists only to
 * exercise the unsupported-model and split-shipment paths. It does not
 * describe where Redcare actually fulfils any product, and the customer-facing
 * UI never shows these labels.
 */
export const PRODUCTS: Product[] = [
  {
    id: 'voltaren',
    name: 'Voltaren Schmerzgel forte 23,2 mg/g Gel mit Diclofenac',
    packSize: 'Packungsgröße: 2x30 g | Gel',
    pzn: '08110607',
    priceCents: 959,
    strikePriceCents: 1299,
    basePriceLabel: '159,83 € / 1 kg',
    image: '/assets/products/voltaren.svg',
    fulfilmentGroup: 'sevenum-demo',
    modelEligible: true,
  },
  {
    id: 'vitamin-d3',
    name: 'Vitamin D3 2000 I.E. VIGANTOLVIT Weichkapseln',
    packSize: 'Packungsgröße: 120 St | Weichkapseln',
    pzn: '16227722',
    priceCents: 1599,
    strikePriceCents: 1799,
    basePriceLabel: '0,13 EUR / 1 st',
    image: '/assets/products/vitamin-d3.svg',
    fulfilmentGroup: 'sevenum-demo',
    modelEligible: true,
  },
  {
    id: 'fenistil',
    name: 'Fenistil Kühl Roll-on, Kosmetikum beruhigt bei Insektenstichen',
    packSize: 'Packungsgröße: 8 ml | Roll-on',
    pzn: '08585997',
    priceCents: 799,
    strikePriceCents: 996,
    basePriceLabel: '998,75 EUR / 1 l',
    image: '/assets/products/fenistil.svg',
    fulfilmentGroup: 'sevenum-demo',
    modelEligible: true,
  },
  {
    id: 'ibu',
    name: 'Ibu-ratiopharm 400 mg akut Schmerztabletten',
    packSize: 'Packungsgröße: 50 St | Filmtabletten',
    pzn: '11524609',
    priceCents: 1149,
    basePriceLabel: '0,23 EUR / 1 st',
    image: '/assets/products/ibu.svg',
    fulfilmentGroup: 'sevenum-demo',
    modelEligible: true,
  },
  {
    id: 'vagisan',
    name: 'Vagisan FeuchtCreme: Hormonfreie Vaginalcreme bei Scheidentrockenheit',
    packSize: 'Packungsgröße: 25 g | Creme',
    pzn: '06892952',
    priceCents: 1139,
    basePriceLabel: '455,60 EUR / 1 kg',
    image: '/assets/products/vagisan.svg',
    // Fictional external assignment: drives fallback + split demonstrations.
    fulfilmentGroup: 'external-demo',
    modelEligible: false,
  },
]

export function getProduct(productId: string): Product | undefined {
  return PRODUCTS.find((product) => product.id === productId)
}

export function requireProduct(productId: string): Product {
  const product = getProduct(productId)
  if (!product) throw new Error(`Unknown demo product: ${productId}`)
  return product
}
