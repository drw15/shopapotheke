import { PROMISE_POLICY } from '../../config/promisePolicy'
import { addDeliveryDays, toGermanPromiseLabel } from '../calendar/businessCalendar'
import { effectivePredictionStart, isAfterCutoff } from '../cutoff/cutoffPolicy'
import { resolvePrediction } from '../prediction/predictionService'
import { roundPrediction, type BusinessDayWindow } from './roundPrediction'
import type { CustomerPromise, PromiseInput } from './types'

/** ISO calendar date (local), the storage form for promise bounds. */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const FALLBACK_PROMISE: CustomerPromise = {
  kind: 'fallback',
  label: PROMISE_POLICY.fallbackLabel,
}

export const CUTOFF_TEXT = `Bei Bestellung bis ${PROMISE_POLICY.customerCutoffHour}:00`

/** Turn a business-day window into calendar dates from a given dispatch day. */
export function windowToDates(
  window: BusinessDayWindow,
  start: Date,
  postcode: string,
): { min: Date; max: Date } {
  return {
    min: addDeliveryDays(start, window.min, postcode),
    max: addDeliveryDays(start, window.max, postcode),
  }
}

/**
 * Resolve the rounded business-day window for one carrier/service combination,
 * or null when the result is not safe to expose.
 */
export function resolveWindow(input: PromiseInput): BusinessDayWindow | null {
  const { prediction, decision } = resolvePrediction({
    productId: input.productId,
    postcode: input.postcode,
    method: input.method,
    provider: input.provider,
  })

  if (!decision.safeToExpose || !prediction) return null
  return roundPrediction(prediction)
}

/**
 * Decide whether the cutoff is worth showing.
 *
 * The rule is deliberately strict: the hint appears only when ordering before
 * 19:00 produces different dates than ordering after it. If the displayed
 * promise is identical either way, the message is noise and creating urgency
 * from it would be dishonest.
 */
export function cutoffChangesPromise(
  window: BusinessDayWindow,
  now: Date,
  postcode: string,
): boolean {
  // Once the cutoff has passed there is nothing left to act on today.
  if (isAfterCutoff(now)) return false

  const beforeStart = effectivePredictionStart(now, postcode)

  // Same instant, evaluated as though the cutoff had just been missed.
  const afterCutoff = new Date(now.getTime())
  afterCutoff.setUTCHours(afterCutoff.getUTCHours() + 24)
  const afterStart = effectivePredictionStart(afterCutoff, postcode)

  const before = windowToDates(window, beforeStart, postcode)
  const after = windowToDates(window, afterStart, postcode)

  return toIsoDate(before.max) !== toIsoDate(after.max)
}

/**
 * Build the customer-facing promise for one product on one carrier/service.
 *
 * Everything unsafe collapses to the same broad fallback, and the customer is
 * never told which gate failed.
 */
export function buildCustomerPromise(input: PromiseInput): CustomerPromise {
  const window = resolveWindow(input)
  if (!window) return FALLBACK_PROMISE

  const start = effectivePredictionStart(input.now, input.postcode)
  const dates = windowToDates(window, start, input.postcode)

  const promise: CustomerPromise = {
    kind: 'precise',
    minDate: toIsoDate(dates.min),
    maxDate: toIsoDate(dates.max),
    label: toGermanPromiseLabel(dates.min, dates.max),
  }

  if (cutoffChangesPromise(window, input.now, input.postcode)) {
    return { ...promise, cutoffText: CUTOFF_TEXT }
  }

  return promise
}
