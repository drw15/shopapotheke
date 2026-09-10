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

describe('isMaterialSplit', () => {
  it('is not material when both shipments arrive in the same window', () => {
    expect(
      isMaterialSplit({
        postcode: '50667',
        promises: [precise('2026-09-14', '2026-09-15'), precise('2026-09-14', '2026-09-15')],
      }),
    ).toBe(false)
  })

  it('is material when one shipment arrives a delivery day earlier', () => {
    expect(
      isMaterialSplit({
        postcode: '50667',
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
        promises: [precise('2026-09-11', '2026-09-11'), precise('2026-09-14', '2026-09-14')],
      }),
    ).toBe(true)
  })

  it('is material when an actionable cutoff changes the earlier shipment', () => {
    expect(
      isMaterialSplit({
        postcode: '50667',
        promises: [
          precise('2026-09-14', '2026-09-15', 'Bei Bestellung bis 19:00'),
          precise('2026-09-14', '2026-09-15'),
        ],
      }),
    ).toBe(true)
  })

  it('is not material for a single shipment', () => {
    expect(
      isMaterialSplit({ postcode: '50667', promises: [precise('2026-09-14', '2026-09-15')] }),
    ).toBe(false)
  })

  it('is not material when both shipments fall back to the same broad promise', () => {
    expect(isMaterialSplit({ postcode: '50667', promises: [fallback, fallback] })).toBe(false)
  })

  it('is not material when a precise shipment cannot be compared with a fallback', () => {
    // Without dates on both sides there is no honest earlier/later claim to
    // make, so the basket stays simple rather than inventing a comparison.
    expect(
      isMaterialSplit({
        postcode: '50667',
        promises: [precise('2026-09-11', '2026-09-11'), fallback],
      }),
    ).toBe(false)
  })

  it('compares the latest promised dates, not the earliest', () => {
    // Overlapping windows ending on the same day are not a material difference
    // even though one starts earlier.
    expect(
      isMaterialSplit({
        postcode: '50667',
        promises: [precise('2026-09-11', '2026-09-15'), precise('2026-09-14', '2026-09-15')],
      }),
    ).toBe(false)
  })
})
