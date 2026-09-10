/**
 * Shared domain vocabulary for the delivery promise prototype.
 *
 * Nothing in this file is customer-facing. Raw model fields must never reach
 * a React component; UI code consumes customer-ready view models only.
 */

export type DeliveryMethod = 'home' | 'pickup'

/** Standard demo carriers. DPD and other carriers are deliberately absent. */
export type Provider = 'dhl' | 'hermes'

/**
 * Demo fulfilment grouping.
 *
 * `external-demo` is a fictional assignment that exists only to exercise the
 * unsupported-model and split-shipment paths. It must never be presented to a
 * customer, and it does not describe Redcare's real product fulfilment.
 */
export type FulfilmentGroup = 'sevenum-demo' | 'external-demo'

/**
 * The mock prediction service response.
 *
 * Carrier/service is part of the model input rather than a fixed offset
 * applied after a generic prediction: performance is carrier-specific.
 */
export type RawDeliveryPrediction = {
  productId: string
  postcode: string
  method: DeliveryMethod
  provider: Provider
  meanBusinessDays: number
  q10BusinessDays: number
  q50BusinessDays: number
  q90BusinessDays: number
  confidenceScore: number
  /** Absolute difference between nominal and observed q10-q90 coverage. */
  calibrationError: number
  supportN: number
  modelVersion: 'demo-v1'
}

export type PredictionQuery = {
  productId: string
  postcode: string
  method: DeliveryMethod
  provider: Provider
}

export type Product = {
  id: string
  name: string
  /** Shown under the product name, matching the reference PDP/basket rows. */
  packSize: string
  pzn: string
  priceCents: number
  strikePriceCents?: number
  basePriceLabel: string
  image: string
  fulfilmentGroup: FulfilmentGroup
  /** Whether the standard prediction model covers this product at all. */
  modelEligible: boolean
}

export type PostcodeArea = {
  postcode: string
  city: string
  /** ISO 3166-2 subdivision code used for state-specific holiday handling. */
  state: string
}
