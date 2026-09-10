import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { CheckoutAddressPage } from './CheckoutAddressPage'
import { ShopProvider } from '../state/ShopContext'
import { CheckoutProvider } from '../state/CheckoutContext'
import { DemoClockProvider } from '../state/DemoClockContext'

const THURSDAY = new Date(Date.UTC(2026, 8, 10, 12, 0, 0))

const renderPage = (postcode = '22083') =>
  render(
    <DemoClockProvider now={THURSDAY}>
      <ShopProvider initialPostcode={postcode} initialBasket={[{ productId: 'voltaren', quantity: 1 }]}>
        <CheckoutProvider>
          <MemoryRouter initialEntries={['/checkout/address']}>
            <CheckoutAddressPage />
          </MemoryRouter>
        </CheckoutProvider>
      </ShopProvider>
    </DemoClockProvider>,
  )

describe('checkout destination', () => {
  it('offers home and pickup as the two first-level choices', () => {
    renderPage()
    expect(screen.getByText('An eine Lieferadresse')).toBeInTheDocument()
    expect(screen.getByText('An einen Abholort')).toBeInTheDocument()
  })

  it('does not flatten carrier and destination into one peer list', () => {
    renderPage()
    // A flat list would offer these as first-level radio options.
    expect(screen.queryByText(/DHL nach Hause/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Hermes PaketShop/i)).not.toBeInTheDocument()
  })

  it('uses generic fixture data rather than the reference personal data', () => {
    renderPage()
    expect(screen.getByText('Max Mustermann')).toBeInTheDocument()
    expect(screen.getByText(/Musterstraße/)).toBeInTheDocument()
  })

  it('opens the pickup station picker', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByText(/Holen Sie Ihre Bestellung/))
    await user.click(screen.getByRole('button', { name: /Wählen Sie einen Abholort/ }))
    expect(screen.getByRole('dialog', { name: 'Abholstation finden' })).toBeInTheDocument()
  })

  it('lists only DHL and Hermes pickup locations', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByText(/Holen Sie Ihre Bestellung/))
    await user.click(screen.getByRole('button', { name: /Wählen Sie einen Abholort/ }))
    const dialog = screen.getByRole('dialog')
    expect(dialog.textContent).not.toMatch(/DPD|GLS|UPS/i)
  })

  it('stores the chosen station as the order destination', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByText(/Holen Sie Ihre Bestellung/))
    await user.click(screen.getByRole('button', { name: /Wählen Sie einen Abholort/ }))
    await user.click(screen.getByRole('button', { name: 'Abholstation übernehmen' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    // The Hamburg fixture's nearest location.
    expect(screen.getByText('Waescherei Kinne')).toBeInTheDocument()
  })

  it('shows a station list for each supported postcode', async () => {
    const user = userEvent.setup()
    renderPage('50667')

    await user.click(screen.getByText(/Holen Sie Ihre Bestellung/))
    await user.click(screen.getByRole('button', { name: /Wählen Sie einen Abholort/ }))
    expect(screen.getByText('Kiosk am Dom')).toBeInTheDocument()
  })

  it('handles a postcode with no pickup locations without breaking', async () => {
    const user = userEvent.setup()
    renderPage('99999')

    await user.click(screen.getByText(/Holen Sie Ihre Bestellung/))
    await user.click(screen.getByRole('button', { name: /Wählen Sie einen Abholort/ }))
    expect(screen.getByText(/keine Abholorte hinterlegt/)).toBeInTheDocument()
  })

  it('never shows PUDO steering or cost copy', () => {
    const { container } = renderPage()
    const html = container.innerHTML.toLowerCase()
    for (const term of ['empfohlen', 'recommended', 'best option', 'günstiger für uns', 'sparen sie']) {
      expect(html).not.toContain(term)
    }
  })
})
