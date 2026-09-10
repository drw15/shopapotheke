import type { ShipmentPromise } from '../../domain/deliveryFacade'
import { requireProduct } from '../../data/products'
import { DeliveryEstimate } from '../delivery/DeliveryEstimate'

/**
 * Split delivery preview in the basket.
 *
 * Shown only when the split is material. Product names and thumbnails are
 * included here because the basket is still about order composition: the
 * customer needs to see which items arrive when.
 *
 * Deliberately absent: prices, quantity controls, carrier choice, and any hint
 * of why the order was split. Those either live elsewhere or are internal.
 */
export function BasketShipmentPreview({ shipments }: { shipments: ShipmentPromise[] }) {
  return (
    <section className="basket-split" aria-label="Lieferungen">
      <h2 className="basket-split__title">
        Ihre Bestellung kommt in {shipments.length} Lieferungen
      </h2>

      <div className="basket-split__list">
        {shipments.map((entry, index) => (
          <article key={entry.shipment.id} className="basket-split__shipment">
            <div className="basket-split__label">
              Lieferung {index + 1} von {shipments.length}
            </div>

            <div className="basket-split__body">
              <div className="basket-split__thumbs">
                {entry.shipment.productIds.map((productId) => (
                  <img
                    key={productId}
                    src={requireProduct(productId).image}
                    alt=""
                    width={44}
                    height={44}
                  />
                ))}
              </div>

              <div className="basket-split__details">
                <div className="basket-split__names">
                  {entry.shipment.productIds
                    .map((productId) => requireProduct(productId).name)
                    .join(', ')}
                </div>
                <DeliveryEstimate promise={entry.promise} prefix="Voraussichtlich" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
