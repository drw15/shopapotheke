import { Navigate, Route, Routes } from 'react-router-dom'
import { PlaceholderPage } from '../pages/PlaceholderPage'
import { ProductPage } from '../pages/ProductPage'
import { BasketPage } from '../pages/BasketPage'
import { CheckoutHeader } from '../components/layout/CheckoutHeader'

function CheckoutPlaceholder({
  step,
  title,
}: {
  step: 'address' | 'shipping' | 'payment' | 'review'
  title: string
}) {
  return (
    <>
      <CheckoutHeader activeStep={step} />
      <main className="checkout-width" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <h1>{title}</h1>
      </main>
    </>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/product/voltaren" replace />} />
      <Route path="/product/:productId" element={<ProductPage />} />
      <Route path="/basket" element={<BasketPage />} />

      <Route
        path="/checkout/address"
        element={<CheckoutPlaceholder step="address" title="Ihre Rechnungsadresse" />}
      />
      <Route
        path="/checkout/shipping"
        element={<CheckoutPlaceholder step="shipping" title="Bitte wählen Sie eine Versandoption" />}
      />
      <Route
        path="/checkout/payment"
        element={<CheckoutPlaceholder step="payment" title="Zahlungsart" />}
      />
      <Route
        path="/checkout/review"
        element={<CheckoutPlaceholder step="review" title="Bestellung prüfen" />}
      />

      <Route path="/confirmation/:orderId" element={<PlaceholderPage title="Bestellbestätigung" />} />
      <Route path="/orders" element={<PlaceholderPage title="Meine Bestellungen" />} />
      <Route path="/orders/:orderId" element={<PlaceholderPage title="Sendungsverfolgung" />} />
      <Route path="/email-preview/:orderId" element={<PlaceholderPage title="E-Mail-Vorschau" />} />
    </Routes>
  )
}
