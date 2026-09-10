import type { DeliveryMethod, Provider } from '../types'

export type ShipmentStatus = 'confirmed' | 'preparing' | 'in_transit' | 'delivered'

/**
 * A shipment after the order has been confirmed.
 *
 * `confirmedPromiseMin` and `confirmedPromiseMax` are what Redcare committed to
 * at confirmation and are never rewritten. `currentEtaMin` and `currentEtaMax`
 * move with fulfilment and carrier events.
 *
 * Keeping them apart is the whole point: once the promise can be overwritten,
 * a delay becomes invisible and promise accuracy cannot be measured.
 */
export type ConfirmedShipment = {
  id: string
  productIds: string[]
  method: DeliveryMethod
  provider: Provider
  destinationLabel: string
  readonly confirmedPromiseMin: string
  readonly confirmedPromiseMax: string
  currentEtaMin: string
  currentEtaMax: string
  status: ShipmentStatus
}

export type Order = {
  id: string
  createdAt: string
  shipments: ReadonlyArray<ConfirmedShipment>
}

/** What checkout hands over at the moment the customer confirms. */
export type CheckoutReadyOrder = {
  orderId: string
  createdAt: string
  shipments: Array<{
    id: string
    productIds: string[]
    method: DeliveryMethod
    provider: Provider
    destinationLabel: string
    /** The final customer-facing estimate shown at checkout. */
    promiseMin: string
    promiseMax: string
  }>
}
