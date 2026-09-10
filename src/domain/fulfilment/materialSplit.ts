import { isDeliveryDay } from '../calendar/businessCalendar'
import type { CustomerPromise } from '../promise/types'

export type MaterialSplitInput = {
  postcode: string
  promises: CustomerPromise[]
}

const parseIso = (iso: string): Date => {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

/** Count eligible delivery days strictly between two dates, inclusive of the later. */
function deliveryDaysBetween(fromIso: string, toIso: string, postcode: string): number {
  const from = parseIso(fromIso)
  const to = parseIso(toIso)
  if (to <= from) return 0

  let count = 0
  let cursor = from

  while (cursor < to) {
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1, 12, 0, 0, 0)
    if (isDeliveryDay(cursor, postcode)) count += 1
  }

  return count
}

/**
 * Decide whether a split shipment is worth showing the customer.
 *
 * The backend having two fulfilment groups is not itself a reason to complicate
 * the basket. The split is surfaced only when it carries information the
 * customer can use:
 *
 *  1. the earlier shipment's latest promise is at least one eligible delivery
 *     day earlier than the later shipment's; or
 *  2. an actionable cutoff changes the earlier shipment's promise.
 *
 * Friday versus Monday qualifies under rule 1 even though it is a single
 * business-day step, because the customer experiences three calendar days.
 *
 * Latest promised dates are compared rather than earliest: two overlapping
 * windows that end on the same day do not give the customer anything to act on.
 */
export function isMaterialSplit(input: MaterialSplitInput): boolean {
  if (input.promises.length < 2) return false

  const precise = input.promises.filter(
    (promise): promise is Extract<CustomerPromise, { kind: 'precise' }> =>
      promise.kind === 'precise',
  )

  // A precise shipment and a broad fallback cannot be honestly ranked against
  // each other, so the basket stays simple.
  if (precise.length !== input.promises.length) return false

  const latest = precise.map((promise) => promise.maxDate).sort()
  const earliest = latest[0]
  const last = latest[latest.length - 1]

  if (deliveryDaysBetween(earliest, last, input.postcode) >= 1) return true

  // An actionable cutoff on the shipment that arrives first is itself a reason
  // to show the split: the customer can still change that outcome today.
  const earliestPromise = precise.find((promise) => promise.maxDate === earliest)
  return Boolean(earliestPromise?.cutoffText)
}
