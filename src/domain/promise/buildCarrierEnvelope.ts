import type { Provider } from '../types'
import { toGermanPromiseLabel } from '../calendar/businessCalendar'
import { effectivePredictionStart } from '../cutoff/cutoffPolicy'
import {
  CUTOFF_TEXT,
  FALLBACK_PROMISE,
  cutoffChangesPromise,
  resolveWindow,
  toIsoDate,
  windowToDates,
} from './buildPromise'
import type { BusinessDayWindow } from './roundPrediction'
import type { CustomerPromise, EnvelopeInput } from './types'

/** The standard home carriers offered later in checkout. */
const STANDARD_HOME_PROVIDERS: Provider[] = ['dhl', 'hermes']

/**
 * Build the upper-funnel promise across the eligible standard carriers.
 *
 * On PDP and in the basket the customer has not chosen DHL or Hermes yet, so
 * the prototype resolves each carrier independently and shows an envelope that
 * covers both. Two rules follow from that, and both are trust decisions:
 *
 *  - if either carrier is unsafe, its fallback participates, so the whole
 *    envelope falls back. The upper funnel must never look more certain than
 *    the set of options the customer can actually pick later;
 *  - for a multi-product basket the slowest item constrains the shipment.
 *    (A production prediction service could model basket composition directly;
 *    this is a deliberate prototype simplification.)
 */
export function buildStandardHomeEnvelope(input: EnvelopeInput): CustomerPromise {
  const providers = input.providers ?? STANDARD_HOME_PROVIDERS
  const method = input.method ?? 'home'

  if (input.productIds.length === 0) return FALLBACK_PROMISE

  const windows: BusinessDayWindow[] = []

  for (const productId of input.productIds) {
    for (const provider of providers) {
      const window = resolveWindow({
        productId,
        postcode: input.postcode,
        method,
        provider,
        now: input.now,
      })

      // One unsafe carrier or product is enough to widen the whole promise
      // back to the broad fallback.
      if (!window) return FALLBACK_PROMISE

      windows.push(window)
    }
  }

  const enveloped: BusinessDayWindow = {
    min: Math.min(...windows.map((w) => w.min)),
    max: Math.max(...windows.map((w) => w.max)),
  }

  const start = effectivePredictionStart(input.now, input.postcode)
  const dates = windowToDates(enveloped, start, input.postcode)

  const promise: CustomerPromise = {
    kind: 'precise',
    minDate: toIsoDate(dates.min),
    maxDate: toIsoDate(dates.max),
    label: toGermanPromiseLabel(dates.min, dates.max),
  }

  if (cutoffChangesPromise(enveloped, input.now, input.postcode)) {
    return { ...promise, cutoffText: CUTOFF_TEXT }
  }

  return promise
}
