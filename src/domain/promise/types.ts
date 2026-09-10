import type { DeliveryMethod, Provider } from '../types'

/**
 * The customer-ready promise.
 *
 * This is the only delivery shape React components may consume. It carries no
 * quantiles, confidence, calibration, support counts, warehouse identifiers,
 * fulfilment groups or fallback reasons - by construction, not by convention.
 */
export type CustomerPromise =
  | {
      kind: 'fallback'
      label: string
      cutoffText?: undefined
      minDate?: undefined
      maxDate?: undefined
    }
  | {
      kind: 'precise'
      /** ISO calendar date, for comparisons and storage. */
      minDate: string
      maxDate: string
      /** German label such as `Fr., 11. – Mo., 14. September`. */
      label: string
      /** Present only when crossing the cutoff would change the dates above. */
      cutoffText?: string
    }

export type PromiseInput = {
  productId: string
  postcode: string
  method: DeliveryMethod
  provider: Provider
  now: Date
}

export type EnvelopeInput = {
  productIds: string[]
  postcode: string
  now: Date
  /** Defaults to the standard home carriers. */
  providers?: Provider[]
  method?: DeliveryMethod
}
