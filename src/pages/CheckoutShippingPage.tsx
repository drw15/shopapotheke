import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckoutHeader } from '../components/layout/CheckoutHeader'
import { ShipmentShippingBlock } from '../components/checkout/ShipmentShippingBlock'
import { CheckoutTrustRow } from '../components/checkout/CheckoutTrustRow'
import { buildShippingView } from '../domain/checkout/buildShippingView'
import { requireProduct } from '../data/products'
import { useShop } from '../state/ShopContext'
import { useCheckout, DEMO_ADDRESS } from '../state/CheckoutContext'
import { useNow } from '../state/DemoClockContext'
import { formatEuro } from '../lib/format'
import type { Provider } from '../domain/types'

export function CheckoutShippingPage() {
  const { basket, postcode } = useShop()
  const { destinationFor, overrideShipmentDestination, shipmentProviders, setShipmentProvider } =
    useCheckout()
  const now = useNow()
  const navigate = useNavigate()
  const [openOverride, setOpenOverride] = useState<string | null>(null)

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

  const isSplit = shipments.length > 1

  return (
    <>
      <CheckoutHeader activeStep="shipping" />

      <main className="checkout-width checkout-page">
        <h1 className="checkout-page__title">Bitte wählen Sie eine Versandoption</h1>

        <div className="checkout-page__columns">
          <div className="checkout-page__main">
            {isSplit && (
              <div className="split-notice">
                <strong>Ihre Bestellung kommt in {shipments.length} Lieferungen</strong>
                <span className="sa-muted">
                  So können verfügbare Artikel früher bei Ihnen ankommen.
                </span>
              </div>
            )}

            {shipments.map((view, index) => (
              <ShipmentShippingBlock
                key={view.shipmentId}
                view={view}
                index={index}
                total={shipments.length}
                selectedProvider={(shipmentProviders[view.shipmentId] ?? 'dhl') as Provider}
                onSelectProvider={(provider) => setShipmentProvider(view.shipmentId, provider)}
                overrideOpen={openOverride === view.shipmentId}
                onToggleOverride={() =>
                  setOpenOverride((current) =>
                    current === view.shipmentId ? null : view.shipmentId,
                  )
                }
                onOverrideDestination={(destination) =>
                  overrideShipmentDestination(view.shipmentId, destination)
                }
                postcode={postcode}
              />
            ))}

            <button
              type="button"
              className="sa-cta sa-cta--block checkout-page__continue"
              onClick={() => navigate('/checkout/payment')}
            >
              Weiter zur Zahlungsart
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
