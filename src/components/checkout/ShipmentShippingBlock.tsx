import type { ShipmentShippingView } from '../../domain/checkout/buildShippingView'
import type { Provider } from '../../domain/types'
import { CarrierOptionRow } from './CarrierOptionRow'
import { ShipmentHeader } from './ShipmentHeader'
import { InlineMethodOverride } from './InlineMethodOverride'
import type { Destination } from '../../domain/checkout/types'

/**
 * One shipping block.
 *
 * A single-shipment order renders this once and looks like the current
 * `Versand` step. A split order renders it twice on the same step - the same
 * existing pattern repeated, not a new split-order product.
 */
export function ShipmentShippingBlock({
  view,
  index,
  total,
  selectedProvider,
  onSelectProvider,
  overrideOpen,
  onToggleOverride,
  onOverrideDestination,
  postcode,
}: {
  view: ShipmentShippingView
  index: number
  total: number
  selectedProvider: Provider
  onSelectProvider: (provider: Provider) => void
  overrideOpen: boolean
  onToggleOverride: () => void
  onOverrideDestination: (destination: Destination) => void
  postcode: string | null
}) {
  const isSplit = total > 1

  return (
    <section className="shipping-block">
      {isSplit ? (
        <ShipmentHeader view={view} index={index} total={total} onChangeMethod={onToggleOverride} />
      ) : (
        <h2 className="shipping-block__title">
          <TruckIcon />
          {view.method === 'home' ? 'Lieferung nach Hause:' : 'Abholung:'}
        </h2>
      )}

      {overrideOpen && (
        <InlineMethodOverride
          shipmentId={view.shipmentId}
          currentMethod={view.method}
          postcode={postcode}
          onSelect={onOverrideDestination}
          onClose={onToggleOverride}
        />
      )}

      <div className="shipping-block__options">
        {view.options.map((option) => (
          <CarrierOptionRow
            key={option.provider}
            provider={option.provider}
            label={option.label}
            promise={option.promise}
            checked={selectedProvider === option.provider}
            onSelect={() => onSelectProvider(option.provider)}
            name={`provider-${view.shipmentId}`}
          />
        ))}
      </div>
    </section>
  )
}

function TruckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 7h10v9H3zM13 10h4l3 3v3h-7z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="18" r="1.8" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17" cy="18" r="1.8" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}
