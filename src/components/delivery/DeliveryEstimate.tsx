import type { CustomerPromise } from '../../domain/promise/types'

/**
 * The delivery line.
 *
 * This replaces the existing delivery message rather than adding a new card:
 * when the prediction is safe the same line becomes a concrete date, and when
 * it is not it stays the broad promise the site already shows.
 *
 * The customer is never told which of the two they are looking at, or why.
 */
export function DeliveryEstimate({
  promise,
  prefix = 'Voraussichtliche Lieferung',
}: {
  promise: CustomerPromise
  prefix?: string
}) {
  if (promise.kind === 'fallback') {
    return (
      <span className="sa-delivery-text delivery-estimate__label">{promise.label}</span>
    )
  }

  return (
    <span className="delivery-estimate">
      <span className="sa-delivery-text delivery-estimate__label">
        {prefix}: {promise.label}
      </span>
      {promise.cutoffText && (
        <span className="delivery-estimate__cutoff">{promise.cutoffText}</span>
      )}
    </span>
  )
}
