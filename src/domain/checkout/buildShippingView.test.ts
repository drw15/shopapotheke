import { describe, expect, it } from 'vitest'
import { buildShippingView } from './buildShippingView'
import { DEMO_ADDRESS } from '../../state/CheckoutContext'
import { findPickupLocation } from '../../data/pickupLocations'
import type { Destination } from './types'

const THURSDAY = new Date(Date.UTC(2026, 8, 10, 12, 0, 0))

const homeDestination: Destination = {
  method: 'home',
  address: { ...DEMO_ADDRESS, postcode: '22083', city: 'Hamburg' },
}

const allHome = () => homeDestination

describe('buildShippingView', () => {
  it('builds one block for a single-shipment order', () => {
    const view = buildShippingView({
      productIds: ['voltaren', 'vitamin-d3'],
      postcode: '22083',
      now: THURSDAY,
      destinationFor: allHome,
    })

    expect(view).toHaveLength(1)
    expect(view[0].itemCount).toBe(2)
    expect(view[0].thumbnails).toHaveLength(2)
  })

  it('offers exactly DHL and Hermes for home delivery', () => {
    const view = buildShippingView({
      productIds: ['voltaren'],
      postcode: '22083',
      now: THURSDAY,
      destinationFor: allHome,
    })

    expect(view[0].options.map((option) => option.provider)).toEqual(['dhl', 'hermes'])
    expect(view[0].options.map((option) => option.label)).toEqual([
      'Standard mit DHL',
      'Standard mit HERMES',
    ])
  })

  it('builds two blocks for a split order', () => {
    const view = buildShippingView({
      productIds: ['voltaren', 'bepanthen'],
      postcode: '22083',
      now: THURSDAY,
      destinationFor: allHome,
    })

    expect(view).toHaveLength(2)
    expect(view[0].itemCount).toBe(1)
    expect(view[1].itemCount).toBe(1)
  })

  it('inherits the order destination for every shipment by default', () => {
    const view = buildShippingView({
      productIds: ['voltaren', 'bepanthen'],
      postcode: '22083',
      now: THURSDAY,
      destinationFor: allHome,
    })

    expect(view[0].method).toBe('home')
    expect(view[1].method).toBe('home')
    expect(view[0].destinationLabel).toBe(view[1].destinationLabel)
  })

  it('applies a per-shipment override to that shipment only', () => {
    const station = findPickupLocation('hh-1')!
    const view = buildShippingView({
      productIds: ['voltaren', 'bepanthen'],
      postcode: '22083',
      now: THURSDAY,
      destinationFor: (shipmentId) =>
        shipmentId === 'shipment-1'
          ? { method: 'pickup', location: station }
          : homeDestination,
    })

    expect(view[0].method).toBe('pickup')
    expect(view[0].destinationLabel).toMatch(/Waescherei Kinne/)
    // The second shipment is untouched.
    expect(view[1].method).toBe('home')
    expect(view[1].destinationLabel).toMatch(/Musterstraße/)
  })

  it('constrains a multi-item shipment by its slowest item', () => {
    const single = buildShippingView({
      productIds: ['voltaren'],
      postcode: '10115',
      now: THURSDAY,
      destinationFor: allHome,
    })
    const pair = buildShippingView({
      productIds: ['voltaren', 'fenistil'],
      postcode: '10115',
      now: THURSDAY,
      destinationFor: allHome,
    })

    const latest = (v: typeof single) =>
      v[0].options.map((o) => (o.promise.kind === 'precise' ? o.promise.maxDate : 'z')).sort().at(-1)!

    expect(latest(pair) >= latest(single)).toBe(true)
  })

  it('falls back for the whole shipment when one item is unpredictable', () => {
    const view = buildShippingView({
      productIds: ['voltaren', 'vagisan'],
      postcode: '22083',
      now: THURSDAY,
      destinationFor: allHome,
    })

    // Vagisan ships separately, so its own block is the fallback one.
    const vagisanBlock = view[1]
    expect(vagisanBlock.options.every((option) => option.promise.kind === 'fallback')).toBe(true)
  })

  it('shows a visible carrier difference where the fixture produces one', () => {
    const view = buildShippingView({
      productIds: ['fenistil'],
      postcode: '10115',
      now: THURSDAY,
      destinationFor: allHome,
    })

    const [dhl, hermes] = view[0].options
    expect(dhl.promise.kind).toBe('precise')
    expect(hermes.promise.kind).toBe('precise')
    expect(dhl.promise.label).not.toBe(hermes.promise.label)
  })

  it('shows the same window for both carriers where rounding absorbs the difference', () => {
    const view = buildShippingView({
      productIds: ['voltaren'],
      postcode: '22083',
      now: THURSDAY,
      destinationFor: allHome,
    })

    const [dhl, hermes] = view[0].options
    expect(dhl.promise.label).toBe(hermes.promise.label)
  })
})
