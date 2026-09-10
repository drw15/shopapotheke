import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from './App'
import { ShopProvider } from '../state/ShopContext'
import { DemoClockProvider } from '../state/DemoClockContext'

const renderAt = (path: string) =>
  render(
    <DemoClockProvider now={new Date('2026-09-10T12:00:00Z')}>
      <ShopProvider>
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
        </MemoryRouter>
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
      const { unmount } = renderAt(path)
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      unmount()
    }
  })
})
