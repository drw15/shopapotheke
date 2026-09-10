import { Link } from 'react-router-dom'
import { StoreHeader } from '../components/layout/StoreHeader'
import { buildDemoOrders } from '../data/demoOrders'
import { getShipmentTrackingState } from '../domain/tracking/trackingState'
import { requireProduct } from '../data/products'
import { useOrders } from '../state/OrderContext'
import { useNow } from '../state/DemoClockContext'
import type { Order } from '../domain/order/types'

export function OrdersPage() {
  const now = useNow()
  const { placedOrders } = useOrders()
  const orders = [...placedOrders, ...buildDemoOrders(now)]

  return (
    <>
      <StoreHeader />

      <main className="retail-width orders-page">
        <h1 className="orders-page__title">Meine Bestellungen</h1>

        <div className="orders-page__list">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </main>
    </>
  )
}

function OrderCard({ order }: { order: Order }) {
  const states = order.shipments.map((shipment) => getShipmentTrackingState(shipment))
  const anyDelayed = states.some((state) => state.isDelayed)
  const allDelivered = states.every((state) => state.isDelivered)

  return (
    <article className="sa-card order-card">
      <div className="order-card__head">
        <div>
          <strong>Bestellung {order.id}</strong>
          <span className="sa-muted order-card__shipments">
            {order.shipments.length === 1
              ? '1 Lieferung'
              : `${order.shipments.length} Lieferungen`}
          </span>
        </div>

        <span
          className={
            anyDelayed
              ? 'order-card__state order-card__state--delayed'
              : 'order-card__state'
          }
        >
          {anyDelayed ? 'Verspätet' : allDelivered ? 'Zugestellt' : 'Unterwegs'}
        </span>
      </div>

      <div className="order-card__thumbs">
        {order.shipments
          .flatMap((shipment) => shipment.productIds)
          .map((productId, index) => (
            <img
              key={`${productId}-${index}`}
              src={requireProduct(productId).image}
              alt=""
              width={38}
              height={38}
            />
          ))}
      </div>

      <Link to={`/orders/${order.id}`} className="order-card__link">
        Sendung verfolgen
      </Link>
    </article>
  )
}
