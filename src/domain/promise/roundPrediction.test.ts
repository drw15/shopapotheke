import { describe, expect, it } from 'vitest'
import { roundPrediction } from './roundPrediction'
import type { RawDeliveryPrediction } from '../types'

const withQuantiles = (q10: number, q90: number): RawDeliveryPrediction => ({
  productId: 'voltaren',
  postcode: '50667',
  method: 'home',
  provider: 'dhl',
  meanBusinessDays: (q10 + q90) / 2,
  q10BusinessDays: q10,
  q50BusinessDays: (q10 + q90) / 2,
  q90BusinessDays: q90,
  confidenceScore: 0.96,
  calibrationError: 0.012,
  supportN: 5400,
  modelVersion: 'demo-v1',
})

describe('roundPrediction', () => {
  it('rounds the approved design examples conservatively', () => {
    expect(roundPrediction(withQuantiles(0.6, 1.6))).toEqual({ min: 1, max: 2 })
    expect(roundPrediction(withQuantiles(1.1, 2.6))).toEqual({ min: 2, max: 3 })
    expect(roundPrediction(withQuantiles(2.1, 4.2))).toEqual({ min: 3, max: 5 })
  })

  it('never promises same-day: the minimum is at least one business day', () => {
    expect(roundPrediction(withQuantiles(0.1, 0.4))).toEqual({ min: 1, max: 1 })
  })

  it('keeps the window ordered when both bounds round to the same day', () => {
    const window = roundPrediction(withQuantiles(1.2, 1.4))
    expect(window).toEqual({ min: 2, max: 2 })
    expect(window.max).toBeGreaterThanOrEqual(window.min)
  })

  it('leaves whole-day quantiles untouched', () => {
    expect(roundPrediction(withQuantiles(1, 3))).toEqual({ min: 1, max: 3 })
  })

  it('always rounds up, never toward a more attractive promise', () => {
    // 1.01 must not become 1: conservative rounding protects the promise.
    expect(roundPrediction(withQuantiles(1.01, 2.01))).toEqual({ min: 2, max: 3 })
  })
})
