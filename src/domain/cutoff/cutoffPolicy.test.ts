import { describe, expect, it } from 'vitest'
import { berlinParts, effectivePredictionStart, isAfterCutoff } from './cutoffPolicy'

/** Build an instant from a Berlin wall-clock time (CEST = UTC+2 in September). */
const berlin = (iso: string, hour: number, minute = 0) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, hour - 2, minute, 0))
}

describe('berlinParts', () => {
  it('reads wall-clock hour in Berlin regardless of the viewer timezone', () => {
    const parts = berlinParts(berlin('2026-09-10', 18, 59))
    expect(parts.hour).toBe(18)
    expect(parts.minute).toBe(59)
    expect(parts.year).toBe(2026)
    expect(parts.month).toBe(9)
    expect(parts.day).toBe(10)
  })
})

describe('isAfterCutoff', () => {
  it('is false just before 19:00 Berlin time', () => {
    expect(isAfterCutoff(berlin('2026-09-10', 18, 59))).toBe(false)
  })

  it('is true just after 19:00 Berlin time', () => {
    expect(isAfterCutoff(berlin('2026-09-10', 19, 1))).toBe(true)
  })

  it('treats exactly 19:00 as past the cutoff', () => {
    expect(isAfterCutoff(berlin('2026-09-10', 19, 0))).toBe(true)
  })
})

describe('effectivePredictionStart', () => {
  it('keeps a pre-cutoff weekday order on the same dispatch day', () => {
    const start = effectivePredictionStart(berlin('2026-09-10', 18, 0), '50667')
    expect(start.getDate()).toBe(10)
  })

  it('rolls a post-cutoff order to the next dispatch day', () => {
    const start = effectivePredictionStart(berlin('2026-09-10', 19, 30), '50667')
    expect(start.getDate()).toBe(11)
  })

  it('rolls a post-cutoff Friday order across the weekend', () => {
    // Friday 2026-09-11 after 19:00 -> Monday 2026-09-14
    const start = effectivePredictionStart(berlin('2026-09-11', 20, 0), '50667')
    expect(start.getDay()).toBe(1)
    expect(start.getDate()).toBe(14)
  })

  it('treats a weekend order as starting on the next delivery day', () => {
    const start = effectivePredictionStart(berlin('2026-09-12', 10, 0), '50667')
    expect(start.getDate()).toBe(14)
  })
})
