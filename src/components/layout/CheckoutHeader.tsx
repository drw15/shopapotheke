import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { ShopApothekeWordmark } from '../brand/ShopApothekeWordmark'

export type CheckoutStep = 'address' | 'shipping' | 'payment' | 'review'

const STEPS: Array<{ id: CheckoutStep; label: string }> = [
  { id: 'address', label: 'Adresse' },
  { id: 'shipping', label: 'Versand' },
  { id: 'payment', label: 'Zahlung' },
  { id: 'review', label: 'Prüfen' },
]

/**
 * Checkout header.
 *
 * Deliberately stripped down: wordmark plus the Adresse / Versand / Zahlung /
 * Prüfen stepper, with no category navigation, matching the checkout
 * references.
 */
export function CheckoutHeader({ activeStep }: { activeStep: CheckoutStep }) {
  return (
    <header className="checkout-header">
      <div className="checkout-width checkout-header__inner">
        <Link to="/product/voltaren" className="checkout-header__brand" aria-label="Zur Startseite">
          <ShopApothekeWordmark size={25} />
        </Link>

        <nav className="checkout-stepper" aria-label="Bestellschritte">
          {STEPS.map((step, index) => (
            <Fragment key={step.id}>
              {index > 0 && <span className="checkout-stepper__rule" aria-hidden="true" />}
              <span
                className={
                  step.id === activeStep
                    ? 'checkout-stepper__step checkout-stepper__step--active'
                    : 'checkout-stepper__step'
                }
                aria-current={step.id === activeStep ? 'step' : undefined}
              >
                <span className="checkout-stepper__marker">{index + 1}</span>
                {step.label}
              </span>
            </Fragment>
          ))}
        </nav>
      </div>
    </header>
  )
}
