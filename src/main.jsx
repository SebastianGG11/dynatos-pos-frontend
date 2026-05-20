import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Red de seguridad: si alguien llama localStorage.clear() por error, los datos de ventas sobreviven
const _originalClear = localStorage.clear.bind(localStorage);
localStorage.clear = function () {
  const preservar = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("dynatos_")) {
      preservar[key] = localStorage.getItem(key);
    }
  }
  _originalClear();
  Object.entries(preservar).forEach(([k, v]) => localStorage.setItem(k, v));
  if (Object.keys(preservar).length > 0) {
    console.warn("[SEGURIDAD] localStorage.clear() interceptado — datos preservados:", Object.keys(preservar));
  }
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
