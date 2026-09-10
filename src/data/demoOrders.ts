import { addDeliveryDays } from '../domain/calendar/businessCalendar'
import { toIsoDate } from '../domain/promise/buildPromise'
import type { Order } from '../domain/order/types'

/**
 * Four deterministic demo orders so reviewers can explore post-purchase
 * behaviour without a hidden control panel.
 *
 * Dates are generated relative to the viewer's current date rather than fixed
 * to calendar dates, so the orders never go stale. The relationships between
 * promise and ETA are what matter and those are fixed.
 */

const DEMO_POSTCODE = '22083'
const HOME = 'Musterstraße 11, 22083 Hamburg'
const PICKUP = 'Waescherei Kinne, Beethovenstr. 22, 22083 Hamburg'

/** Business days from today, as an ISO date. */
const day = (offset: number, now: Date) =>
  toIsoDate(addDeliveryDays(now, Math.abs(offset), DEMO_POSTCODE))

/** Business days before today. */
const daysAgo = (offset: number, now: Date) => {
  const past = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset, 12, 0, 0, 0)
  return toIsoDate(addDeliveryDays(past, 0, DEMO_POSTCODE))
}

export function buildDemoOrders(now: Date): Order[] {
  return [
    // #100421 - on time. The ETA is still inside the promised window.
    {
      id: '100421',
      createdAt: daysAgo(1, now),
      shipments: [
        {
          id: 's1',
          productIds: ['voltaren', 'vitamin-d3'],
          method: 'home',
          provider: 'dhl',
          destinationLabel: HOME,
          confirmedPromiseMin: day(1, now),
          confirmedPromiseMax: day(2, now),
          currentEtaMin: day(1, now),
          currentEtaMax: day(2, now),
          status: 'in_transit',
        },
      ],
    },

    // #100422 - delayed. The ETA has moved past the promise, which drives both
    // the tracking delay treatment and the proactive email.
    {
      id: '100422',
      createdAt: daysAgo(2, now),
      shipments: [
        {
          id: 's1',
          productIds: ['fenistil'],
          method: 'home',
          provider: 'hermes',
          destinationLabel: HOME,
          confirmedPromiseMin: daysAgo(1, now),
          confirmedPromiseMax: day(0, now),
          currentEtaMin: day(2, now),
          currentEtaMax: day(2, now),
          status: 'in_transit',
        },
      ],
    },

    // #100423 - split: one parcel delivered, one still travelling. A delivered
    // shipment stays delivered regardless of what the other one does.
    {
      id: '100423',
      createdAt: daysAgo(3, now),
      shipments: [
        {
          id: 's1',
          productIds: ['voltaren'],
          method: 'home',
          provider: 'dhl',
          destinationLabel: HOME,
          confirmedPromiseMin: daysAgo(1, now),
          confirmedPromiseMax: daysAgo(1, now),
          currentEtaMin: daysAgo(1, now),
          currentEtaMax: daysAgo(1, now),
          status: 'delivered',
        },
        {
          id: 's2',
          productIds: ['bepanthen'],
          method: 'pickup',
          provider: 'hermes',
          destinationLabel: PICKUP,
          confirmedPromiseMin: day(1, now),
          confirmedPromiseMax: day(2, now),
          currentEtaMin: day(1, now),
          currentEtaMax: day(2, now),
          status: 'in_transit',
        },
      ],
    },

    // #100424 - completed normally.
    {
      id: '100424',
      createdAt: daysAgo(6, now),
      shipments: [
        {
          id: 's1',
          productIds: ['ibu'],
          method: 'home',
          provider: 'dhl',
          destinationLabel: HOME,
          confirmedPromiseMin: daysAgo(3, now),
          confirmedPromiseMax: daysAgo(2, now),
          currentEtaMin: daysAgo(3, now),
          currentEtaMax: daysAgo(2, now),
          status: 'delivered',
        },
      ],
    },
  ]
}

export function findDemoOrder(orderId: string, now: Date): Order | undefined {
  return buildDemoOrders(now).find((order) => order.id === orderId)
}
