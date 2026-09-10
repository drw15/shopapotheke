import Holidays from 'date-holidays'
import { getStateForPostcode } from '../../data/postcodeStates'

/**
 * German delivery calendar.
 *
 * Prototype rules from the approved design:
 *  - customer delivery happens Monday to Friday;
 *  - Saturday and Sunday are never promise days;
 *  - applicable German public holidays are skipped;
 *  - the destination postcode decides which state's holidays apply.
 *
 * All dates here are plain local calendar days. Time of day is irrelevant to a
 * delivery-day question, so inputs are normalised to midday to keep the
 * arithmetic clear of daylight-saving edges.
 */

const holidaysCache = new Map<string, Holidays>()

function holidaysFor(postcode: string): Holidays {
  const state = getStateForPostcode(postcode)
  const cacheKey = state ?? 'DE'

  const cached = holidaysCache.get(cacheKey)
  if (cached) return cached

  // Unsupported postcodes fall back to national holidays only. Those postcodes
  // already resolve to the broad promise, so the calendar only needs to stay
  // sane rather than precise.
  const instance = state ? new Holidays('DE', state) : new Holidays('DE')
  holidaysCache.set(cacheKey, instance)
  return instance
}

function atMidday(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0)
}

function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

function isPublicHoliday(date: Date, postcode: string): boolean {
  const result = holidaysFor(postcode).isHoliday(atMidday(date))
  if (!result) return false
  // date-holidays also reports observances and bank days; only public
  // holidays stop delivery.
  return result.some((entry) => entry.type === 'public')
}

/** Whether Redcare would promise a delivery on this calendar day. */
export function isDeliveryDay(date: Date, postcode: string): boolean {
  return !isWeekend(date) && !isPublicHoliday(date, postcode)
}

/** The first delivery day on or after the given date. */
export function nextDeliveryDay(date: Date, postcode: string): Date {
  let cursor = atMidday(date)
  while (!isDeliveryDay(cursor, postcode)) {
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1, 12, 0, 0, 0)
  }
  return cursor
}

/**
 * Add whole delivery days to a start date.
 *
 * A zero-day offset still resolves to a real delivery day, so a Saturday start
 * never yields a Saturday promise.
 *
 * Non-delivery days are not consumed by the count. Counting one delivery day
 * from a Saturday reaches Monday, not Tuesday: the customer does not spend a
 * business day waiting through the weekend.
 */
export function addDeliveryDays(start: Date, days: number, postcode: string): Date {
  let cursor = atMidday(start)
  let remaining = days

  // Consume whole days first, from the raw start, so a weekend start does not
  // pay for the weekend twice.
  while (remaining > 0) {
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1, 12, 0, 0, 0)
    if (isDeliveryDay(cursor, postcode)) remaining -= 1
  }

  // Whatever the count landed on, the promise itself must fall on a delivery day.
  return nextDeliveryDay(cursor, postcode)
}

const WEEKDAY_LABELS = ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.']

const MONTH_LABELS = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
]

/** `Fr., 11. September` - the single-day form used in the reference checkout. */
export function toGermanDayLabel(date: Date): string {
  return `${WEEKDAY_LABELS[date.getDay()]}, ${date.getDate()}. ${MONTH_LABELS[date.getMonth()]}`
}

/**
 * `Fr., 11. – Mo., 14. September` - the window form.
 *
 * The month is named once when both bounds share it, and twice across a month
 * boundary. A window whose bounds are the same day collapses to a single date.
 */
export function toGermanPromiseLabel(min: Date, max: Date): string {
  const sameDay =
    min.getFullYear() === max.getFullYear() &&
    min.getMonth() === max.getMonth() &&
    min.getDate() === max.getDate()

  if (sameDay) return toGermanDayLabel(min)

  const sameMonth = min.getFullYear() === max.getFullYear() && min.getMonth() === max.getMonth()

  if (sameMonth) {
    const from = `${WEEKDAY_LABELS[min.getDay()]}, ${min.getDate()}.`
    return `${from} – ${toGermanDayLabel(max)}`
  }

  return `${toGermanDayLabel(min)} – ${toGermanDayLabel(max)}`
}
