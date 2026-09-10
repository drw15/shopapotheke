import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './app/App'
import { ShopProvider } from './state/ShopContext'
import { DemoClockProvider } from './state/DemoClockContext'
import './styles/global.css'
import './styles/layout.css'
import './styles/product.css'
import './styles/basket.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DemoClockProvider>
      <ShopProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ShopProvider>
    </DemoClockProvider>
  </StrictMode>,
)
