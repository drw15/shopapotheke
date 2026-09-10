import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from './App'
import { ShopProvider } from '../state/ShopContext'
import { CheckoutProvider } from '../state/CheckoutContext'
import { OrderProvider } from '../state/OrderContext'
import { DemoClockProvider } from '../state/DemoClockContext'

const renderAt = (path: string) =>
  render(
    <DemoClockProvider now={new Date('2026-09-10T12:00:00Z')}>
      <ShopProvider initialPostcode="22083">
        <CheckoutProvider>
          <OrderProvider>
            <MemoryRouter initialEntries={[path]}>
              <AppRoutes />
            </MemoryRouter>
          </OrderProvider>
        </CheckoutProvider>
      </ShopProvider>
    </DemoClockProvider>,
  )

describe('app shell', () => {
  it('keeps retail and checkout headers separate', () => {
    const { unmount } = renderAt('/product/voltaren')
    expect(screen.getByText('Kategorien')).toBeInTheDocument()
    unmount()

    renderAt('/checkout/address')
    expect(screen.getByText('Adresse')).toBeInTheDocument()
    expect(screen.queryByText('Kategorien')).not.toBeInTheDocument()
  })

  it('shows the full checkout stepper on checkout routes', () => {
    renderAt('/checkout/shipping')
    for (const label of ['Adresse', 'Versand', 'Zahlung', 'Prüfen']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('marks the current checkout step', () => {
    renderAt('/checkout/shipping')
    expect(screen.getByText('Versand').closest('span')).toHaveAttribute('aria-current', 'step')
  })

  it('routes the whole prototype journey', () => {
    for (const path of [
      '/basket',
      '/checkout/payment',
      '/checkout/review',
      '/confirmation/100421',
      '/orders',
      '/orders/100422',
      '/email-preview/100422',
    ]) {
      const { container, unmount } = renderAt(path)
      // Every route renders real content rather than falling through to blank.
      expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(20)
      unmount()
    }
  })

  it('renders the delayed order tracking and its email preview', () => {
    const { unmount } = renderAt('/orders/100422')
    expect(screen.getByText('Ihre Lieferung verspätet sich')).toBeInTheDocument()
    unmount()

    renderAt('/email-preview/100422')
    expect(screen.getByText(/Neuer Liefertermin/)).toBeInTheDocument()
  })
})
