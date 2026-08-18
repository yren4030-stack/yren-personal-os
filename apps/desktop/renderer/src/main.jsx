import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './glass.css'
import './ui-foundation.css'
import { initializeFoundation } from './ui-foundation.mjs'

initializeFoundation()

createRoot(document.getElementById('root')).render(<App />)
