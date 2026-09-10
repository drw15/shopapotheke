import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProductPage } from './ProductPage'
import { ShopProvider } from '../state/ShopContext'
import { DemoClockProvider } from '../state/DemoClockContext'

/** Thursday 2026-09-10, 14:00 Berlin. */
const THURSDAY = new Date(Date.UTC(2026, 8, 10, 12, 0, 0))

const renderProduct = (productId: string, postcode: string | null = null, now: Date = THURSDAY) =>
  render(
    <DemoClockProvider now={now}>
      <ShopProvider initialPostcode={postcode}>
        <MemoryRouter initialEntries={[`/product/${productId}`]}>
          <Routes>
            <Route path="/product/:productId" element={<ProductPage />} />
            <Route path="/basket" element={<div>Warenkorb</div>} />
          </Routes>
        </MemoryRouter>
      </ShopProvider>
    </DemoClockProvider>,
  )

describe('PDP delivery promise', () => {
  it('shows the existing broad promise before a postcode is known', () => {
    renderProduct('voltaren')
    expect(screen.getByText('Lieferung in 1–3 Werktagen')).toBeInTheDocument()
    expect(screen.getByText('Ihre PLZ')).toBeInTheDocument()
  })

  it('shows a precise calendar window once a supported postcode is known', () => {
    renderProduct('voltaren', '50667')
    expect(
      screen.getByText(/Voraussichtliche Lieferung: Fr\., 11\. – Mo\., 14\. September/),
    ).toBeInTheDocument()
    expect(screen.queryByText('Lieferung in 1–3 Werktagen')).not.toBeInTheDocument()
  })

  it('keeps the broad promise when the prediction is not safe to expose', () => {
    // Ibu + München is the documented low-support lane.
    renderProduct('ibu', '80331')
    expect(screen.getByText('Lieferung in 1–3 Werktagen')).toBeInTheDocument()
  })

  it('keeps the broad promise for a product outside the model scope', () => {
    renderProduct('vagisan', '50667')
    expect(screen.getByText('Lieferung in 1–3 Werktagen')).toBeInTheDocument()
  })

  it('falls back for an unsupported postcode without breaking the page', () => {
    renderProduct('voltaren', '99999')
    expect(screen.getByText('Lieferung in 1–3 Werktagen')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /In den Warenkorb/ })).toBeEnabled()
  })

  it('widens to the broad promise when only one standard carrier is safe', () => {
    // Fenistil + München: DHL is safe, Hermes fails the confidence gate, so the
    // upper funnel must not advertise the safe carrier.
    renderProduct('fenistil', '80331')
    expect(screen.getByText('Lieferung in 1–3 Werktagen')).toBeInTheDocument()
  })

  it('shows the cutoff hint when crossing it changes the promise', () => {
    renderProduct('voltaren', '50667', new Date(Date.UTC(2026, 8, 10, 16, 30)))
    expect(screen.getByText('Bei Bestellung bis 19:00')).toBeInTheDocument()
  })

  it('hides the cutoff hint once the cutoff has passed', () => {
    renderProduct('voltaren', '50667', new Date(Date.UTC(2026, 8, 10, 17, 30)))
    expect(screen.queryByText('Bei Bestellung bis 19:00')).not.toBeInTheDocument()
  })

  it('recalculates silently when the postcode changes', async () => {
    const user = userEvent.setup()
    renderProduct('voltaren', '50667')

    await user.click(screen.getByRole('button', { name: /50667/ }))
    const field = screen.getByLabelText('Postleitzahl')
    await user.clear(field)
    await user.type(field, '80331')
    await user.click(screen.getByRole('button', { name: 'OK' }))

    // The estimate simply changes: no update notice, no explanation.
    expect(screen.queryByText(/aktualisiert/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Voraussichtliche Lieferung/)).toBeInTheDocument()
  })

  it('never renders raw model metadata', () => {
    const { container } = renderProduct('voltaren', '50667')
    const html = container.innerHTML
    for (const term of [
      'q10',
      'q90',
      'confidence',
      'calibration',
      'support',
      'Sevenum',
      'safe_to_expose',
    ]) {
      expect(html.toLowerCase()).not.toContain(term.toLowerCase())
    }
  })

  it('keeps NOW! visible but outside the prediction promise', () => {
    renderProduct('voltaren', '50667')
    expect(screen.getByText(/Now!/)).toBeInTheDocument()
    // NOW! must not be presented as the standard delivery promise.
    expect(screen.getByText(/Voraussichtliche Lieferung/)).toBeInTheDocument()
  })
})
