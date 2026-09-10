import type { CustomerPromise } from '../../domain/promise/types'
import type { Provider } from '../../domain/types'

/**
 * One carrier option row.
 *
 * Matches the reference: label, green `Lieferzeitraum` line, price on the
 * right, red radio on the left.
 *
 * The row states the predicted window and nothing else. There is no
 * recommendation, no "fastest" badge and no cost rationale - the customer sees
 * the service difference and decides for themselves.
 */
export function CarrierOptionRow({
  provider,
  label,
  promise,
  checked,
  onSelect,
  name,
}: {
  provider: Provider
  label: string
  promise: CustomerPromise
  checked: boolean
  onSelect: () => void
  name: string
}) {
  return (
    <label className="carrier-option">
      <input
        type="radio"
        className="sa-radio"
        name={name}
        checked={checked}
        onChange={onSelect}
        aria-label={label}
      />

      <span className="carrier-option__body">
        <strong className="carrier-option__label">{label}</strong>
        <span className="sa-delivery-text carrier-option__promise">
          {promise.kind === 'precise' ? `Lieferzeitraum: ${promise.label}` : promise.label}
        </span>
        {promise.cutoffText && (
          <span className="carrier-option__cutoff">{promise.cutoffText}</span>
        )}
      </span>

      <span className="carrier-option__price" data-provider={provider}>
        € 0,00
      </span>
    </label>
  )
}
