import { findPrediction } from '../../data/predictionMatrix'
import { getProduct } from '../../data/products'
import type { PredictionQuery, RawDeliveryPrediction } from '../types'
import { evaluateExposure, type ExposureDecision } from './exposurePolicy'

/**
 * Mock prediction service.
 *
 * Stands in for the Data team's delivery prediction API. Everything above this
 * boundary consumes customer-ready promises; nothing above it reads the
 * fixture matrix directly.
 */

export function getRawPrediction(query: PredictionQuery): RawDeliveryPrediction | null {
  return findPrediction(query) ?? null
}

export type ResolvedPrediction = {
  prediction: RawDeliveryPrediction | null
  decision: ExposureDecision
}

/**
 * Resolve a prediction and its exposure decision without ever throwing.
 *
 * Failure has to be boring for the customer: an unknown postcode, an
 * out-of-scope product or a broken backend all end at the same broad promise,
 * and none of them may block browsing or checkout.
 */
export function resolvePrediction(query: PredictionQuery): ResolvedPrediction {
  const product = getProduct(query.productId)

  // The model has no coverage for this product at all - a different situation
  // from a lane simply being missing, and worth keeping separable for analysis.
  if (product && !product.modelEligible) {
    return { prediction: null, decision: { safeToExpose: false, reason: 'unsupported' } }
  }

  try {
    const prediction = getRawPrediction(query)
    return { prediction, decision: evaluateExposure(prediction) }
  } catch {
    return { prediction: null, decision: { safeToExpose: false, reason: 'service-error' } }
  }
}
