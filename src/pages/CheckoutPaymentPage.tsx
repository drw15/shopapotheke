import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckoutHeader } from '../components/layout/CheckoutHeader'
import { CheckoutTrustRow } from '../components/checkout/CheckoutTrustRow'

/**
 * Payment step, deliberately lightweight.
 *
 * Payment is not the focus of this case. The step exists so the journey stays
 * coherent with the existing Adresse / Versand / Zahlung / Prüfen stepper.
 * Nothing is processed.
 */
const METHODS = [
  { id: 'invoice', label: 'Rechnung' },
  { id: 'paypal', label: 'PayPal' },
  { id: 'card', label: 'Kreditkarte' },
  { id: 'sepa', label: 'Lastschrift' },
]

export function CheckoutPaymentPage() {
  const navigate = useNavigate()
  const [method, setMethod] = useState('invoice')

  return (
    <>
      <CheckoutHeader activeStep="payment" />

      <main className="checkout-width checkout-page">
        <h1 className="checkout-page__title">Wie möchten Sie bezahlen?</h1>

        <div className="checkout-page__columns">
          <div className="checkout-page__main">
            <div className="shipping-block">
              {METHODS.map((entry) => (
                <label key={entry.id} className="carrier-option">
                  <input
                    type="radio"
                    className="sa-radio"
                    name="payment"
                    checked={method === entry.id}
                    onChange={() => setMethod(entry.id)}
                  />
                  <span className="carrier-option__body">
                    <strong className="carrier-option__label">{entry.label}</strong>
                  </span>
                </label>
              ))}
            </div>

            <button
              type="button"
              className="sa-cta sa-cta--block checkout-page__continue"
              onClick={() => navigate('/checkout/review')}
            >
              Weiter zur Prüfung
            </button>
          </div>

          <aside className="checkout-page__aside" />
        </div>

        <CheckoutTrustRow />
      </main>
    </>
  )
}
