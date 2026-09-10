import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { CheckoutShippingPage } from './CheckoutShippingPage'
import { ShopProvider, type BasketLine } from '../state/ShopContext'
import { CheckoutProvider } from '../state/CheckoutContext'
import { DemoClockProvider } from '../state/DemoClockContext'

const THURSDAY = new Date(Date.UTC(2026, 8, 10, 12, 0, 0))

const renderShipping = (productIds: string[], postcode = '22083') => {
  const basket: BasketLine[] = productIds.map((productId) => ({ productId, quantity: 1 }))
  return render(
    <DemoClockProvider now={THURSDAY}>
      <ShopProvider initialPostcode={postcode} initialBasket={basket}>
        <CheckoutProvider>
          <MemoryRouter initialEntries={['/checkout/shipping']}>
            <CheckoutShippingPage />
          </MemoryRouter>
        </CheckoutProvider>
      </ShopProvider>
    </DemoClockProvider>,
  )
}

describe('checkout shipping step', () => {
  it('shows one shipping block for a single shipment', () => {
    const { container } = renderShipping(['voltaren', 'vitamin-d3'])
    expect(container.querySelectorAll('.shipping-block')).toHaveLength(1)
    expect(screen.queryByText(/kommt in 2 Lieferungen/)).not.toBeInTheDocument()
  })

  it('offers DHL and Hermes with their own Lieferzeitraum', () => {
    renderShipping(['voltaren'])
    expect(screen.getByText('Standard mit DHL')).toBeInTheDocument()
    expect(screen.getByText('Standard mit HERMES')).toBeInTheDocument()
    expect(screen.getAllByText(/Lieferzeitraum:/).length).toBe(2)
  })

  it('never offers a carrier outside the reference checkout', () => {
    const { container } = renderShipping(['voltaren'])
    expect(container.innerHTML).not.toMatch(/DPD|GLS|UPS/i)
  })

  it('shows both shipment blocks on the same step for a split order', () => {
    const { container } = renderShipping(['voltaren', 'bepanthen'])
    expect(container.querySelectorAll('.shipping-block')).toHaveLength(2)
    expect(screen.getByText(/kommt in 2 Lieferungen/)).toBeInTheDocument()
    expect(screen.getByText('Lieferung 1 von 2')).toBeInTheDocument()
    expect(screen.getByText('Lieferung 2 von 2')).toBeInTheDocument()
  })

  it('uses thumbnails and an item count rather than product names', () => {
    const { container } = renderShipping(['voltaren', 'bepanthen'])
    const header = container.querySelector('.shipment-header')!
    expect(header.textContent).toMatch(/1 Artikel/)
    expect(header.textContent).not.toMatch(/Voltaren/)
    expect(header.querySelectorAll('img').length).toBeGreaterThan(0)
  })

  it('inherits the same destination for both shipments by default', () => {
    const { container } = renderShipping(['voltaren', 'bepanthen'])
    const headers = container.querySelectorAll('.shipment-header__destination')
    expect(headers).toHaveLength(2)
    expect(headers[0].textContent).toMatch(/Musterstraße/)
    expect(headers[1].textContent).toMatch(/Musterstraße/)
  })

  it('changes only the targeted shipment when one is switched to pickup', async () => {
    const user = userEvent.setup()
    const { container } = renderShipping(['voltaren', 'bepanthen'])

    const blocks = container.querySelectorAll('.shipping-block')
    await user.click(within(blocks[0] as HTMLElement).getByRole('button', { name: 'Lieferart ändern' }))
    await user.click(screen.getByLabelText('An einen Abholort'))
    await user.click(screen.getByRole('button', { name: 'Abholstation übernehmen' }))

    const headers = container.querySelectorAll('.shipment-header__destination')
    expect(headers[0].textContent).toMatch(/Waescherei Kinne/)
    // Shipment 2 is untouched by the change to shipment 1.
    expect(headers[1].textContent).toMatch(/Musterstraße/)
  })

  it('shows a visible carrier difference where the model produces one', () => {
    renderShipping(['fenistil'], '10115')
    const promises = screen.getAllByText(/Lieferzeitraum:/).map((node) => node.textContent)
    expect(promises[0]).not.toBe(promises[1])
  })

  it('shows the same window for both carriers where rounding absorbs it', () => {
    renderShipping(['voltaren'], '22083')
    const promises = screen.getAllByText(/Lieferzeitraum:/).map((node) => node.textContent)
    expect(promises[0]).toBe(promises[1])
  })

  it('never shows PUDO steering, recommendations or raw model fields', () => {
    const { container } = renderShipping(['voltaren', 'bepanthen'])
    const html = container.innerHTML.toLowerCase()
    for (const term of [
      'empfohlen',
      'recommended',
      'best option',
      'sparen',
      'q10',
      'q90',
      'confidence',
      'calibration',
      'sevenum',
    ]) {
      expect(html).not.toContain(term)
    }
  })
})
