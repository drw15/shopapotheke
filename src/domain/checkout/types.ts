import type { DeliveryMethod, Provider } from '../types'

export type Address = {
  name: string
  street: string
  houseNumber: string
  postcode: string
  city: string
}

export type PickupLocation = {
  id: string
  /** Which provider's network this location belongs to. */
  provider: Provider
  kind: 'packstation' | 'paketshop' | 'partner-apotheke'
  name: string
  street: string
  postcode: string
  city: string
  distanceMetres: number
}

/**
 * Where one shipment is going.
 *
 * Home versus pickup is the first-level decision; the provider follows from it.
 * That ordering matches the current site and must not be flattened into a
 * single list of carrier/location combinations.
 */
export type Destination =
  | { method: Extract<DeliveryMethod, 'home'>; address: Address }
  | { method: Extract<DeliveryMethod, 'pickup'>; location: PickupLocation }

export function destinationLabel(destination: Destination): string {
  if (destination.method === 'home') {
    const { street, houseNumber, postcode, city } = destination.address
    return `${street} ${houseNumber}, ${postcode} ${city}`
  }
  const { name, street, postcode, city } = destination.location
  return `${name}, ${street}, ${postcode} ${city}`
}
