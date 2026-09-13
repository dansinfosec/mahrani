import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'

import App from './App.jsx'
import { SiteProvider } from './site/SiteContext.jsx'
import { CartProvider } from './cart/CartContext.jsx'
import './styles/index.css'
import { setupMotionPreference } from './lib/motionPreference.js'

setupMotionPreference()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      {/* reducedMotion="user" disables transform/layout animation when the OS asks for it. */}
      <MotionConfig reducedMotion="user">
        <SiteProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </SiteProvider>
      </MotionConfig>
    </BrowserRouter>
  </StrictMode>,
)
