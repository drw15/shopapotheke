import type { CheckoutReadyOrder, Order } from './types'

/**
 * The moment an estimate becomes a promise.
 *
 * Before this point the delivery information is an estimate and may be
 * recalculated silently as context changes. Here the final checkout estimate is
 * copied into the immutable confirmed-promise fields, and the current ETA
 * starts life as a separate value that fulfilment events are free to move.
 *
 * Nothing downstream may write back to the confirmed promise.
 */
export function confirmOrder(input: CheckoutReadyOrder): Order {
  return {
    id: input.orderId,
    createdAt: input.createdAt,
    shipments: input.shipments.map((shipment) => ({
      id: shipment.id,
      productIds: shipment.productIds,
      method: shipment.method,
      provider: shipment.provider,
      destinationLabel: shipment.destinationLabel,
      confirmedPromiseMin: shipment.promiseMin,
      confirmedPromiseMax: shipment.promiseMax,
      currentEtaMin: shipment.promiseMin,
      currentEtaMax: shipment.promiseMax,
      status: 'confirmed',
    })),
  }
}
