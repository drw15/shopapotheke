import { describe, expect, it } from 'vitest'
import { buildCustomerPromise } from '../promise/buildPromise'
import { effectivePredictionStart } from './cutoffPolicy'

/**
 * The cutoff shifts the dispatch day, and delivery days are counted from there.
 *
 * These lock the examples the reviewer guide prints. The guide previously
 * claimed that making a Friday cutoff avoided waiting until Monday, which the
 * engine never did: a Friday order lands on Monday either way, because the
 * weekend absorbs the difference at the near end.
 */

/** An instant from Berlin wall-clock time (CEST = UTC+2 in September). */
const berlin = (iso: string, hour: number, minute = 0) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, hour - 2, minute, 0))
}

// 2026-09-09 is a Wednesday; 2026-09-11 is a Friday.
const WED = '2026-09-09'
const FRI = '2026-09-11'

const koelnVoltaren = (now: Date) =>
  buildCustomerPromise({
    productId: 'voltaren',
    postcode: '50667',
    method: 'home',
    provider: 'dhl',
    now,
  })

describe('the cutoff shifts day 0', () => {
  it('keeps the dispatch day on the order day before the cutoff', () => {
    const start = effectivePredictionStart(berlin(WED, 18, 30), '50667')
    expect(start.getDate()).toBe(9)
  })

  it('moves the dispatch day to the next working day after the cutoff', () => {
    const start = effectivePredictionStart(berlin(WED, 19, 30), '50667')
    expect(start.getDate()).toBe(10)
  })

  it('skips the weekend when the shifted dispatch day would land on one', () => {
    const start = effectivePredictionStart(berlin(FRI, 19, 30), '50667')
    expect(start.getDay()).toBe(1)
    expect(start.getDate()).toBe(14)
  })
})

describe('Wednesday is the weekend-crossing case', () => {
  it('delivers within the week when the cutoff is made', () => {
    const promise = koelnVoltaren(berlin(WED, 18, 30))
    expect(promise.kind).toBe('precise')
    expect(promise.label).toBe('Do., 10. – Fr., 11. September')
  })

  it('pushes the latest date across the weekend when the cutoff is missed', () => {
    const promise = koelnVoltaren(berlin(WED, 19, 30))
    expect(promise.kind).toBe('precise')
    expect(promise.label).toBe('Fr., 11. – Mo., 14. September')
  })
})

describe('Friday does not buy an earlier arrival', () => {
  it('lands on Monday whether the cutoff is made or missed', () => {
    const before = koelnVoltaren(berlin(FRI, 18, 30))
    const after = koelnVoltaren(berlin(FRI, 19, 30))

    // Both start on Monday: only the far end of the window moves.
    expect(before.label).toBe('Mo., 14. – Di., 15. September')
    expect(after.label).toBe('Di., 15. – Mi., 16. September')
  })
})
