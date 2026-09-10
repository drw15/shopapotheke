import { buildStandardHomeEnvelope } from './promise/buildCarrierEnvelope'
import { buildCustomerPromise } from './promise/buildPromise'
import { planShipments, type PlannedShipment } from './fulfilment/shipmentPlanner'
import { isMaterialSplit } from './fulfilment/materialSplit'
import type { CustomerPromise } from './promise/types'
import type { DeliveryMethod, Provider } from './types'
import { FALLBACK_PROMISE } from './promise/buildPromise'

/**
 * The single entry point the UI uses for delivery information.
 *
 * Pages and components consume customer-ready promises from here and never
 * reach into the prediction fixtures, exposure policy or calendar directly.
 */

export type UpperFunnelInput = {
  productIds: string[]
  postcode: string | null
  now: Date
}

/**
 * The promise shown before a carrier has been chosen (PDP and basket).
 *
 * Without a postcode there is no location to predict for, so this is the
 * existing broad promise rather than a guess.
 */
export function getUpperFunnelPromise(input: UpperFunnelInput): CustomerPromise {
  if (!input.postcode) return FALLBACK_PROMISE

  return buildStandardHomeEnvelope({
    productIds: input.productIds,
    postcode: input.postcode,
    now: input.now,
  })
}

export type ShipmentPromise = {
  shipment: PlannedShipment
  promise: CustomerPromise
}

/** Plan the shipments for a basket and resolve each one's upper-funnel promise. */
export function getShipmentPromises(input: UpperFunnelInput): ShipmentPromise[] {
  return planShipments(input.productIds).map((shipment) => ({
    shipment,
    promise: getUpperFunnelPromise({ ...input, productIds: shipment.productIds }),
  }))
}

/**
 * Whether the basket should reveal the split.
 *
 * Two fulfilment groups is not itself a reason: the split is shown only when
 * it tells the customer something they can use.
 */
export function shouldRevealSplit(input: UpperFunnelInput): boolean {
  const shipments = getShipmentPromises(input)
  if (shipments.length < 2) return false
  if (!input.postcode) return false

  return isMaterialSplit({
    postcode: input.postcode,
    promises: shipments.map((entry) => entry.promise),
  })
}

export type CarrierOptionInput = {
  productIds: string[]
  postcode: string
  method: DeliveryMethod
  now: Date
}

/**
 * Per-carrier promises for the checkout shipping step.
 *
 * By this point the customer is choosing between concrete services, so each
 * carrier shows its own predicted window rather than an envelope. Multi-product
 * shipments are constrained by their slowest item.
 */
export function getCarrierPromises(
  input: CarrierOptionInput,
): Array<{ provider: Provider; promise: CustomerPromise }> {
  const providers: Provider[] = ['dhl', 'hermes']

  return providers.map((provider) => {
    const promises = input.productIds.map((productId) =>
      buildCustomerPromise({
        productId,
        postcode: input.postcode,
        method: input.method,
        provider,
        now: input.now,
      }),
    )

    // Any unsafe item collapses the whole shipment to the broad promise.
    if (promises.some((promise) => promise.kind === 'fallback')) {
      return { provider, promise: FALLBACK_PROMISE }
    }

    const precise = promises as Array<Extract<CustomerPromise, { kind: 'precise' }>>

    // The shipment is constrained by its slowest item: the window runs from the
    // slowest item's earliest date to its latest, so the customer is not shown a
    // start date that only applies to part of the parcel.
    const maxDate = precise.map((p) => p.maxDate).sort().at(-1)!
    const slowest = precise.find((p) => p.maxDate === maxDate)!

    return { provider, promise: slowest }
  })
}
