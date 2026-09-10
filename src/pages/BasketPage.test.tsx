import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BasketPage } from './BasketPage'
import { ShopProvider, type BasketLine } from '../state/ShopContext'
import { DemoClockProvider } from '../state/DemoClockContext'

const THURSDAY = new Date(Date.UTC(2026, 8, 10, 12, 0, 0))

const renderBasket = (
  productIds: string[],
  postcode: string | null = '50667',
  now: Date = THURSDAY,
) => {
  const basket: BasketLine[] = productIds.map((productId) => ({ productId, quantity: 1 }))
  return render(
    <DemoClockProvider now={now}>
      <ShopProvider initialPostcode={postcode} initialBasket={basket}>
        <MemoryRouter initialEntries={['/basket']}>
          <BasketPage />
        </MemoryRouter>
      </ShopProvider>
    </DemoClockProvider>,
  )
}

describe('basket delivery promise', () => {
  it('shows one overall promise for a single-shipment basket', () => {
    renderBasket(['voltaren', 'vitamin-d3'])
    expect(screen.getByText(/Voraussichtliche Lieferung/)).toBeInTheDocument()
    expect(screen.queryByText(/kommt in 2 Lieferungen/)).not.toBeInTheDocument()
  })

  it('hides the split when both shipments arrive in the same window', () => {
    // Berlin: the two shipments round to identical windows, so the backend
    // having two fulfilment groups is not by itself worth the complexity.
    renderBasket(['voltaren', 'bepanthen'], '10115')
    expect(screen.queryByText(/kommt in 2 Lieferungen/)).not.toBeInTheDocument()
    expect(screen.getByText(/Voraussichtliche Lieferung/)).toBeInTheDocument()
  })

  it('reveals the split when one shipment arrives materially earlier', () => {
    // Köln: the main shipment lands a delivery day before the external one.
    renderBasket(['voltaren', 'bepanthen'], '50667')
    expect(screen.getByText(/kommt in 2 Lieferungen/)).toBeInTheDocument()
    expect(screen.getByText('Lieferung 1 von 2')).toBeInTheDocument()
    expect(screen.getByText('Lieferung 2 von 2')).toBeInTheDocument()
  })

  it('shows product names and thumbnails on a material split', () => {
    const { container } = renderBasket(['voltaren', 'bepanthen'], '50667')
    const split = container.querySelector('.basket-split')!
    expect(split.textContent).toMatch(/Voltaren/)
    expect(split.textContent).toMatch(/Bepanthen/)
    expect(split.querySelectorAll('img').length).toBe(2)
  })

  it('never shows carrier choice in the basket', () => {
    renderBasket(['voltaren', 'bepanthen'], '50667')
    expect(screen.queryByText(/DHL/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/HERMES/i)).not.toBeInTheDocument()
  })

  it('never repeats price or quantity controls inside the split block', () => {
    const { container } = renderBasket(['voltaren', 'bepanthen'], '50667')
    const split = container.querySelector('.basket-split')!
    expect(split.querySelectorAll('select').length).toBe(0)
    expect(split.textContent).not.toMatch(/€/)
  })

  it('never shows fulfilment internals', () => {
    const { container } = renderBasket(['voltaren', 'bepanthen'], '50667')
    const html = container.innerHTML.toLowerCase()
    for (const term of ['sevenum', 'warehouse', 'lager', 'fulfilment', 'external-demo']) {
      expect(html).not.toContain(term)
    }
  })

  it('adds no urgency copy beyond the factual cutoff', () => {
    const { container } = renderBasket(['voltaren', 'bepanthen'], '50667')
    const html = container.innerHTML.toLowerCase()
    for (const term of ['nur noch', 'beeilen', 'schnell sein', 'letzte chance']) {
      expect(html).not.toContain(term)
    }
  })

  it('keeps the broad promise when no postcode is known', () => {
    renderBasket(['voltaren'], null)
    expect(screen.getByText('Lieferung in 1–3 Werktagen')).toBeInTheDocument()
  })

  it('shows the basket rows with names and availability', () => {
    renderBasket(['voltaren'])
    expect(screen.getByText(/Voltaren Schmerzgel forte/)).toBeInTheDocument()
    expect(screen.getByText('Verfügbar')).toBeInTheDocument()
  })

  it('renders an empty basket without breaking', () => {
    renderBasket([])
    expect(screen.getByText(/Warenkorb ist leer/)).toBeInTheDocument()
  })
})
