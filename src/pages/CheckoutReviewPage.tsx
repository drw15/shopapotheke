import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckoutHeader } from '../components/layout/CheckoutHeader'
import { CheckoutTrustRow } from '../components/checkout/CheckoutTrustRow'
import { buildShippingView } from '../domain/checkout/buildShippingView'
import { confirmOrder } from '../domain/order/confirmOrder'
import { requireProduct } from '../data/products'
import { useShop } from '../state/ShopContext'
import { useCheckout, DEMO_ADDRESS } from '../state/CheckoutContext'
import { useOrders } from '../state/OrderContext'
import { useNow } from '../state/DemoClockContext'
import { formatEuro } from '../lib/format'
import { planShipments } from '../domain/fulfilment/shipmentPlanner'
import type { Provider } from '../domain/types'

/** Sequential demo order ids, continuing after the prebuilt ones. */
let nextOrderNumber = 100425

export function CheckoutReviewPage() {
  const { basket, postcode, clearBasket } = useShop()
  const { destinationFor, shipmentProviders } = useCheckout()
  const { addOrder } = useOrders()
  const now = useNow()
  const navigate = useNavigate()

  const productIds = basket.map((line) => line.productId)

  const shipments = useMemo(
    () =>
      buildShippingView({
        productIds,
        postcode: postcode ?? DEMO_ADDRESS.postcode,
        now,
        destinationFor,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [productIds.join(','), postcode, now, destinationFor],
  )

  const totalCents = basket.reduce(
    (total, line) => total + requireProduct(line.productId).priceCents * line.quantity,
    0,
  )

  const placeOrder = () => {
    const planned = planShipments(productIds)
    const orderId = String(nextOrderNumber++)

    const order = confirmOrder({
      orderId,
      createdAt: now.toISOString(),
      shipments: shipments.map((view, index) => {
        const provider = (shipmentProviders[view.shipmentId] ?? 'dhl') as Provider
        const option = view.options.find((entry) => entry.provider === provider) ?? view.options[0]

        // The estimate the customer actually saw becomes the promise. A
        // fallback shipment has no dates to freeze, so it keeps the broad
        // promise and simply has no precise commitment to break later.
        const promiseMin =
          option.promise.kind === 'precise' ? option.promise.minDate : ''
        const promiseMax =
          option.promise.kind === 'precise' ? option.promise.maxDate : ''

        return {
          id: view.shipmentId,
          productIds: planned[index]?.productIds ?? [],
          method: view.method,
          provider,
          destinationLabel: view.destinationLabel,
          promiseMin,
          promiseMax,
        }
      }),
    })

    addOrder(order)
    clearBasket()
    navigate(`/confirmation/${orderId}`)
  }

  return (
    <>
      <CheckoutHeader activeStep="review" />

      <main className="checkout-width checkout-page">
        <h1 className="checkout-page__title">Bitte prüfen Sie Ihre Bestellung</h1>

        <div className="checkout-page__columns">
          <div className="checkout-page__main">
            {shipments.map((view, index) => {
              const provider = (shipmentProviders[view.shipmentId] ?? 'dhl') as Provider
              const option =
                view.options.find((entry) => entry.provider === provider) ?? view.options[0]

              return (
                <section key={view.shipmentId} className="shipping-block">
                  <h2 className="shipping-block__title">
                    {shipments.length > 1
                      ? `Lieferung ${index + 1} von ${shipments.length}`
                      : 'Ihre Lieferung'}
                  </h2>
                  <div className="review-line">
                    <span className="sa-muted">{view.destinationLabel}</span>
                    <span className="sa-muted">{option.label}</span>
                    <span className="sa-delivery-text">
                      {option.promise.kind === 'precise'
                        ? `Lieferzeitraum: ${option.promise.label}`
                        : option.promise.label}
                    </span>
                  </div>
                </section>
              )
            })}

            <button
              type="button"
              className="sa-cta sa-cta--block checkout-page__continue"
              onClick={placeOrder}
              disabled={basket.length === 0}
            >
              Zahlungspflichtig bestellen
            </button>
          </div>

          <aside className="checkout-page__aside">
            <div className="sa-card order-summary">
              <div className="order-summary__row">
                <span>Zwischensumme</span>
                <span>{formatEuro(totalCents)}</span>
              </div>
              <div className="order-summary__row">
                <span>Versandkosten</span>
                <span>€ 0,00</span>
              </div>
              <div className="order-summary__total">
                <span>Gesamtsumme</span>
                <span>{formatEuro(totalCents)}</span>
              </div>
            </div>
          </aside>
        </div>

        <CheckoutTrustRow />
      </main>
    </>
  )
}
