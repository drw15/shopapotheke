import type { ShipmentShippingView } from '../../domain/checkout/buildShippingView'

/**
 * Split-shipment header.
 *
 * Tiny thumbnails and an item count only. Product names are deliberately
 * absent: the basket already covered order composition, and repeating it here
 * would turn the delivery step back into a basket.
 */
export function ShipmentHeader({
  view,
  index,
  total,
  onChangeMethod,
}: {
  view: ShipmentShippingView
  index: number
  total: number
  onChangeMethod: () => void
}) {
  return (
    <header className="shipment-header">
      <div className="shipment-header__top">
        <span className="shipment-header__label">
          Lieferung {index + 1} von {total}
        </span>

        <div className="shipment-header__thumbs">
          {view.thumbnails.map((src, position) => (
            <img key={`${src}-${position}`} src={src} alt="" width={32} height={32} />
          ))}
        </div>

        <span className="shipment-header__count sa-muted">
          {view.itemCount} {view.itemCount === 1 ? 'Artikel' : 'Artikel'}
        </span>
      </div>

      <div className="shipment-header__destination">
        <span className="sa-muted">
          {view.method === 'home' ? 'Lieferung nach Hause:' : 'Abholort:'} {view.destinationLabel}
        </span>
        <button type="button" className="shipment-header__change" onClick={onChangeMethod}>
          Lieferart ändern
        </button>
      </div>
    </header>
  )
}
