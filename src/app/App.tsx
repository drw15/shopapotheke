import { Navigate, Route, Routes } from 'react-router-dom'
import { ProductPage } from '../pages/ProductPage'
import { BasketPage } from '../pages/BasketPage'
import { CheckoutAddressPage } from '../pages/CheckoutAddressPage'
import { CheckoutShippingPage } from '../pages/CheckoutShippingPage'
import { CheckoutPaymentPage } from '../pages/CheckoutPaymentPage'
import { CheckoutReviewPage } from '../pages/CheckoutReviewPage'
import { ConfirmationPage } from '../pages/ConfirmationPage'
import { OrdersPage } from '../pages/OrdersPage'
import { TrackingPage } from '../pages/TrackingPage'
import { DelayEmailPreviewPage } from '../pages/DelayEmailPreviewPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/product/voltaren" replace />} />
      <Route path="/product/:productId" element={<ProductPage />} />
      <Route path="/basket" element={<BasketPage />} />

      <Route path="/checkout/address" element={<CheckoutAddressPage />} />
      <Route path="/checkout/shipping" element={<CheckoutShippingPage />} />
      <Route path="/checkout/payment" element={<CheckoutPaymentPage />} />
      <Route path="/checkout/review" element={<CheckoutReviewPage />} />

      <Route path="/confirmation/:orderId" element={<ConfirmationPage />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/orders/:orderId" element={<TrackingPage />} />
      <Route path="/email-preview/:orderId" element={<DelayEmailPreviewPage />} />
    </Routes>
  )
}
