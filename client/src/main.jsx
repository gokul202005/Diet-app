import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { pwaManager } from './utils/pwaService.js'

// Register Progressive Web App Service Worker and Background Sync
if (typeof window !== 'undefined') {
  pwaManager.registerServiceWorker().catch(console.warn);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
)
