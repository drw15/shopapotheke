import { Link, useParams } from 'react-router-dom'
import { StoreHeader } from '../components/layout/StoreHeader'
import { findDemoOrder } from '../data/demoOrders'
import { getShipmentTrackingState } from '../domain/tracking/trackingState'
import { buildDelayEmail } from '../domain/notifications/delayEmail'
import { requireProduct } from '../data/products'
import { useOrders } from '../state/OrderContext'
import { useNow } from '../state/DemoClockContext'
import { PROMISE_POLICY } from '../config/promisePolicy'
import type { ConfirmedShipment } from '../domain/order/types'

const STEPS: Array<{ id: ConfirmedShipment['status']; label: string }> = [
  { id: 'confirmed', label: 'Bestellung bestätigt' },
  { id: 'preparing', label: 'Wird vorbereitet' },
  { id: 'in_transit', label: 'Unterwegs' },
  { id: 'delivered', label: 'Zugestellt' },
]

export function TrackingPage() {
  const { orderId } = useParams()
  const now = useNow()
  const { findOrder } = useOrders()

  const order = findOrder(orderId ?? '') ?? findDemoOrder(orderId ?? '', now)

  if (!order) {
    return (
      <>
        <StoreHeader />
        <main className="retail-width tracking-page">
          <h1>Bestellung nicht gefunden</h1>
          <Link to="/orders">Zu Ihren Bestellungen</Link>
        </main>
      </>
    )
  }

  const emailEligible = buildDelayEmail(order) !== null

  return (
    <>
      <StoreHeader />

      <main className="retail-width tracking-page">
        <h1 className="tracking-page__title">Bestellung {order.id}</h1>

        {order.shipments.map((shipment, index) => (
          <ShipmentTrackingCard
            key={shipment.id}
            shipment={shipment}
            index={index}
            total={order.shipments.length}
          />
        ))}

        {emailEligible && (
          <p className="tracking-page__email-note">
            <Link to={`/email-preview/${order.id}`}>
              Vorschau: proaktive Benachrichtigung an den Kunden
            </Link>
          </p>
        )}
      </main>
    </>
  )
}

function ShipmentTrackingCard({
  shipment,
  index,
  total,
}: {
  shipment: ConfirmedShipment
  index: number
  total: number
}) {
  const state = getShipmentTrackingState(shipment)
  const activeStep = STEPS.findIndex((step) => step.id === shipment.status)

  return (
    <section className="sa-card tracking-card">
      <header className="tracking-card__head">
        <h2>{total > 1 ? `Lieferung ${index + 1} von ${total}` : 'Ihre Lieferung'}</h2>
        <div className="tracking-card__thumbs">
          {shipment.productIds.map((productId) => (
            <img key={productId} src={requireProduct(productId).image} alt="" width={36} height={36} />
          ))}
        </div>
      </header>

      {state.isDelayed ? (
        /* The promise has been broken. Lead with that, give the new date, and
           keep the original promise visible rather than quietly replacing it. */
        <div className="tracking-delay">
          <strong className="tracking-delay__headline">{state.headline}</strong>
          <p className="tracking-delay__eta">
            Neuer Liefertermin: <strong>{state.currentEtaText}</strong>
          </p>
          <p className="sa-muted tracking-delay__original">
            Ursprünglich angekündigt: {state.originalPromiseText}
          </p>
        </div>
      ) : (
        <p className="sa-delivery-text tracking-card__eta">
          {state.isDelivered ? 'Zugestellt am ' : 'Voraussichtliche Lieferung: '}
          {shipment.confirmedPromiseMax ? state.currentEtaText : PROMISE_POLICY.fallbackLabel}
        </p>
      )}

      <p className="sa-muted tracking-card__destination">
        {shipment.method === 'home' ? 'Lieferung nach Hause' : 'Abholort'}:{' '}
        {shipment.destinationLabel}
      </p>

      <ol className="tracking-timeline">
        {STEPS.map((step, position) => (
          <li
            key={step.id}
            className={
              position <= activeStep
                ? 'tracking-timeline__step tracking-timeline__step--done'
                : 'tracking-timeline__step'
            }
          >
            <span className="tracking-timeline__dot" aria-hidden="true" />
            {step.label}
          </li>
        ))}
      </ol>
    </section>
  )
}
