import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/fraunces/full.css'
import '@fontsource-variable/nunito'
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import App from './App.tsx'
import { applyTheme, loadTheme } from './store/theme'
import { initWhimsy } from './store/whimsy'

applyTheme(loadTheme())
initWhimsy()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

registerSW({ immediate: true })
