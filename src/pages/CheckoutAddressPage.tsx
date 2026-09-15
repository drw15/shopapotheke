import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckoutHeader } from '../components/layout/CheckoutHeader'
import { DeliveryMethodChoice } from '../components/checkout/DeliveryMethodChoice'
import { PickupStationModal } from '../components/checkout/PickupStationModal'
import { CheckoutTrustRow } from '../components/checkout/CheckoutTrustRow'
import { NewAddressForm } from '../components/checkout/NewAddressForm'
import { DEMO_ADDRESS, useCheckout } from '../state/CheckoutContext'
import { useShop } from '../state/ShopContext'
import type { Address, PickupLocation } from '../domain/checkout/types'

export function CheckoutAddressPage() {
  const { orderDestination, setOrderDestination } = useCheckout()
  const { postcode, setPostcode } = useShop()
  const navigate = useNavigate()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [addressFormOpen, setAddressFormOpen] = useState(false)
  // Pickup can be chosen as the method before a station has been picked, which
  // is the state where the reference shows the station-picker CTA.
  const [pickupIntent, setPickupIntent] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState<Address | null>(null)

  // The delivery postcode drives the prediction. Keep the shop-level postcode
  // aligned with the address the customer is actually checking out to.
  const address = deliveryAddress ?? {
    ...DEMO_ADDRESS,
    postcode: postcode ?? DEMO_ADDRESS.postcode,
  }

  // Pickup settles both the destination and the carrier, so there is nothing
  // left for the Versand step to ask.
  const isPickup = orderDestination.method === 'pickup'

  // The station lookup must use the address the page is actually showing. A
  // customer who never entered a postcode still sees the demo address, and
  // looking up `null` would claim there are no stations near an address that
  // plainly has some.
  const lookupPostcode = address.postcode

  const choosePickup = (location: PickupLocation) => {
    setOrderDestination({ method: 'pickup', location })
    setPostcode(location.postcode)
    setPickerOpen(false)
    setPickupIntent(false)
  }

  return (
    <>
      <CheckoutHeader activeStep="address" />

      <main className="checkout-width checkout-page">
        <h1 className="checkout-page__title">Wohin sollen wir Ihre Bestellung liefern?</h1>

        <div className="checkout-page__columns">
          <div className="checkout-page__main">
            <DeliveryMethodChoice
              destination={orderDestination}
              address={address}
              pickupSelected={pickupIntent}
              onChooseHome={() => {
                setPickupIntent(false)
                setOrderDestination({ method: 'home', address })
              }}
              onSelectPickup={() => setPickupIntent(true)}
              onOpenPickupPicker={() => setPickerOpen(true)}
            />

            {addressFormOpen && (
              <NewAddressForm
                initial={address}
                onSave={(next) => {
                  setDeliveryAddress(next)
                  setPostcode(next.postcode)
                  setOrderDestination({ method: 'home', address: next })
                  setAddressFormOpen(false)
                  setPickupIntent(false)
                }}
                onCancel={() => setAddressFormOpen(false)}
              />
            )}

            <button
              type="button"
              className="sa-cta sa-cta--block checkout-page__continue"
              onClick={() => navigate(isPickup ? '/checkout/payment' : '/checkout/shipping')}
            >
              {isPickup ? 'Weiter zur Zahlungsart' : 'Weiter zum Versand'}
            </button>
          </div>

          <aside className="checkout-page__aside">
            <div className="sa-card checkout-aside-card">
              <h2>Weitere Lieferoptionen</h2>
              <button
                type="button"
                className="checkout-aside-card__link"
                onClick={() => setAddressFormOpen(true)}
              >
                <span className="checkout-aside-card__icon">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9.5Z"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                An eine neue Lieferadresse
              </button>
            </div>
          </aside>
        </div>

        <CheckoutTrustRow />
      </main>

      {pickerOpen && (
        <PickupStationModal
          postcode={lookupPostcode}
          onSelect={choosePickup}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  )
}
