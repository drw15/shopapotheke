import type { RawDeliveryPrediction } from '../types'

export type BusinessDayWindow = { min: number; max: number }

/**
 * Prototype policy for turning a distribution into a customer-facing window.
 *
 * q10 becomes the lower bound and q90 the upper bound, each rounded up to a
 * whole business day. Rounding is always conservative: 1.01 days becomes 2,
 * never 1, so arithmetic never produces a more attractive promise than the
 * model supports.
 *
 * PROTOTYPE ASSUMPTION. The choice of q10/q90 is deliberately simple and
 * transparent for the demo. Production quantile policy, and the promise
 * accuracy target behind it, should be agreed jointly by Product, Data and
 * Last Mile/Operations rather than chosen by Product alone.
 */
export function roundPrediction(prediction: RawDeliveryPrediction): BusinessDayWindow {
  const min = Math.max(1, Math.ceil(prediction.q10BusinessDays))
  const max = Math.max(min, Math.ceil(prediction.q90BusinessDays))
  return { min, max }
}
