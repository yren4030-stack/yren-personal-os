import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './glass.css'
import './ui-foundation.css'
import { initializeFoundation } from './ui-foundation.mjs'

const disposeFoundation = initializeFoundation()
if (typeof window !== 'undefined') {
  window.addEventListener('unload', disposeFoundation, { once: true })
}
if (import.meta.hot) {
  import.meta.hot.dispose(disposeFoundation)
}

createRoot(document.getElementById('root')).render(<App />)
