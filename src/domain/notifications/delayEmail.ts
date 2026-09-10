import type { Order } from '../order/types'
import { getShipmentTrackingState } from '../tracking/trackingState'

export type DelayEmailView = {
  subject: string
  greeting: string
  newEtaText: string
  originalPromiseText: string
  trackingHref: string
}

/** Generic fixture recipient; never personal data from the references. */
const CUSTOMER_NAME = 'Max Mustermann'

/**
 * Proactive delay notification.
 *
 * Built from exactly the same order state that drives tracking - there is no
 * separate email fixture with its own dates. If Redcare already knows the
 * promise is broken, the customer should hear it before they go looking.
 *
 * Returns null when nothing is delayed: an order that is on time has no
 * proactive message to send.
 */
export function buildDelayEmail(order: Order): DelayEmailView | null {
  const delayed = order.shipments
    .map((shipment) => getShipmentTrackingState(shipment))
    .find((state) => state.isDelayed)

  if (!delayed || !delayed.originalPromiseText) return null

  return {
    subject: 'Ihre Lieferung verspätet sich',
    greeting: `Guten Tag ${CUSTOMER_NAME},`,
    newEtaText: delayed.currentEtaText,
    originalPromiseText: delayed.originalPromiseText,
    trackingHref: `/orders/${order.id}`,
  }
}
