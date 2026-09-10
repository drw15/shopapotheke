import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Product } from '../../domain/types'
import type { CustomerPromise } from '../../domain/promise/types'
import { DeliveryEstimate } from '../delivery/DeliveryEstimate'
import { PostcodeControl } from './PostcodeControl'
import { ExistingNowServiceCard } from './ExistingNowServiceCard'
import { useShop } from '../../state/ShopContext'
import { formatEuro } from '../../lib/format'

/**
 * PDP purchase card.
 *
 * Follows the reference layout: price block, delivery line with the postcode
 * affordance on the right, free-shipping note, the existing NOW! card, then
 * the quantity control and basket CTA.
 *
 * The delivery-promise concept changes exactly one line here.
 */
export function ProductPurchaseCard({
  product,
  promise,
}: {
  product: Product
  promise: CustomerPromise
}) {
  const { addToBasket } = useShop()
  const navigate = useNavigate()
  const [quantity, setQuantity] = useState(1)

  return (
    <div className="purchase-card">
      <div className="purchase-card__prices">
        <span className="purchase-card__price">{formatEuro(product.priceCents)}</span>
        {product.strikePriceCents && (
          <span className="purchase-card__strike">{formatEuro(product.strikePriceCents)}</span>
        )}
      </div>

      <div className="purchase-card__base-price sa-muted">{product.basePriceLabel}</div>

      <div className="purchase-card__delivery">
        <DeliveryEstimate promise={promise} />
        <PostcodeControl />
      </div>

      <div className="purchase-card__shipping-note">
        Kostenloser <a href="#versand">Versand</a> ab 19 €
      </div>

      <ExistingNowServiceCard />

      <div className="purchase-card__actions">
        <label className="quantity-control">
          <span className="quantity-control__label">Menge</span>
          <select
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
            aria-label="Menge"
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="sa-cta purchase-card__cta"
          onClick={() => {
            addToBasket(product.id, quantity)
            navigate('/basket')
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 8h12l-1 12H7L6 8Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path d="M9.5 8V6.6a2.5 2.5 0 0 1 5 0V8" stroke="currentColor" strokeWidth="1.8" />
          </svg>
          In den Warenkorb
        </button>
      </div>
    </div>
  )
}
