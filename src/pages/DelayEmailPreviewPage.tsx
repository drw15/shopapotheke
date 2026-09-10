import { Link, useParams } from 'react-router-dom'
import { findDemoOrder } from '../data/demoOrders'
import { buildDelayEmail } from '../domain/notifications/delayEmail'
import { useOrders } from '../state/OrderContext'
import { useNow } from '../state/DemoClockContext'
import { ShopApothekeWordmark } from '../components/brand/ShopApothekeWordmark'

/**
 * Proactive delay email preview.
 *
 * No mail is sent. The content is derived from the same order state as
 * tracking, so the dates here cannot drift from the dates the customer sees on
 * the tracking page.
 */
export function DelayEmailPreviewPage() {
  const { orderId } = useParams()
  const now = useNow()
  const { findOrder } = useOrders()

  const order = findOrder(orderId ?? '') ?? findDemoOrder(orderId ?? '', now)
  const email = order ? buildDelayEmail(order) : null

  if (!order || !email) {
    return (
      <main className="email-preview">
        <p className="email-preview__note">
          Für diese Bestellung ist keine Verspätungsbenachrichtigung nötig.{' '}
          <Link to="/orders">Zu Ihren Bestellungen</Link>
        </p>
      </main>
    )
  }

  return (
    <main className="email-preview">
      <p className="email-preview__note">
        E-Mail-Vorschau — es wird keine E-Mail versendet. Dieselben Daten wie in der{' '}
        <Link to={`/orders/${order.id}`}>Sendungsverfolgung</Link>.
      </p>

      <article className="email">
        <header className="email__header">
          <ShopApothekeWordmark size={19} />
          <nav className="email__nav">
            <span>Kontakt</span>
            <span>Hilfe</span>
            <span>Meine Apotheke</span>
          </nav>
        </header>

        <div className="email__brand-block">
          <strong className="email__brand-title">{email.subject}</strong>
          <span className="email__brand-sub">zu Ihrer Bestellung {order.id}</span>
        </div>

        <div className="email__body">
          <p>{email.greeting}</p>
          <p>leider kommt Ihre Lieferung später als ursprünglich erwartet.</p>

          <p className="email__eta-label">Neuer Liefertermin</p>
          <p className="email__eta">{email.newEtaText}</p>

          <p className="email__original">
            Ursprünglich angekündigt: {email.originalPromiseText}
          </p>

          <p>
            Sie müssen nichts tun. Wir halten Sie über den weiteren Verlauf Ihrer Lieferung auf
            dem Laufenden.
          </p>

          <Link to={email.trackingHref} className="email__cta">
            Sendung verfolgen
          </Link>

          <p className="email__signoff">
            Ihr Team von Shop Apotheke
          </p>
        </div>

        <div className="email__support">
          <strong className="email__support-title">Haben Sie Fragen?</strong>
          <div className="email__support-grid">
            <span>
              030 3080 5600
              <br />
              Mo. - Sa. 8 - 20 Uhr
            </span>
            <span>
              kontakt@shop-apotheke.com
            </span>
          </div>
        </div>
      </article>
    </main>
  )
}
