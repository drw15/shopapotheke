import { useState } from 'react'
import type { PickupLocation } from '../../domain/checkout/types'
import { getPickupLocations } from '../../data/pickupLocations'
import { getSingleCarrierPromise } from '../../domain/deliveryFacade'
import { useShop } from '../../state/ShopContext'
import { useNow } from '../../state/DemoClockContext'
import { ProviderBadge } from './ProviderBadge'

const FILTERS = [
  { id: 'hermes-paketshop', label: 'Hermes PaketShop' },
  { id: 'dhl-paketshop', label: 'DHL Paketshop/Filiale' },
  { id: 'dhl-packstation', label: 'DHL Packstation' },
  { id: 'schnellste', label: 'Schnellste Abholung' },
]

/**
 * Existing-style pickup station picker.
 *
 * Layout follows the reference: search across the top, filter checkboxes, the
 * station list on the left and a map-style panel on the right.
 *
 * The map panel is deliberately static. No map SDK is loaded and there is no
 * parcel-shop lookup service behind the list.
 */
export function PickupStationModal({
  postcode,
  productIds: scopedProductIds,
  onSelect,
  onClose,
}: {
  postcode: string | null
  /**
   * The products this choice applies to. Omitted at order level, where it is
   * the whole basket; passed when one shipment of a split order is being
   * changed, so the station shows that parcel's promise and not the slowest
   * item in the basket.
   */
  productIds?: string[]
  onSelect: (location: PickupLocation) => void
  onClose: () => void
}) {
  const { basket } = useShop()
  const now = useNow()
  const locations = getPickupLocations(postcode)
  const [selectedId, setSelectedId] = useState<string | null>(locations[0]?.id ?? null)

  // Each station carries its own promise: the station's operator is the
  // carrier, so this is the last delivery decision the customer makes.
  const productIds = scopedProductIds ?? basket.map((line) => line.productId)
  const promiseFor = (location: PickupLocation) =>
    getSingleCarrierPromise({
      productIds,
      postcode: location.postcode,
      method: 'pickup',
      provider: location.provider,
      now,
    })

  const selected = locations.find((location) => location.id === selectedId) ?? null

  return (
    <div className="pickup-modal__backdrop" role="dialog" aria-modal="true" aria-label="Abholstation finden">
      <div className="pickup-modal">
        <header className="pickup-modal__header">
          <h2>Abholstation finden</h2>
          <button type="button" className="pickup-modal__close" onClick={onClose} aria-label="Schließen">
            ✕
          </button>
        </header>

        <div className="pickup-modal__search">
          <input
            defaultValue={postcode ? `${postcode}` : ''}
            placeholder="PLZ oder Ort"
            aria-label="Suche nach PLZ oder Ort"
          />
          <button type="button" className="pickup-modal__search-button" aria-label="Suchen">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" />
              <path d="m16.5 16.5 4 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="pickup-modal__filters">
          <span className="pickup-modal__filters-label">Stationen filtern:</span>
          {FILTERS.map((filter) => (
            <label key={filter.id} className="pickup-modal__filter">
              <input type="checkbox" defaultChecked />
              {filter.label}
            </label>
          ))}
        </div>

        <div className="pickup-modal__body">
          <ul className="pickup-modal__list">
            {locations.length === 0 && (
              <li className="pickup-modal__empty sa-muted">
                Für diese Postleitzahl sind keine Abholorte hinterlegt.
              </li>
            )}

            {locations.map((location) => (
              <li key={location.id}>
                <label
                  className={
                    location.id === selectedId
                      ? 'pickup-station pickup-station--selected'
                      : 'pickup-station'
                  }
                >
                  <input
                    type="radio"
                    name="pickup-station"
                    className="sr-only"
                    checked={location.id === selectedId}
                    onChange={() => setSelectedId(location.id)}
                  />
                  <ProviderBadge provider={location.provider} />
                  <span className="pickup-station__details">
                    <strong>{location.name}</strong>
                    <span className="sa-muted">
                      {location.street}
                      <br />
                      {location.postcode} {location.city}
                    </span>
                    <span className="sa-delivery-text pickup-station__promise">
                      {promiseFor(location).label}
                    </span>
                  </span>
                  <span className="pickup-station__distance sa-muted">
                    {location.distanceMetres} m
                  </span>
                </label>
              </li>
            ))}
          </ul>

          {/* Static map-style panel: visual fidelity only, no map SDK. */}
          <div className="pickup-modal__map" aria-hidden="true">
            <div className="pickup-modal__map-grid" />
            <span className="pickup-modal__map-pin" />
            <span className="pickup-modal__map-note">Kartenansicht</span>
          </div>
        </div>

        <footer className="pickup-modal__footer">
          <button
            type="button"
            className="sa-cta"
            disabled={!selected}
            onClick={() => selected && onSelect(selected)}
          >
            Abholstation übernehmen
          </button>
        </footer>
      </div>
    </div>
  )
}
