import { describe, expect, it } from 'vitest'
import { confirmOrder } from './confirmOrder'
import type { CheckoutReadyOrder } from './types'

const checkoutOrder: CheckoutReadyOrder = {
  orderId: '100500',
  createdAt: '2026-09-10T10:00:00Z',
  shipments: [
    {
      id: 's1',
      productIds: ['voltaren'],
      method: 'home',
      provider: 'dhl',
      destinationLabel: 'Musterstraße 11, 22083 Hamburg',
      promiseMin: '2026-09-11',
      promiseMax: '2026-09-14',
    },
  ],
}

describe('confirmOrder', () => {
  it('freezes the checkout promise and initialises the ETA separately', () => {
    const order = confirmOrder(checkoutOrder)
    const shipment = order.shipments[0]

    expect(shipment.confirmedPromiseMin).toBe('2026-09-11')
    expect(shipment.confirmedPromiseMax).toBe('2026-09-14')
    // The ETA starts equal to the promise but is a separate field from here on.
    expect(shipment.currentEtaMin).toBe('2026-09-11')
    expect(shipment.currentEtaMax).toBe('2026-09-14')
  })

  it('starts every shipment in the confirmed state', () => {
    expect(confirmOrder(checkoutOrder).shipments[0].status).toBe('confirmed')
  })

  it('gives a split order one confirmed promise per shipment', () => {
    const order = confirmOrder({
      ...checkoutOrder,
      shipments: [
        checkoutOrder.shipments[0],
        {
          id: 's2',
          productIds: ['bepanthen'],
          method: 'pickup',
          provider: 'hermes',
          destinationLabel: 'Waescherei Kinne, 22083 Hamburg',
          promiseMin: '2026-09-14',
          promiseMax: '2026-09-15',
        },
      ],
    })

    expect(order.shipments).toHaveLength(2)
    expect(order.shipments[0].confirmedPromiseMax).toBe('2026-09-14')
    expect(order.shipments[1].confirmedPromiseMax).toBe('2026-09-15')
  })

  it('preserves the confirmed promise when the ETA later moves', () => {
    const order = confirmOrder(checkoutOrder)
    const shipment = { ...order.shipments[0] }

    // A carrier event pushes the ETA out.
    shipment.currentEtaMax = '2026-09-16'

    expect(shipment.confirmedPromiseMax).toBe('2026-09-14')
    expect(shipment.currentEtaMax).toBe('2026-09-16')
  })

  it('carries the destination and carrier through to the order', () => {
    const shipment = confirmOrder(checkoutOrder).shipments[0]
    expect(shipment.provider).toBe('dhl')
    expect(shipment.method).toBe('home')
    expect(shipment.destinationLabel).toBe('Musterstraße 11, 22083 Hamburg')
  })
})
