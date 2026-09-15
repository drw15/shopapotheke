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

describe('the day-0 shift is the same in every delivery area', () => {
  const POSTCODES = ['50667', '60311', '22083', '10115', '80331', '99999']

  it.each(POSTCODES)('moves the dispatch day forward one working day in %s', (postcode) => {
    const before = effectivePredictionStart(berlin(WED, 18, 30), postcode)
    const after = effectivePredictionStart(berlin(WED, 19, 30), postcode)

    expect(before.getDate()).toBe(9)
    expect(after.getDate()).toBe(10)
  })

  it.each(POSTCODES)('rolls a missed Friday cutoff to Monday in %s', (postcode) => {
    const after = effectivePredictionStart(berlin(FRI, 19, 30), postcode)

    expect(after.getDay()).toBe(1)
    expect(after.getDate()).toBe(14)
  })
})

describe('the weekend-crossing day depends on the lane', () => {
  /** The latest promised date, as a weekday index. */
  const latestDay = (postcode: string, now: Date) => {
    const promise = buildCustomerPromise({
      productId: 'voltaren',
      postcode,
      method: 'home',
      provider: 'dhl',
      now,
    })
    if (promise.kind !== 'precise') throw new Error('expected a precise promise')
    return new Date(promise.maxDate).getDay()
  }

  // Fast lanes (1-2 and 2 Werktage) still land inside the week on Wednesday,
  // so Wednesday is where missing the cutoff first reaches Monday.
  it.each(['50667', '60311', '22083'])('crosses on Wednesday in %s', (postcode) => {
    expect(latestDay(postcode, berlin(WED, 18, 30))).not.toBe(1)
    expect(latestDay(postcode, berlin(WED, 19, 30))).toBe(1)
  })

  // Slower lanes (2-3 Werktage) already reach into Friday by Tuesday, so they
  // cross a day earlier. A reviewer testing these on Wednesday would see an
  // ordinary one-day shift and wrongly conclude the weekend case is absent.
  it.each(['10115', '80331'])('crosses on Tuesday, not Wednesday, in %s', (postcode) => {
    const TUE = '2026-09-08'

    expect(latestDay(postcode, berlin(TUE, 18, 30))).not.toBe(1)
    expect(latestDay(postcode, berlin(TUE, 19, 30))).toBe(1)

    // Wednesday is an ordinary shift here: Monday, then Tuesday.
    expect(latestDay(postcode, berlin(WED, 18, 30))).toBe(1)
    expect(latestDay(postcode, berlin(WED, 19, 30))).toBe(2)
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

  // The claim the reviewer guide used to make was that a Friday cutoff saved
  // the customer from Monday. It never did, in any area.
  it.each(['50667', '60311', '22083', '10115', '80331'])(
    'never delivers earlier than Monday for a Friday order in %s',
    (postcode) => {
      const promise = buildCustomerPromise({
        productId: 'voltaren',
        postcode,
        method: 'home',
        provider: 'dhl',
        now: berlin(FRI, 18, 30),
      })

      if (promise.kind !== 'precise') throw new Error('expected a precise promise')
      expect(new Date(promise.minDate).getTime()).toBeGreaterThanOrEqual(
        new Date('2026-09-14T00:00:00').getTime(),
      )
    },
  )
})
