import { getProduct } from '../../data/products'
import type { FulfilmentGroup } from '../types'

export type PlannedShipment = {
  id: string
  productIds: string[]
  fulfilmentGroup: FulfilmentGroup
}

/**
 * Prototype fulfilment planner.
 *
 * The rule is deliberately small: products in the Sevenum demo group can
 * consolidate into one shipment, and the fictional external-fulfilment product
 * travels separately.
 *
 * The customer never sees these group names, and the assignment is a demo
 * device for exercising split shipments - not a claim about how Redcare
 * actually fulfils any product.
 */
export function planShipments(productIds: string[]): PlannedShipment[] {
  const byGroup = new Map<FulfilmentGroup, string[]>()

  for (const productId of productIds) {
    const product = getProduct(productId)
    if (!product) continue

    const existing = byGroup.get(product.fulfilmentGroup)
    if (existing) existing.push(productId)
    else byGroup.set(product.fulfilmentGroup, [productId])
  }

  // Sevenum-group items ship first so shipment numbering follows the order the
  // customer sees in the basket.
  const order: FulfilmentGroup[] = ['sevenum-demo', 'external-demo']

  return order
    .filter((group) => byGroup.has(group))
    .map((group, index) => ({
      id: `shipment-${index + 1}`,
      productIds: byGroup.get(group)!,
      fulfilmentGroup: group,
    }))
}
