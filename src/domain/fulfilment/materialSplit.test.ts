import { describe, expect, it } from 'vitest'
import { isMaterialSplit } from './materialSplit'
import type { CustomerPromise } from '../promise/types'

const precise = (min: string, max: string, cutoffText?: string): CustomerPromise => ({
  kind: 'precise',
  minDate: min,
  maxDate: max,
  label: `${min} – ${max}`,
  ...(cutoffText ? { cutoffText } : {}),
})

const fallback: CustomerPromise = { kind: 'fallback', label: 'Lieferung in 1–3 Werktagen' }

/** Thursday 10 September 2026, 14:00 Berlin. */
const NOW = new Date(Date.UTC(2026, 8, 10, 12, 0, 0))

describe('isMaterialSplit', () => {
  it('is not material when both shipments arrive in the same window', () => {
    expect(
      isMaterialSplit({
        postcode: '50667',
        now: NOW,
        promises: [precise('2026-09-14', '2026-09-15'), precise('2026-09-14', '2026-09-15')],
      }),
    ).toBe(false)
  })

  it('is material when one shipment arrives a delivery day earlier', () => {
    expect(
      isMaterialSplit({
        postcode: '50667',
        now: NOW,
        promises: [precise('2026-09-14', '2026-09-14'), precise('2026-09-15', '2026-09-15')],
      }),
    ).toBe(true)
  })

  it('is material across a weekend even though it is one business day', () => {
    // Friday vs Monday: one business-day step, three calendar days for the
    // customer, so this is exactly the case worth surfacing.
    expect(
      isMaterialSplit({
        postcode: '50667',
        now: NOW,
        promises: [precise('2026-09-11', '2026-09-11'), precise('2026-09-14', '2026-09-14')],
      }),
    ).toBe(true)
  })

  it('is not material for a single shipment', () => {
    expect(
      isMaterialSplit({ postcode: '50667', now: NOW, promises: [precise('2026-09-14', '2026-09-15')] }),
    ).toBe(false)
  })

  it('is not material when both shipments fall back to the same broad promise', () => {
    expect(isMaterialSplit({ postcode: '50667', now: NOW, promises: [fallback, fallback] })).toBe(
      false,
    )
  })

  it('compares a fallback shipment by the dates behind 1-3 Werktage', () => {
    // A fallback is still a promise. From Thursday 10 September it resolves to
    // Friday-Tuesday, so a shipment landing on Friday is materially earlier.
    expect(
      isMaterialSplit({
        postcode: '50667',
        now: NOW,
        promises: [precise('2026-09-11', '2026-09-11'), fallback],
      }),
    ).toBe(true)
  })

  it('is not material when a precise shipment lands with the fallback window', () => {
    // Same Thursday: the broad promise reaches Tuesday 15 September, so a
    // precise shipment ending on the same day adds nothing to say.
    expect(
      isMaterialSplit({
        postcode: '50667',
        now: NOW,
        promises: [precise('2026-09-11', '2026-09-15'), fallback],
      }),
    ).toBe(false)
  })

  it('compares the latest promised dates, not the earliest', () => {
    // Overlapping windows ending on the same day are not a material difference
    // even though one starts earlier.
    expect(
      isMaterialSplit({
        postcode: '50667',
        now: NOW,
        promises: [precise('2026-09-11', '2026-09-15'), precise('2026-09-14', '2026-09-15')],
      }),
    ).toBe(false)
  })
})
