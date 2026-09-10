import { describe, expect, it } from 'vitest'
import { evaluateExposure } from './exposurePolicy'
import type { RawDeliveryPrediction } from '../types'

const basePrediction = (overrides: Partial<RawDeliveryPrediction> = {}): RawDeliveryPrediction => ({
  productId: 'voltaren',
  postcode: '50667',
  method: 'home',
  provider: 'dhl',
  meanBusinessDays: 1.2,
  q10BusinessDays: 0.62,
  q50BusinessDays: 1.1,
  q90BusinessDays: 1.58,
  confidenceScore: 0.96,
  calibrationError: 0.012,
  supportN: 5400,
  modelVersion: 'demo-v1',
  ...overrides,
})

describe('exposure policy', () => {
  it('exposes a prediction that passes every gate', () => {
    expect(evaluateExposure(basePrediction())).toEqual({ safeToExpose: true, reason: 'safe' })
  })

  it('withholds a prediction below the confidence gate', () => {
    const decision = evaluateExposure(basePrediction({ confidenceScore: 0.81 }))
    expect(decision.safeToExpose).toBe(false)
    expect(decision.reason).toBe('low-confidence')
  })

  it('withholds a prediction outside the calibration gate', () => {
    const decision = evaluateExposure(basePrediction({ calibrationError: 0.062 }))
    expect(decision.safeToExpose).toBe(false)
    expect(decision.reason).toBe('poor-calibration')
  })

  it('withholds a prediction below the sample-support gate', () => {
    const decision = evaluateExposure(basePrediction({ supportN: 180 }))
    expect(decision.safeToExpose).toBe(false)
    expect(decision.reason).toBe('low-support')
  })

  it('treats a missing prediction as not exposable', () => {
    const decision = evaluateExposure(null)
    expect(decision.safeToExpose).toBe(false)
    expect(decision.reason).toBe('missing')
  })

  it('accepts values exactly on each threshold', () => {
    const decision = evaluateExposure(
      basePrediction({ confidenceScore: 0.9, calibrationError: 0.03, supportN: 500 }),
    )
    expect(decision.safeToExpose).toBe(true)
  })

  it('gates are independent: passing two does not rescue the third', () => {
    const decision = evaluateExposure(
      basePrediction({ confidenceScore: 0.99, calibrationError: 0.001, supportN: 10 }),
    )
    expect(decision.safeToExpose).toBe(false)
    expect(decision.reason).toBe('low-support')
  })
})
