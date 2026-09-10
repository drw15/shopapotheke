import { afterEach, describe, expect, it, vi } from 'vitest'
import { getRawPrediction, resolvePrediction } from './predictionService'
import * as matrix from '../../data/predictionMatrix'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('prediction service', () => {
  it('returns a raw prediction for a supported combination', () => {
    const prediction = getRawPrediction({
      productId: 'voltaren',
      postcode: '50667',
      method: 'home',
      provider: 'dhl',
    })
    expect(prediction).not.toBeNull()
    expect(prediction?.productId).toBe('voltaren')
  })

  it('returns null for an unsupported postcode', () => {
    expect(
      getRawPrediction({
        productId: 'voltaren',
        postcode: '99999',
        method: 'home',
        provider: 'dhl',
      }),
    ).toBeNull()
  })

  it('returns null for a product outside the model scope', () => {
    expect(
      getRawPrediction({
        productId: 'vagisan',
        postcode: '50667',
        method: 'home',
        provider: 'dhl',
      }),
    ).toBeNull()
  })
})

describe('resolvePrediction', () => {
  it('reports an unsupported product distinctly from a missing row', () => {
    const resolved = resolvePrediction({
      productId: 'vagisan',
      postcode: '50667',
      method: 'home',
      provider: 'dhl',
    })
    expect(resolved.decision.safeToExpose).toBe(false)
    expect(resolved.decision.reason).toBe('unsupported')
    expect(resolved.prediction).toBeNull()
  })

  it('reports an unknown postcode as missing rather than throwing', () => {
    const resolved = resolvePrediction({
      productId: 'voltaren',
      postcode: '99999',
      method: 'home',
      provider: 'dhl',
    })
    expect(resolved.decision.safeToExpose).toBe(false)
    expect(resolved.decision.reason).toBe('missing')
  })

  it('never throws when the prediction service fails', () => {
    vi.spyOn(matrix, 'findPrediction').mockImplementation(() => {
      throw new Error('prediction backend unavailable')
    })

    const resolved = resolvePrediction({
      productId: 'voltaren',
      postcode: '50667',
      method: 'home',
      provider: 'dhl',
    })

    expect(resolved.decision.safeToExpose).toBe(false)
    expect(resolved.decision.reason).toBe('service-error')
    expect(resolved.prediction).toBeNull()
  })

  it('exposes a safe decision for a good combination', () => {
    const resolved = resolvePrediction({
      productId: 'voltaren',
      postcode: '50667',
      method: 'home',
      provider: 'dhl',
    })
    expect(resolved.decision.safeToExpose).toBe(true)
    expect(resolved.prediction).not.toBeNull()
  })
})
