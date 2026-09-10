import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Destination } from '../domain/checkout/types'
import type { Provider } from '../domain/types'

/** Generic fixture customer. Never the personal data visible in the references. */
export const DEMO_ADDRESS = {
  name: 'Max Mustermann',
  street: 'Musterstraße',
  houseNumber: '11',
  postcode: '22083',
  city: 'Hamburg',
}

type CheckoutState = {
  /** The destination the customer chose for the order as a whole. */
  orderDestination: Destination
  setOrderDestination: (destination: Destination) => void

  /**
   * Per-shipment overrides.
   *
   * Shipments inherit the order-level destination by default: Redcare creating
   * a split must not force the customer to configure every parcel. An entry
   * appears here only when the customer deliberately changed one shipment.
   */
  shipmentDestinations: Record<string, Destination>
  overrideShipmentDestination: (shipmentId: string, destination: Destination) => void
  clearShipmentOverride: (shipmentId: string) => void
  destinationFor: (shipmentId: string) => Destination

  /** Chosen carrier per shipment. */
  shipmentProviders: Record<string, Provider>
  setShipmentProvider: (shipmentId: string, provider: Provider) => void
}

const CheckoutContext = createContext<CheckoutState | null>(null)

export function CheckoutProvider({
  children,
  initialDestination,
}: {
  children: ReactNode
  initialDestination?: Destination
}) {
  const [orderDestination, setOrderDestination] = useState<Destination>(
    initialDestination ?? { method: 'home', address: DEMO_ADDRESS },
  )
  const [shipmentDestinations, setShipmentDestinations] = useState<Record<string, Destination>>({})
  const [shipmentProviders, setShipmentProviders] = useState<Record<string, Provider>>({})

  const value = useMemo<CheckoutState>(
    () => ({
      orderDestination,
      setOrderDestination: (destination) => {
        setOrderDestination(destination)
        // Changing the order-level choice resets per-shipment overrides: the
        // customer has restated what they want for the whole order.
        setShipmentDestinations({})
      },
      shipmentDestinations,
      overrideShipmentDestination: (shipmentId, destination) =>
        setShipmentDestinations((current) => ({ ...current, [shipmentId]: destination })),
      clearShipmentOverride: (shipmentId) =>
        setShipmentDestinations((current) => {
          const next = { ...current }
          delete next[shipmentId]
          return next
        }),
      destinationFor: (shipmentId) => shipmentDestinations[shipmentId] ?? orderDestination,
      shipmentProviders,
      setShipmentProvider: (shipmentId, provider) =>
        setShipmentProviders((current) => ({ ...current, [shipmentId]: provider })),
    }),
    [orderDestination, shipmentDestinations, shipmentProviders],
  )

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>
}

export function useCheckout(): CheckoutState {
  const context = useContext(CheckoutContext)
  if (!context) throw new Error('useCheckout must be used inside a CheckoutProvider')
  return context
}
