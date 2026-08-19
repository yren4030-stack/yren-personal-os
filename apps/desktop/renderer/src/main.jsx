import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import defaultWovenLightUrl from './assets/backgrounds/default-woven-light.png'
import defaultWovenDarkUrl from './assets/backgrounds/default-woven-dark.png'
import './glass.css'
import './ui-foundation.css'
import { initializeFoundation, registerFoundationLifecycle } from './ui-foundation.mjs'

const root = document.documentElement
root.style.setProperty('--ui-window-background-light', `url("${defaultWovenLightUrl}")`)
root.style.setProperty('--ui-window-background-dark', `url("${defaultWovenDarkUrl}")`)

const disposeFoundation = initializeFoundation()
registerFoundationLifecycle({
  dispose: disposeFoundation,
  windowObject: typeof window !== 'undefined' ? window : null,
  hot: import.meta.hot,
})

createRoot(document.getElementById('root')).render(<App />)
