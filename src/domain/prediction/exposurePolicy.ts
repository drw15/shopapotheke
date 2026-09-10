import { PROMISE_POLICY } from '../../config/promisePolicy'
import type { RawDeliveryPrediction } from '../types'

/**
 * Why a prediction was or was not exposed.
 *
 * The reason is for tests, diagnostics and experiment analysis only. It is
 * never rendered: a customer who hits a fallback simply sees the broad promise
 * and is not told that a model declined to commit.
 */
export type ExposureReason =
  | 'safe'
  | 'low-confidence'
  | 'poor-calibration'
  | 'low-support'
  | 'missing'
  | 'unsupported'
  | 'service-error'

export type ExposureDecision = {
  safeToExpose: boolean
  reason: ExposureReason
}

/**
 * The prototype's stand-in for a production `safe_to_expose` flag.
 *
 * The existence of a model output is not sufficient to make a precise promise
 * customer-facing. All three gates must pass independently: a very confident,
 * well-calibrated prediction backed by too little history is still withheld.
 *
 * In production this decision belongs behind the prediction API, agreed
 * jointly by Product, Data and Last Mile/Operations, so the UI never
 * reimplements statistical governance.
 */
export function evaluateExposure(prediction: RawDeliveryPrediction | null): ExposureDecision {
  if (!prediction) return { safeToExpose: false, reason: 'missing' }

  if (prediction.confidenceScore < PROMISE_POLICY.minConfidence) {
    return { safeToExpose: false, reason: 'low-confidence' }
  }

  if (prediction.calibrationError > PROMISE_POLICY.maxCalibrationError) {
    return { safeToExpose: false, reason: 'poor-calibration' }
  }

  if (prediction.supportN < PROMISE_POLICY.minSupportN) {
    return { safeToExpose: false, reason: 'low-support' }
  }

  return { safeToExpose: true, reason: 'safe' }
}
