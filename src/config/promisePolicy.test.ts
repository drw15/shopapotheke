import { describe, expect, it } from 'vitest'
import { PROMISE_POLICY } from './promisePolicy'

describe('promise policy config', () => {
  it('keeps prototype exposure gates explicit', () => {
    expect(PROMISE_POLICY.minConfidence).toBe(0.9)
    expect(PROMISE_POLICY.maxCalibrationError).toBe(0.03)
    expect(PROMISE_POLICY.minSupportN).toBe(500)
  })

  it('keeps the deterministic operational cutoff explicit', () => {
    expect(PROMISE_POLICY.customerCutoffHour).toBe(19)
    expect(PROMISE_POLICY.timeZone).toBe('Europe/Berlin')
  })

  it('states the fallback promise label used everywhere', () => {
    expect(PROMISE_POLICY.fallbackLabel).toBe('Lieferung in 1–3 Werktagen')
  })
})
