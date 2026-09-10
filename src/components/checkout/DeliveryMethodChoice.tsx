import type { Address, Destination, PickupLocation } from '../../domain/checkout/types'

/**
 * The first-level delivery decision: where the order should go.
 *
 * `An eine Lieferadresse` and `An einen Abholort` are the two top-level
 * options, exactly as on the current site. The provider choice belongs to a
 * later step and must not be flattened into this list - a flat list of
 * "DHL nach Hause / Hermes PaketShop" would redesign the checkout rather than
 * extend it.
 */
export function DeliveryMethodChoice({
  destination,
  address,
  savedPickup,
  pickupSelected = false,
  onChooseHome,
  onSelectPickup,
  onOpenPickupPicker,
  onChooseSavedPickup,
  idPrefix = 'order',
}: {
  destination: Destination
  address: Address
  savedPickup?: PickupLocation | null
  /** Pickup is chosen as the method but no station has been picked yet. */
  pickupSelected?: boolean
  onChooseHome: () => void
  onSelectPickup: () => void
  onOpenPickupPicker: () => void
  onChooseSavedPickup?: (location: PickupLocation) => void
  idPrefix?: string
}) {
  const isHome = destination.method === 'home' && !pickupSelected

  return (
    <div className="method-choice">
      <h3 className="method-choice__heading">
        <HomeIcon />
        An eine Lieferadresse
      </h3>

      <label className={isHome ? 'method-card method-card--selected' : 'method-card'}>
        <input
          type="radio"
          className="sa-radio"
          name={`${idPrefix}-method`}
          checked={isHome}
          onChange={onChooseHome}
        />
        <span className="method-card__body">
          <strong>{address.name}</strong>
          <span>
            {address.street} {address.houseNumber}
          </span>
          <span>
            {address.postcode} {address.city}
          </span>
        </span>
      </label>

      <h3 className="method-choice__heading">
        <PickupIcon />
        An einen Abholort
      </h3>

      <label className={!isHome ? 'method-card method-card--selected' : 'method-card'}>
        <input
          type="radio"
          className="sa-radio"
          name={`${idPrefix}-method`}
          checked={!isHome}
          onChange={onSelectPickup}
        />
        <span className="method-card__body">
          <span>
            Holen Sie Ihre Bestellung an einer Packstation, in einem Paketshop oder kostenlos in
            einer unserer Partnerapotheken ab!
          </span>
          {!isHome && destination.method === 'pickup' && (
            <span className="method-card__selected-station">
              <strong>{destination.location.name}</strong>
              <span className="sa-muted">
                {destination.location.street}, {destination.location.postcode}{' '}
                {destination.location.city}
              </span>
            </span>
          )}
          <button
            type="button"
            className="sa-cta method-card__pickup-cta"
            onClick={(event) => {
              event.preventDefault()
              onOpenPickupPicker()
            }}
          >
            {destination.method === 'pickup' ? 'Anderen Abholort wählen' : 'Wählen Sie einen Abholort'}
          </button>
        </span>
      </label>

      {savedPickup && onChooseSavedPickup && (
        <label className="method-card method-card--saved">
          <input
            type="radio"
            className="sa-radio"
            name={`${idPrefix}-method`}
            checked={destination.method === 'pickup' && destination.location.id === savedPickup.id}
            onChange={() => onChooseSavedPickup(savedPickup)}
          />
          <span className="method-card__body">
            <strong>{savedPickup.name}</strong>
            <span>{savedPickup.street}</span>
            <span>
              {savedPickup.postcode} {savedPickup.city}
            </span>
          </span>
        </label>
      )}
    </div>
  )
}

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PickupIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.7" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.7" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.7" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}
