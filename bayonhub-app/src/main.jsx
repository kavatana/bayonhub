import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter } from 'react-router-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './index.css'
import App from './App.jsx'
import Toast from './components/ui/Toast.jsx'

// Register GSAP plugins once globally so lazy-loaded page chunks share the same instance
gsap.registerPlugin(ScrollTrigger, useGSAP)

const savedTheme = localStorage.getItem('bayonhub:theme') || 'light'
if (savedTheme === 'dark') document.documentElement.classList.add('dark')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
        <Toast />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)
