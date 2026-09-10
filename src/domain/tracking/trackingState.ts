import { toGermanPromiseLabel } from '../calendar/businessCalendar'
import type { ConfirmedShipment } from '../order/types'

export type ShipmentTrackingState = {
  isDelayed: boolean
  isDelivered: boolean
  /** Present only when the promise has been broken. */
  headline?: string
  currentEtaText: string
  /** Present only when delayed: the promise stays visible as context. */
  originalPromiseText?: string
}

const parseIso = (iso: string): Date => {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

const label = (min: string, max: string) => toGermanPromiseLabel(parseIso(min), parseIso(max))

/**
 * Compare what Redcare promised with what it now expects.
 *
 * A shipment is delayed when its latest expected date passes the latest
 * promised date. Landing exactly on the promised day is still on time.
 *
 * When delayed, both dates are surfaced. Replacing the promise with the new ETA
 * would hide the fact that a commitment was broken, which is what makes delays
 * feel dishonest and drives customers to ask where their parcel is.
 */
export function getShipmentTrackingState(shipment: ConfirmedShipment): ShipmentTrackingState {
  const isDelivered = shipment.status === 'delivered'
  const isDelayed = !isDelivered && shipment.currentEtaMax > shipment.confirmedPromiseMax

  const currentEtaText = label(shipment.currentEtaMin, shipment.currentEtaMax)

  if (!isDelayed) return { isDelayed: false, isDelivered, currentEtaText }

  return {
    isDelayed: true,
    isDelivered,
    headline: 'Ihre Lieferung verspätet sich',
    currentEtaText,
    originalPromiseText: label(shipment.confirmedPromiseMin, shipment.confirmedPromiseMax),
  }
}
