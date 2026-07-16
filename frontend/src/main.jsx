import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { SettingsProvider } from './context/SettingsContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <SettingsProvider>
      <AuthProvider>
        <CartProvider>
          <App />
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        </CartProvider>
      </AuthProvider>
    </SettingsProvider>
  </BrowserRouter>
)
