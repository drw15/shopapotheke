import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './app/App'
import { ShopProvider } from './state/ShopContext'
import { CheckoutProvider } from './state/CheckoutContext'
import { OrderProvider } from './state/OrderContext'
import { DemoClockProvider } from './state/DemoClockContext'
import './styles/global.css'
import './styles/layout.css'
import './styles/product.css'
import './styles/basket.css'
import './styles/checkout.css'
import './styles/checkout-shipping.css'
import './styles/postpurchase.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DemoClockProvider>
      <ShopProvider>
        <CheckoutProvider>
          <OrderProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </OrderProvider>
        </CheckoutProvider>
      </ShopProvider>
    </DemoClockProvider>
  </StrictMode>,
)
