import { isDeliveryDay } from '../calendar/businessCalendar'
import { fallbackDates } from '../promise/buildPromise'
import type { CustomerPromise } from '../promise/types'

export type MaterialSplitInput = {
  postcode: string
  /** Needed to resolve a fallback shipment's 1-3 Werktage into real dates. */
  now: Date
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
 * the basket. The split is surfaced only when one shipment's latest promised
 * date is at least one eligible delivery day earlier than another's - that is,
 * when part of the order genuinely arrives sooner.
 *
 * Friday versus Monday qualifies even though it is a single business-day step,
 * because the customer experiences three calendar days.
 *
 * Latest promised dates are compared rather than earliest: two overlapping
 * windows that end on the same day do not give the customer anything to act on.
 */
export function isMaterialSplit(input: MaterialSplitInput): boolean {
  if (input.promises.length < 2) return false

  // Every shipment has a delivery window. A precise promise carries calendar
  // dates directly; a fallback shipment is still promising 1-3 Werktage, which
  // resolves to dates from the same dispatch day and calendar. Both can be
  // compared, so a mixed basket is not exempt from the materiality question.
  const latestDates = input.promises.map((promise) =>
    promise.kind === 'precise'
      ? promise.maxDate
      : fallbackDates(input.now, input.postcode).maxDate,
  )

  const sorted = [...latestDates].sort()
  const earliest = sorted[0]
  const last = sorted[sorted.length - 1]

  return deliveryDaysBetween(earliest, last, input.postcode) >= 1
}
