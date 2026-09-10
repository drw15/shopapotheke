import { describe, expect, it } from 'vitest'
import { buildCustomerPromise } from './buildPromise'
import { PROMISE_POLICY } from '../../config/promisePolicy'

/** Berlin wall-clock instant (CEST = UTC+2 in September). */
const berlin = (iso: string, hour: number, minute = 0) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, hour - 2, minute, 0))
}

// Thursday 2026-09-10, comfortably before the 19:00 cutoff.
const THURSDAY_AFTERNOON = berlin('2026-09-10', 14)

describe('buildCustomerPromise', () => {
  it('turns a safe prediction into precise calendar dates', () => {
    const promise = buildCustomerPromise({
      productId: 'voltaren',
      postcode: '50667',
      method: 'home',
      provider: 'dhl',
      now: THURSDAY_AFTERNOON,
    })

    expect(promise.kind).toBe('precise')
    // Köln is a 1-2 business day lane: Friday to Monday from a Thursday order.
    expect(promise.minDate).toBe('2026-09-11')
    expect(promise.maxDate).toBe('2026-09-14')
    expect(promise.label).toBe('Fr., 11. – Mo., 14. September')
  })

  it('falls back for a product outside the model scope', () => {
    const promise = buildCustomerPromise({
      productId: 'vagisan',
      postcode: '50667',
      method: 'home',
      provider: 'dhl',
      now: THURSDAY_AFTERNOON,
    })

    expect(promise.kind).toBe('fallback')
    expect(promise.label).toBe(PROMISE_POLICY.fallbackLabel)
  })

  it('falls back for an unsupported postcode', () => {
    const promise = buildCustomerPromise({
      productId: 'voltaren',
      postcode: '99999',
      method: 'home',
      provider: 'dhl',
      now: THURSDAY_AFTERNOON,
    })
    expect(promise.kind).toBe('fallback')
  })

  it('falls back when the prediction fails a gate, without saying why', () => {
    // Ibu + München is the documented low-support lane.
    const promise = buildCustomerPromise({
      productId: 'ibu',
      postcode: '80331',
      method: 'home',
      provider: 'dhl',
      now: THURSDAY_AFTERNOON,
    })

    expect(promise.kind).toBe('fallback')
    expect(promise.label).toBe(PROMISE_POLICY.fallbackLabel)
    expect(JSON.stringify(promise)).not.toMatch(/support|confidence|calibration/i)
  })

  it('never returns a weekend date', () => {
    for (const postcode of ['50667', '60311', '22083', '10115', '80331']) {
      for (let day = 7; day <= 13; day += 1) {
        const promise = buildCustomerPromise({
          productId: 'voltaren',
          postcode,
          method: 'home',
          provider: 'dhl',
          now: berlin(`2026-09-${String(day).padStart(2, '0')}`, 10),
        })
        if (promise.kind !== 'precise') continue
        for (const iso of [promise.minDate, promise.maxDate]) {
          const [y, m, d] = iso.split('-').map(Number)
          const weekday = new Date(y, m - 1, d).getDay()
          expect([0, 6]).not.toContain(weekday)
        }
      }
    }
  })

  it('shifts the promise later for an order placed after the cutoff', () => {
    const before = buildCustomerPromise({
      productId: 'voltaren',
      postcode: '50667',
      method: 'home',
      provider: 'dhl',
      now: berlin('2026-09-10', 18, 59),
    })
    const after = buildCustomerPromise({
      productId: 'voltaren',
      postcode: '50667',
      method: 'home',
      provider: 'dhl',
      now: berlin('2026-09-10', 19, 1),
    })

    expect(before.kind).toBe('precise')
    expect(after.kind).toBe('precise')
    expect(after.maxDate! > before.maxDate!).toBe(true)
  })

  it('shows the cutoff hint when crossing it changes the promise', () => {
    const promise = buildCustomerPromise({
      productId: 'voltaren',
      postcode: '50667',
      method: 'home',
      provider: 'dhl',
      now: berlin('2026-09-10', 18, 30),
    })

    expect(promise.cutoffText).toBe('Bei Bestellung bis 19:00')
  })

  it('hides the cutoff hint once the cutoff has already passed', () => {
    const promise = buildCustomerPromise({
      productId: 'voltaren',
      postcode: '50667',
      method: 'home',
      provider: 'dhl',
      now: berlin('2026-09-10', 19, 30),
    })

    expect(promise.cutoffText).toBeUndefined()
  })

  it('never exposes raw model metadata on the customer-ready promise', () => {
    const promise = buildCustomerPromise({
      productId: 'voltaren',
      postcode: '50667',
      method: 'home',
      provider: 'dhl',
      now: THURSDAY_AFTERNOON,
    })

    const keys = Object.keys(promise)
    for (const forbidden of [
      'q10BusinessDays',
      'q90BusinessDays',
      'confidenceScore',
      'calibrationError',
      'supportN',
      'reason',
      'modelVersion',
    ]) {
      expect(keys).not.toContain(forbidden)
    }
  })
})
