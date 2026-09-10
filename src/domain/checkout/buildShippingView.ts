import { requireProduct } from '../../data/products'
import { getCarrierPromises } from '../deliveryFacade'
import { planShipments } from '../fulfilment/shipmentPlanner'
import type { CustomerPromise } from '../promise/types'
import type { Provider } from '../types'
import { destinationLabel, type Destination } from './types'

export type ShipmentShippingView = {
  shipmentId: string
  itemCount: number
  /** Tiny thumbnails only: checkout is about delivery options, not products. */
  thumbnails: string[]
  method: 'home' | 'pickup'
  destinationLabel: string
  options: Array<{
    provider: Provider
    label: string
    promise: CustomerPromise
  }>
}

export type CheckoutShippingInput = {
  productIds: string[]
  postcode: string
  now: Date
  /** Resolves each shipment's destination, applying any per-shipment override. */
  destinationFor: (shipmentId: string) => Destination
}

const PROVIDER_LABEL: Record<Provider, string> = {
  dhl: 'Standard mit DHL',
  hermes: 'Standard mit HERMES',
}

/**
 * Build the `Versand` step.
 *
 * One shipment renders one shipping block; a split order renders the same block
 * twice on the same step rather than becoming a separate wizard.
 *
 * Each shipment's options are predicted for that shipment's own destination,
 * so changing one parcel to pickup re-predicts only that parcel.
 */
export function buildShippingView(input: CheckoutShippingInput): ShipmentShippingView[] {
  return planShipments(input.productIds).map((shipment) => {
    const destination = input.destinationFor(shipment.id)

    // A pickup destination predicts against the station's postcode; a home
    // destination against the delivery address.
    const postcode =
      destination.method === 'pickup' ? destination.location.postcode : input.postcode

    const promises = getCarrierPromises({
      productIds: shipment.productIds,
      postcode,
      method: destination.method,
      now: input.now,
    })

    return {
      shipmentId: shipment.id,
      itemCount: shipment.productIds.length,
      thumbnails: shipment.productIds.map((productId) => requireProduct(productId).image),
      method: destination.method,
      destinationLabel: destinationLabel(destination),
      options: promises.map(({ provider, promise }) => ({
        provider,
        label: PROVIDER_LABEL[provider],
        promise,
      })),
    }
  })
}
