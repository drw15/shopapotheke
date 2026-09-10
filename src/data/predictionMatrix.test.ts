import { describe, expect, it } from 'vitest'
import { PRODUCTS } from './products'
import { POSTCODES } from './postcodes'
import { PREDICTION_MATRIX, findPrediction } from './predictionMatrix'
import { PROMISE_POLICY } from '../config/promisePolicy'

const roundUp = (value: number) => Math.max(1, Math.ceil(value))

const passesGates = (p: { confidenceScore: number; calibrationError: number; supportN: number }) =>
  p.confidenceScore >= PROMISE_POLICY.minConfidence &&
  p.calibrationError <= PROMISE_POLICY.maxCalibrationError &&
  p.supportN >= PROMISE_POLICY.minSupportN

describe('demo catalogue', () => {
  it('uses exactly the five PRD products', () => {
    expect(PRODUCTS).toHaveLength(5)
    expect(PRODUCTS.map((p) => p.id).sort()).toEqual([
      'fenistil',
      'ibu',
      'vagisan',
      'vitamin-d3',
      'voltaren',
    ])
  })

  it('keeps exactly one fictional external-fulfilment product outside the model', () => {
    const external = PRODUCTS.filter((p) => p.fulfilmentGroup === 'external-demo')
    expect(external).toHaveLength(1)
    expect(external[0].id).toBe('vagisan')
    expect(external[0].modelEligible).toBe(false)
  })

  it('uses exactly the five PRD postcodes', () => {
    expect(POSTCODES).toHaveLength(5)
    expect(POSTCODES.map((p) => p.postcode).sort()).toEqual([
      '10115',
      '22083',
      '50667',
      '60311',
      '80331',
    ])
  })
})

describe('prediction matrix', () => {
  it('covers every model-eligible product across all postcodes, methods and providers', () => {
    const eligible = PRODUCTS.filter((p) => p.modelEligible)
    const expected = eligible.length * POSTCODES.length * 2 * 2
    expect(PREDICTION_MATRIX).toHaveLength(expected)
  })

  it('never contains a prediction for the model-ineligible product', () => {
    expect(PREDICTION_MATRIX.some((p) => p.productId === 'vagisan')).toBe(false)
  })

  it('keeps quantiles internally ordered', () => {
    for (const p of PREDICTION_MATRIX) {
      expect(p.q10BusinessDays).toBeLessThanOrEqual(p.q50BusinessDays)
      expect(p.q50BusinessDays).toBeLessThanOrEqual(p.q90BusinessDays)
      expect(p.meanBusinessDays).toBeGreaterThan(0)
    }
  })

  it('includes at least one case failing each individual exposure gate', () => {
    expect(
      PREDICTION_MATRIX.some((p) => p.confidenceScore < PROMISE_POLICY.minConfidence),
    ).toBe(true)
    expect(
      PREDICTION_MATRIX.some((p) => p.calibrationError > PROMISE_POLICY.maxCalibrationError),
    ).toBe(true)
    expect(PREDICTION_MATRIX.some((p) => p.supportN < PROMISE_POLICY.minSupportN)).toBe(true)
  })

  it('keeps most combinations safe to expose so the demo is not dominated by fallback', () => {
    const safe = PREDICTION_MATRIX.filter(passesGates)
    expect(safe.length / PREDICTION_MATRIX.length).toBeGreaterThan(0.8)
  })

  it('normally gives DHL and Hermes slightly different raw values', () => {
    let compared = 0
    let identical = 0
    for (const dhl of PREDICTION_MATRIX.filter((p) => p.provider === 'dhl')) {
      const hermes = findPrediction({ ...dhl, provider: 'hermes' })
      if (!hermes) continue
      compared += 1
      if (
        dhl.q10BusinessDays === hermes.q10BusinessDays &&
        dhl.q90BusinessDays === hermes.q90BusinessDays
      ) {
        identical += 1
      }
    }
    expect(compared).toBeGreaterThan(0)
    // Carrier is a model input, so raw values should rarely be identical.
    expect(identical / compared).toBeLessThan(0.1)
  })

  it('rounds most carrier differences away and never exceeds one business day visibly', () => {
    let compared = 0
    let visiblyDifferent = 0

    for (const dhl of PREDICTION_MATRIX.filter((p) => p.provider === 'dhl')) {
      const hermes = findPrediction({ ...dhl, provider: 'hermes' })
      if (!hermes) continue
      // Only combinations where both carriers are actually exposed can create
      // a visible carrier difference for the customer.
      if (!passesGates(dhl) || !passesGates(hermes)) continue

      compared += 1

      const dhlMin = roundUp(dhl.q10BusinessDays)
      const dhlMax = Math.max(dhlMin, roundUp(dhl.q90BusinessDays))
      const hermesMin = roundUp(hermes.q10BusinessDays)
      const hermesMax = Math.max(hermesMin, roundUp(hermes.q90BusinessDays))

      const minDelta = Math.abs(dhlMin - hermesMin)
      const maxDelta = Math.abs(dhlMax - hermesMax)

      // Visible standard-carrier differences stay believable: one day at most.
      expect(minDelta).toBeLessThanOrEqual(1)
      expect(maxDelta).toBeLessThanOrEqual(1)

      if (minDelta > 0 || maxDelta > 0) visiblyDifferent += 1
    }

    expect(compared).toBeGreaterThan(0)
    // The product point: the model may detect a difference the UI need not show.
    expect(visiblyDifferent / compared).toBeLessThan(0.2)
    // ...but the demo still needs at least one visible carrier difference.
    expect(visiblyDifferent).toBeGreaterThan(0)
  })

  it('does not hard-code pickup as universally faster than home delivery', () => {
    const homeFaster = PREDICTION_MATRIX.filter((home) => {
      if (home.method !== 'home') return false
      const pickup = findPrediction({ ...home, method: 'pickup' })
      return pickup ? home.q90BusinessDays < pickup.q90BusinessDays : false
    })
    expect(homeFaster.length).toBeGreaterThan(0)
  })

  it('exposes a München low-support case for the documented fallback scenario', () => {
    const muenchen = PREDICTION_MATRIX.filter((p) => p.postcode === '80331')
    expect(muenchen.some((p) => !passesGates(p))).toBe(true)
  })

  it('finds a specific prediction by full query', () => {
    const found = findPrediction({
      productId: 'voltaren',
      postcode: '50667',
      method: 'home',
      provider: 'dhl',
    })
    expect(found).toBeDefined()
    expect(found?.modelVersion).toBe('demo-v1')
  })

  it('returns undefined for an unsupported postcode', () => {
    expect(
      findPrediction({
        productId: 'voltaren',
        postcode: '99999',
        method: 'home',
        provider: 'dhl',
      }),
    ).toBeUndefined()
  })
})
