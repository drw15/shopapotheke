import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { StoreHeader } from '../components/layout/StoreHeader'
import { BasketItemRow } from '../components/basket/BasketItemRow'
import { BasketShipmentPreview } from '../components/basket/BasketShipmentPreview'
import { DeliveryEstimate } from '../components/delivery/DeliveryEstimate'
import { PostcodeControl } from '../components/product/PostcodeControl'
import { PRODUCTS, requireProduct } from '../data/products'
import { getShipmentPromises, getUpperFunnelPromise, shouldRevealSplit } from '../domain/deliveryFacade'
import { useShop } from '../state/ShopContext'
import { useNow } from '../state/DemoClockContext'
import { formatEuro } from '../lib/format'

const FREE_SHIPPING_THRESHOLD_CENTS = 1900

export function BasketPage() {
  const { basket, postcode, setQuantity, removeFromBasket, addToBasket } = useShop()
  const now = useNow()
  const navigate = useNavigate()

  const productIds = basket.map((line) => line.productId)

  const totalCents = basket.reduce(
    (total, line) => total + requireProduct(line.productId).priceCents * line.quantity,
    0,
  )

  const { orderPromise, shipments, revealSplit } = useMemo(() => {
    const input = { productIds, postcode, now }
    return {
      orderPromise: getUpperFunnelPromise(input),
      shipments: getShipmentPromises(input),
      revealSplit: shouldRevealSplit(input),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productIds.join(','), postcode, now])

  const missingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - totalCents)
  const progress = Math.min(100, (totalCents / FREE_SHIPPING_THRESHOLD_CENTS) * 100)

  // Everything not already in the basket stays reachable from here, so a
  // reviewer can build any demo basket without going back to a product page.
  const suggestions = PRODUCTS.filter((product) => !productIds.includes(product.id))

  return (
    <>
      <StoreHeader />

      <div className="basket-title-band">
        <div className="retail-width">
          <h1 className="basket-title">Ihr Warenkorb ({basket.length})</h1>
        </div>
      </div>

      <main className="retail-width basket-page">
        {basket.length === 0 ? (
          <div className="basket-empty sa-card">
            <p>Ihr Warenkorb ist leer.</p>
            <Link to="/product/voltaren" className="sa-cta">
              Weiter einkaufen
            </Link>
          </div>
        ) : (
          <>
            <section className="basket-shipping-panel">
              <strong>Versand durch Shop Apotheke</strong>

              <div className="basket-shipping-panel__progress">
                {missingForFreeShipping > 0 ? (
                  <span className="basket-shipping-panel__note">
                    Noch {formatEuro(missingForFreeShipping)} bis zur Gratis-Lieferung
                  </span>
                ) : (
                  <span className="basket-shipping-panel__note">Gratis-Lieferung erreicht</span>
                )}
                <div className="basket-shipping-panel__bar">
                  <span style={{ width: `${progress}%` }} />
                </div>
              </div>

              <span className="basket-shipping-panel__threshold">19 €</span>
            </section>

            <div className="basket-delivery-summary">
              <DeliveryEstimate promise={orderPromise} />
              <PostcodeControl />
            </div>

            {revealSplit && <BasketShipmentPreview shipments={shipments} />}

            <div className="basket-list">
              {basket.map((line) => (
                <BasketItemRow
                  key={line.productId}
                  product={requireProduct(line.productId)}
                  quantity={line.quantity}
                  onQuantityChange={(quantity) => setQuantity(line.productId, quantity)}
                  onRemove={() => removeFromBasket(line.productId)}
                />
              ))}
            </div>

            <div className="basket-checkout-row">
              <div className="basket-total">
                <span className="sa-muted">Gesamtsumme</span>
                <strong>{formatEuro(totalCents)}</strong>
              </div>
              <button
                type="button"
                className="sa-cta"
                onClick={() => navigate('/checkout/address')}
              >
                Zur Kasse
              </button>
            </div>

            {suggestions.length > 0 && (
              <section className="basket-suggestions">
                <h2>Gratis Versand? Einfach Warenkorb füllen</h2>
                <div className="basket-suggestions__grid">
                  {suggestions.map((product) => (
                    <article key={product.id} className="suggestion-card">
                      <img src={product.image} alt="" width={72} height={72} />
                      <div className="suggestion-card__body">
                        <Link to={`/product/${product.id}`} className="suggestion-card__name">
                          {product.name}
                        </Link>
                        <span className="suggestion-card__price">
                          {formatEuro(product.priceCents)}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="suggestion-card__add"
                        onClick={() => addToBasket(product.id)}
                        aria-label={`${product.name} hinzufügen`}
                      >
                        +
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </>
  )
}
