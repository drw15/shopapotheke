import { describe, expect, it } from 'vitest'
import { getShipmentTrackingState } from './trackingState'
import type { ConfirmedShipment } from '../order/types'

const shipment = (overrides: Partial<ConfirmedShipment> = {}): ConfirmedShipment => ({
  id: 's1',
  productIds: ['voltaren'],
  method: 'home',
  provider: 'dhl',
  destinationLabel: 'Musterstraße 11, 22083 Hamburg',
  confirmedPromiseMin: '2026-09-11',
  confirmedPromiseMax: '2026-09-14',
  currentEtaMin: '2026-09-11',
  currentEtaMax: '2026-09-14',
  status: 'in_transit',
  ...overrides,
})

describe('shipment tracking state', () => {
  it('is not delayed while the ETA sits inside the promise', () => {
    const state = getShipmentTrackingState(shipment({ currentEtaMax: '2026-09-12' }))
    expect(state.isDelayed).toBe(false)
    expect(state.headline).toBeUndefined()
  })

  it('is not delayed when the ETA lands exactly on the promised day', () => {
    expect(getShipmentTrackingState(shipment()).isDelayed).toBe(false)
  })

  it('is delayed once the ETA passes the promised day', () => {
    const state = getShipmentTrackingState(shipment({ currentEtaMax: '2026-09-15' }))
    expect(state.isDelayed).toBe(true)
    expect(state.headline).toBe('Ihre Lieferung verspätet sich')
  })

  it('shows the new ETA and the original promise together when delayed', () => {
    const state = getShipmentTrackingState(
      shipment({ currentEtaMin: '2026-09-15', currentEtaMax: '2026-09-15' }),
    )

    expect(state.currentEtaText).toBe('Di., 15. September')
    expect(state.originalPromiseText).toBe('Fr., 11. – Mo., 14. September')
  })

  it('never overwrites the confirmed promise with the ETA', () => {
    const delayed = shipment({ currentEtaMax: '2026-09-16' })
    getShipmentTrackingState(delayed)
    expect(delayed.confirmedPromiseMax).toBe('2026-09-14')
  })

  it('keeps a delivered shipment delivered even if it arrived late', () => {
    const state = getShipmentTrackingState(
      shipment({ status: 'delivered', currentEtaMax: '2026-09-16' }),
    )
    expect(state.isDelivered).toBe(true)
  })

  it('evaluates shipments independently', () => {
    const onTime = getShipmentTrackingState(shipment({ id: 's1', status: 'delivered' }))
    const late = getShipmentTrackingState(shipment({ id: 's2', currentEtaMax: '2026-09-17' }))

    expect(onTime.isDelayed).toBe(false)
    expect(late.isDelayed).toBe(true)
  })

  it('does not expose an exception headline for a normal order', () => {
    const state = getShipmentTrackingState(shipment({ status: 'preparing' }))
    expect(state.headline).toBeUndefined()
    expect(state.originalPromiseText).toBeUndefined()
  })
})
