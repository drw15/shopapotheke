import { describe, expect, it } from 'vitest'
import {
  addDeliveryDays,
  isDeliveryDay,
  toGermanPromiseLabel,
  toGermanDayLabel,
} from './businessCalendar'

/** Local-time date helper so tests read as calendar dates, not instants. */
const date = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0)
}

describe('isDeliveryDay', () => {
  it('treats weekdays as delivery days', () => {
    // 2026-09-10 is a Thursday.
    expect(isDeliveryDay(date('2026-09-10'), '50667')).toBe(true)
  })

  it('never treats Saturday or Sunday as a delivery day', () => {
    expect(isDeliveryDay(date('2026-09-12'), '50667')).toBe(false)
    expect(isDeliveryDay(date('2026-09-13'), '50667')).toBe(false)
  })

  it('skips a national public holiday', () => {
    // 3 October, Tag der Deutschen Einheit, falls on a Saturday in 2026, so
    // use Christmas Day 2026 (a Friday) as the national-holiday weekday case.
    expect(isDeliveryDay(date('2026-12-25'), '50667')).toBe(false)
  })

  it('skips a state-specific holiday only in the states that observe it', () => {
    // Fronleichnam 2026 falls on Thursday 4 June: observed in Bavaria and
    // North Rhine-Westphalia, an ordinary working day in Hamburg and Berlin.
    expect(isDeliveryDay(date('2026-06-04'), '80331')).toBe(false)
    expect(isDeliveryDay(date('2026-06-04'), '50667')).toBe(false)
    expect(isDeliveryDay(date('2026-06-04'), '22083')).toBe(true)
    expect(isDeliveryDay(date('2026-06-04'), '10115')).toBe(true)
  })
})

describe('addDeliveryDays', () => {
  it('adds a single business day within the week', () => {
    // Thursday + 1 -> Friday
    expect(addDeliveryDays(date('2026-09-10'), 1, '50667')).toEqual(date('2026-09-11'))
  })

  it('skips the weekend', () => {
    // Thursday + 2 -> Monday, not Saturday
    expect(addDeliveryDays(date('2026-09-10'), 2, '50667')).toEqual(date('2026-09-14'))
  })

  it('moves a Friday start to the following week', () => {
    // Friday + 1 -> Monday
    expect(addDeliveryDays(date('2026-09-11'), 1, '50667')).toEqual(date('2026-09-14'))
  })

  it('never lands a promise on a weekend', () => {
    for (let days = 1; days <= 10; days += 1) {
      const result = addDeliveryDays(date('2026-09-10'), days, '50667')
      expect([0, 6]).not.toContain(result.getDay())
    }
  })

  it('skips a state holiday when counting', () => {
    // Wednesday 3 June 2026 + 1 business day in Bavaria skips Fronleichnam
    // (Thursday 4 June) and lands on Friday 5 June.
    expect(addDeliveryDays(date('2026-06-03'), 1, '80331')).toEqual(date('2026-06-05'))
    // Hamburg does not observe it, so the same count lands on the Thursday.
    expect(addDeliveryDays(date('2026-06-03'), 1, '22083')).toEqual(date('2026-06-04'))
  })

  it('advances a start that is itself not a delivery day', () => {
    // Saturday + 1 business day -> Monday
    expect(addDeliveryDays(date('2026-09-12'), 1, '50667')).toEqual(date('2026-09-14'))
  })

  it('returns the next delivery day for a zero-day offset', () => {
    expect(addDeliveryDays(date('2026-09-12'), 0, '50667')).toEqual(date('2026-09-14'))
  })
})

describe('German labels', () => {
  it('formats a single day the way the reference checkout does', () => {
    expect(toGermanDayLabel(date('2026-09-11'))).toBe('Fr., 11. September')
  })

  it('formats a window across two days', () => {
    expect(toGermanPromiseLabel(date('2026-09-11'), date('2026-09-14'))).toBe(
      'Fr., 11. – Mo., 14. September',
    )
  })

  it('collapses a window whose bounds are the same day', () => {
    expect(toGermanPromiseLabel(date('2026-09-11'), date('2026-09-11'))).toBe('Fr., 11. September')
  })

  it('names both months when the window spans a month boundary', () => {
    expect(toGermanPromiseLabel(date('2026-09-30'), date('2026-10-01'))).toBe(
      'Mi., 30. September – Do., 1. Oktober',
    )
  })
})
