import { describe, expect, it } from 'vitest'
import { buildStandardHomeEnvelope } from './buildCarrierEnvelope'
import { buildCustomerPromise } from './buildPromise'
import { PROMISE_POLICY } from '../../config/promisePolicy'

const berlin = (iso: string, hour: number, minute = 0) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, hour - 2, minute, 0))
}

const THURSDAY_AFTERNOON = berlin('2026-09-10', 14)

describe('buildStandardHomeEnvelope', () => {
  it('covers both standard home carriers when both are safe', () => {
    // Berlin + Fenistil is the one deliberate visible carrier difference:
    // DHL 2-3 business days, Hermes 2-4. The envelope must span both.
    const dhl = buildCustomerPromise({
      productId: 'fenistil',
      postcode: '10115',
      method: 'home',
      provider: 'dhl',
      now: THURSDAY_AFTERNOON,
    })
    const hermes = buildCustomerPromise({
      productId: 'fenistil',
      postcode: '10115',
      method: 'home',
      provider: 'hermes',
      now: THURSDAY_AFTERNOON,
    })
    const envelope = buildStandardHomeEnvelope({
      productIds: ['fenistil'],
      postcode: '10115',
      now: THURSDAY_AFTERNOON,
    })

    expect(dhl.kind).toBe('precise')
    expect(hermes.kind).toBe('precise')
    expect(envelope.kind).toBe('precise')

    // Earliest of the two lower bounds, latest of the two upper bounds.
    expect(envelope.minDate).toBe(
      dhl.minDate! < hermes.minDate! ? dhl.minDate : hermes.minDate,
    )
    expect(envelope.maxDate).toBe(
      dhl.maxDate! > hermes.maxDate! ? dhl.maxDate : hermes.maxDate,
    )
    expect(envelope.maxDate).toBe(hermes.maxDate)
  })

  it('falls back when an eligible carrier is unsafe, rather than advertising the safe one', () => {
    // München + Fenistil: DHL is safe, Hermes fails the confidence gate.
    // The unsafe carrier contributes fallback, so the upper funnel must not
    // promise more than the standard options can support.
    const dhl = buildCustomerPromise({
      productId: 'fenistil',
      postcode: '80331',
      method: 'home',
      provider: 'dhl',
      now: THURSDAY_AFTERNOON,
    })
    const hermes = buildCustomerPromise({
      productId: 'fenistil',
      postcode: '80331',
      method: 'home',
      provider: 'hermes',
      now: THURSDAY_AFTERNOON,
    })
    const envelope = buildStandardHomeEnvelope({
      productIds: ['fenistil'],
      postcode: '80331',
      now: THURSDAY_AFTERNOON,
    })

    expect(dhl.kind).toBe('precise')
    expect(hermes.kind).toBe('fallback')
    expect(envelope.kind).toBe('fallback')
    expect(envelope.label).toBe(PROMISE_POLICY.fallbackLabel)
  })

  it('falls back when both carriers are unsafe', () => {
    const envelope = buildStandardHomeEnvelope({
      productIds: ['ibu'],
      postcode: '80331',
      now: THURSDAY_AFTERNOON,
    })
    expect(envelope.kind).toBe('fallback')
  })

  it('falls back for an unsupported postcode', () => {
    const envelope = buildStandardHomeEnvelope({
      productIds: ['voltaren'],
      postcode: '99999',
      now: THURSDAY_AFTERNOON,
    })
    expect(envelope.kind).toBe('fallback')
  })

  it('falls back when any product in the basket is outside the model', () => {
    const envelope = buildStandardHomeEnvelope({
      productIds: ['voltaren', 'vagisan'],
      postcode: '50667',
      now: THURSDAY_AFTERNOON,
    })
    expect(envelope.kind).toBe('fallback')
  })

  it('uses the slowest product as the constraint for a multi-product envelope', () => {
    const single = buildStandardHomeEnvelope({
      productIds: ['voltaren'],
      postcode: '10115',
      now: THURSDAY_AFTERNOON,
    })
    const withSlower = buildStandardHomeEnvelope({
      productIds: ['voltaren', 'fenistil'],
      postcode: '10115',
      now: THURSDAY_AFTERNOON,
    })

    expect(single.kind).toBe('precise')
    expect(withSlower.kind).toBe('precise')
    // Fenistil/Hermes reaches 2-4 days in Berlin, so the pair must not promise
    // earlier than the slowest item allows.
    expect(withSlower.maxDate! >= single.maxDate!).toBe(true)
  })

  it('keeps the cutoff hint when it still changes the enveloped promise', () => {
    const envelope = buildStandardHomeEnvelope({
      productIds: ['voltaren'],
      postcode: '50667',
      now: berlin('2026-09-10', 18, 30),
    })
    expect(envelope.cutoffText).toBe('Bei Bestellung bis 19:00')
  })

  it('produces a single-day label when both bounds collapse to one day', () => {
    // Hamburg is a 2-2 business day lane for both carriers.
    const envelope = buildStandardHomeEnvelope({
      productIds: ['voltaren'],
      postcode: '22083',
      now: THURSDAY_AFTERNOON,
    })
    expect(envelope.kind).toBe('precise')
    expect(envelope.minDate).toBe(envelope.maxDate)
    expect(envelope.label).toBe('Mo., 14. September')
  })
})
