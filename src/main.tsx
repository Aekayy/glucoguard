import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from '@/App'
import { SoundEffects } from '@/components/ui/sound'

import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SoundEffects>
      <App />
    </SoundEffects>
  </StrictMode>,
)
