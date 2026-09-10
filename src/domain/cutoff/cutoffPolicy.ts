import { PROMISE_POLICY } from '../../config/promisePolicy'
import { nextDeliveryDay } from '../calendar/businessCalendar'

/**
 * Deterministic cutoff policy.
 *
 * The 19:00 cutoff is operational policy, not something the model learns. For
 * the prototype it is derived from an illustrative chain: a 23:00 carrier
 * handover, minus 3 hours of packing and processing, minus a 1 hour safety
 * buffer. Those numbers are demo assumptions, not Redcare facts.
 *
 * The customer-facing rule is that the cutoff is shown only when crossing it
 * would actually change the displayed promise - never as decoration.
 */

export type BerlinParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

const BERLIN_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: PROMISE_POLICY.timeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

/**
 * Read an instant as Berlin wall-clock parts.
 *
 * The prototype reads the viewer's real device clock, so a reviewer in another
 * timezone must still see the promise Redcare would make: the cutoff and the
 * dispatch day are always evaluated in Europe/Berlin.
 */
export function berlinParts(now: Date): BerlinParts {
  const parts = BERLIN_FORMATTER.formatToParts(now)
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? '0')

  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    // Intl can render midnight as hour 24; normalise it to 0.
    hour: read('hour') % 24,
    minute: read('minute'),
  }
}

/** Whether an order placed now misses today's dispatch. */
export function isAfterCutoff(now: Date): boolean {
  return berlinParts(now).hour >= PROMISE_POLICY.customerCutoffHour
}

/**
 * The dispatch day a prediction should count from.
 *
 * An order placed before the cutoff on a working day dispatches that day.
 * After the cutoff it moves to the next dispatch day, which is why a Friday
 * evening order is worth telling the customer about: it costs one business day
 * but three calendar days.
 */
export function effectivePredictionStart(now: Date, postcode: string): Date {
  const parts = berlinParts(now)
  const dispatchDay = new Date(parts.year, parts.month - 1, parts.day, 12, 0, 0, 0)

  if (!isAfterCutoff(now)) return nextDeliveryDay(dispatchDay, postcode)

  const nextDay = new Date(
    dispatchDay.getFullYear(),
    dispatchDay.getMonth(),
    dispatchDay.getDate() + 1,
    12,
    0,
    0,
    0,
  )
  return nextDeliveryDay(nextDay, postcode)
}
