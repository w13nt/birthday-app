import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './App.css'
import { AuthProvider } from './contexts/AuthContext'
import AppRoot from './AppRoot.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AppRoot />
    </AuthProvider>
  </StrictMode>,
)
