import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import './App.css'
import App from './App.jsx'
import axios from 'axios'

// Cấu hình URL gốc cho tất cả các request axios
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
