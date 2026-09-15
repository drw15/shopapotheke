import { useState } from 'react'
import type { Address } from '../../domain/checkout/types'

/**
 * Enter a different delivery address during checkout.
 *
 * The postcode is the field that matters to this prototype: it drives the
 * prediction and the pickup-station lookup. The other fields exist so the form
 * is an address form rather than a postcode prompt wearing one's label.
 *
 * Supported demo postcodes are listed inline, because an unsupported one is a
 * legitimate state here (it falls back to the broad promise) and a reviewer
 * should be able to reach both deliberately.
 */
export function NewAddressForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Address
  onSave: (address: Address) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<Address>(initial)

  const set = (field: keyof Address) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setDraft((current) => ({ ...current, [field]: event.target.value }))

  const complete =
    draft.name.trim() !== '' &&
    draft.street.trim() !== '' &&
    draft.postcode.trim() !== '' &&
    draft.city.trim() !== ''

  return (
    <form
      className="sa-card new-address-form"
      onSubmit={(event) => {
        event.preventDefault()
        if (complete) onSave(draft)
      }}
    >
      <h3 className="new-address-form__title">Neue Lieferadresse</h3>

      <label className="new-address-form__field">
        Name
        <input value={draft.name} onChange={set('name')} autoComplete="name" />
      </label>

      <div className="new-address-form__row">
        <label className="new-address-form__field new-address-form__field--grow">
          Straße
          <input value={draft.street} onChange={set('street')} autoComplete="address-line1" />
        </label>

        <label className="new-address-form__field new-address-form__field--narrow">
          Nr.
          <input value={draft.houseNumber} onChange={set('houseNumber')} />
        </label>
      </div>

      <div className="new-address-form__row">
        <label className="new-address-form__field new-address-form__field--narrow">
          Postleitzahl
          <input
            value={draft.postcode}
            onChange={set('postcode')}
            inputMode="numeric"
            maxLength={5}
            autoComplete="postal-code"
          />
        </label>

        <label className="new-address-form__field new-address-form__field--grow">
          Ort
          <input value={draft.city} onChange={set('city')} autoComplete="address-level2" />
        </label>
      </div>

      <p className="sa-muted new-address-form__hint">
        Modellierte Postleitzahlen: 50667, 60311, 22083, 10115, 80331. Andere Postleitzahlen
        erhalten die allgemeine Lieferzusage.
      </p>

      <div className="new-address-form__actions">
        <button type="submit" className="sa-cta" disabled={!complete}>
          Adresse übernehmen
        </button>
        <button type="button" className="new-address-form__cancel" onClick={onCancel}>
          Abbrechen
        </button>
      </div>
    </form>
  )
}
