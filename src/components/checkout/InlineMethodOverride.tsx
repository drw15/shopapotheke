import { useState } from 'react'
import type { Destination } from '../../domain/checkout/types'
import { DEMO_ADDRESS } from '../../state/CheckoutContext'
import { PickupStationModal } from './PickupStationModal'

/**
 * Per-shipment `Lieferart ändern`.
 *
 * Reuses the same first-level hierarchy as the order-level choice - home or
 * pickup, then the station picker - scoped to one shipment. Changing this
 * shipment must never affect the other.
 *
 * PROTOTYPE ASSUMPTION: whether Redcare's OMS can accept different
 * destinations per parcel is unknown. If it cannot, the same design collapses
 * to one order-level destination without changing the promise architecture.
 */
export function InlineMethodOverride({
  shipmentId,
  currentMethod,
  postcode,
  onSelect,
  onClose,
}: {
  shipmentId: string
  currentMethod: 'home' | 'pickup'
  postcode: string | null
  onSelect: (destination: Destination) => void
  onClose: () => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div className="method-override">
      <p className="method-override__title">Lieferart für diese Lieferung ändern</p>

      <label className="method-override__option">
        <input
          type="radio"
          className="sa-radio"
          name={`override-${shipmentId}`}
          checked={currentMethod === 'home'}
          onChange={() => {
            onSelect({ method: 'home', address: { ...DEMO_ADDRESS, postcode: postcode ?? DEMO_ADDRESS.postcode } })
            onClose()
          }}
        />
        An eine Lieferadresse
      </label>

      <label className="method-override__option">
        <input
          type="radio"
          className="sa-radio"
          name={`override-${shipmentId}`}
          checked={currentMethod === 'pickup'}
          onChange={() => setPickerOpen(true)}
        />
        An einen Abholort
      </label>

      {currentMethod === 'pickup' && (
        <button
          type="button"
          className="method-override__pick"
          onClick={() => setPickerOpen(true)}
        >
          Anderen Abholort wählen
        </button>
      )}

      {pickerOpen && (
        <PickupStationModal
          postcode={postcode}
          onSelect={(location) => {
            onSelect({ method: 'pickup', location })
            setPickerOpen(false)
            onClose()
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}
