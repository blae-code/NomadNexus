import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { LiveKitProvider } from './hooks/useLiveKit'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LiveKitProvider>
      <App />
    </LiveKitProvider>
  </React.StrictMode>
) 
