import { describe, expect, it } from 'vitest'
import { buildDelayEmail } from './delayEmail'
import { buildDemoOrders } from '../../data/demoOrders'
import { getShipmentTrackingState } from '../tracking/trackingState'

const NOW = new Date(2026, 8, 10, 14, 0, 0)
const orders = buildDemoOrders(NOW)
const order = (id: string) => orders.find((entry) => entry.id === id)!

describe('proactive delay email', () => {
  it('is eligible for the delayed demo order', () => {
    const email = buildDelayEmail(order('100422'))
    expect(email).not.toBeNull()
    expect(email!.subject).toBe('Ihre Lieferung verspätet sich')
  })

  it('reads the same dates tracking shows, with no separate fixture', () => {
    const target = order('100422')
    const email = buildDelayEmail(target)!
    const tracking = getShipmentTrackingState(target.shipments[0])

    expect(email.newEtaText).toBe(tracking.currentEtaText)
    expect(email.originalPromiseText).toBe(tracking.originalPromiseText)
  })

  it('keeps the original promise alongside the new date', () => {
    const email = buildDelayEmail(order('100422'))!
    expect(email.newEtaText).not.toBe(email.originalPromiseText)
    expect(email.originalPromiseText).toBeTruthy()
  })

  it('is not eligible for an on-time order', () => {
    expect(buildDelayEmail(order('100421'))).toBeNull()
  })

  it('is not eligible for a completed order', () => {
    expect(buildDelayEmail(order('100424'))).toBeNull()
  })

  it('is not eligible for a split order whose shipments are all fine', () => {
    expect(buildDelayEmail(order('100423'))).toBeNull()
  })

  it('links to the order it describes', () => {
    expect(buildDelayEmail(order('100422'))!.trackingHref).toBe('/orders/100422')
  })

  it('uses generic demo customer data', () => {
    expect(buildDelayEmail(order('100422'))!.greeting).toBe('Guten Tag Max Mustermann,')
  })
})
