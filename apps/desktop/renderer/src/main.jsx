import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './glass.css'
import './ui-foundation.css'
import { initializeFoundation, registerFoundationLifecycle } from './ui-foundation.mjs'

const disposeFoundation = initializeFoundation()
registerFoundationLifecycle({
  dispose: disposeFoundation,
  windowObject: typeof window !== 'undefined' ? window : null,
  hot: import.meta.hot,
})

createRoot(document.getElementById('root')).render(<App />)
