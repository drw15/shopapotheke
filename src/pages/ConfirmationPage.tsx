import { Link, useParams } from 'react-router-dom'
import { StoreHeader } from '../components/layout/StoreHeader'
import { useOrders } from '../state/OrderContext'
import { requireProduct } from '../data/products'
import { toGermanPromiseLabel } from '../domain/calendar/businessCalendar'
import { PROMISE_POLICY } from '../config/promisePolicy'

const parseIso = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0, 0)
}

export function ConfirmationPage() {
  const { orderId } = useParams()
  const { findOrder } = useOrders()
  const order = findOrder(orderId ?? '')

  if (!order) {
    return (
      <>
        <StoreHeader />
        <main className="retail-width confirmation-page">
          <h1>Bestellung nicht gefunden</h1>
          <p className="sa-muted">
            Diese Bestellung gehört zu einer früheren Sitzung. <Link to="/orders">Zu Ihren Bestellungen</Link>
          </p>
        </main>
      </>
    )
  }

  return (
    <>
      <StoreHeader />

      <main className="retail-width confirmation-page">
        <div className="confirmation-hero">
          <span className="confirmation-hero__tick" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path
                d="m4 12.5 5 5L20 6.5"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div>
            <h1>Vielen Dank für Ihre Bestellung</h1>
            <p className="sa-muted">Bestellnummer {order.id}</p>
          </div>
        </div>

        {order.shipments.map((shipment, index) => (
          <section key={shipment.id} className="sa-card confirmation-shipment">
            <h2>
              {order.shipments.length > 1
                ? `Lieferung ${index + 1} von ${order.shipments.length}`
                : 'Ihre Lieferung'}
            </h2>

            <div className="confirmation-shipment__thumbs">
              {shipment.productIds.map((productId) => (
                <img key={productId} src={requireProduct(productId).image} alt="" width={40} height={40} />
              ))}
            </div>

            {/* The confirmed promise: from here on this date does not change. */}
            <p className="sa-delivery-text confirmation-shipment__promise">
              {shipment.confirmedPromiseMax
                ? `Zugesagte Lieferung: ${toGermanPromiseLabel(
                    parseIso(shipment.confirmedPromiseMin),
                    parseIso(shipment.confirmedPromiseMax),
                  )}`
                : PROMISE_POLICY.fallbackLabel}
            </p>

            <p className="sa-muted confirmation-shipment__destination">
              {shipment.method === 'home' ? 'Lieferung nach Hause' : 'Abholort'}:{' '}
              {shipment.destinationLabel}
            </p>
          </section>
        ))}

        <div className="confirmation-actions">
          <Link to={`/orders/${order.id}`} className="sa-cta">
            Sendung verfolgen
          </Link>
          <Link to="/orders" className="confirmation-actions__secondary">
            Zu Ihren Bestellungen
          </Link>
        </div>
      </main>
    </>
  )
}
