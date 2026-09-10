import type { Product } from '../../domain/types'
import { formatEuro } from '../../lib/format'

/** Basket line, matching the product-row proportions in the basket reference. */
export function BasketItemRow({
  product,
  quantity,
  onQuantityChange,
  onRemove,
}: {
  product: Product
  quantity: number
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
}) {
  return (
    <article className="basket-row">
      <img className="basket-row__image" src={product.image} alt="" width={116} height={116} />

      <div className="basket-row__info">
        <h3 className="basket-row__name">{product.name}</h3>
        <div className="sa-muted basket-row__meta">
          {product.packSize}
          <br />
          PZN: {product.pzn}
          <br />
          {formatEuro(product.priceCents)} ({product.basePriceLabel})
        </div>
        <div className="sa-delivery-text basket-row__availability">Verfügbar</div>
      </div>

      <button
        type="button"
        className="basket-row__remove"
        onClick={onRemove}
        aria-label={`${product.name} entfernen`}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <label className="basket-row__quantity">
        <span className="quantity-control__label">Menge:</span>
        <select
          value={quantity}
          onChange={(event) => onQuantityChange(Number(event.target.value))}
          aria-label={`Menge für ${product.name}`}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>

      <div className="basket-row__sum">
        <span className="sa-muted">Summe</span>
        <strong>{formatEuro(product.priceCents * quantity)}</strong>
      </div>
    </article>
  )
}
