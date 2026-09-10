import { describe, expect, it } from 'vitest'
import { planShipments } from './shipmentPlanner'

describe('planShipments', () => {
  it('consolidates same-fulfilment products into one shipment', () => {
    const shipments = planShipments(['voltaren', 'vitamin-d3', 'fenistil'])
    expect(shipments).toHaveLength(1)
    expect(shipments[0].productIds).toEqual(['voltaren', 'vitamin-d3', 'fenistil'])
  })

  it('separates the external-fulfilment product into its own shipment', () => {
    const shipments = planShipments(['voltaren', 'vagisan'])
    expect(shipments).toHaveLength(2)
    expect(shipments[0].productIds).toEqual(['voltaren'])
    expect(shipments[1].productIds).toEqual(['vagisan'])
  })

  it('returns a single shipment for the external product alone', () => {
    const shipments = planShipments(['vagisan'])
    expect(shipments).toHaveLength(1)
    expect(shipments[0].fulfilmentGroup).toBe('external-demo')
  })

  it('returns no shipments for an empty basket', () => {
    expect(planShipments([])).toEqual([])
  })

  it('gives each shipment a stable identifier', () => {
    const shipments = planShipments(['voltaren', 'vagisan'])
    expect(shipments.map((s) => s.id)).toEqual(['shipment-1', 'shipment-2'])
  })

  it('ignores unknown product ids rather than throwing', () => {
    const shipments = planShipments(['voltaren', 'not-a-product'])
    expect(shipments).toHaveLength(1)
    expect(shipments[0].productIds).toEqual(['voltaren'])
  })
})
