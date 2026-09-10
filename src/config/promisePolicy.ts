/**
 * Prototype promise policy.
 *
 * IMPORTANT: every value here is a demo assumption, not a Redcare fact.
 *
 * The exposure gates are illustrative thresholds chosen so reviewers can
 * exercise both safe and fallback states. In production, Product, Data and
 * Last Mile/Operations should agree the exposure policy jointly, and the
 * prediction API should then return a simple `safe_to_expose` decision so the
 * UI never reimplements statistical governance.
 *
 * The customer-facing cutoff is derived from an illustrative operational
 * chain: 23:00 carrier handover - 3h packing/processing - 1h safety buffer.
 */
export const PROMISE_POLICY = {
  /** Minimum model confidence before a precise promise may be exposed. */
  minConfidence: 0.9,
  /** Maximum absolute q10-q90 interval coverage error tolerated. */
  maxCalibrationError: 0.03,
  /** Minimum historical sample support behind the prediction. */
  minSupportN: 500,

  /** Customer-facing order cutoff, deterministic operational policy. */
  customerCutoffHour: 19,
  /** Operational carrier handover cutoff (context for the derivation above). */
  operationalCutoffHour: 23,
  /** Hours required for packing/processing before handover. */
  processingHours: 3,
  /** Additional safety buffer hours. */
  safetyBufferHours: 1,

  /** All customer-facing dates are resolved in this zone. */
  timeZone: 'Europe/Berlin',
  /** Latest promised delivery time of day. */
  latestDeliveryHour: 18,

  /** The existing broad promise used whenever precision is not safe. */
  fallbackLabel: 'Lieferung in 1–3 Werktagen',
  /** Business-day bounds the fallback label represents. */
  fallbackMinBusinessDays: 1,
  fallbackMaxBusinessDays: 3,
} as const
