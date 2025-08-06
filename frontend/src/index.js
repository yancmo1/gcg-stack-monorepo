import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

export const apiBase = window.__API_BASE__ || 'http://localhost:6001/api'

export async function apiGet(path) {
  const res = await fetch(`${apiBase}${path}`)
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)
  return res.json()
}

export async function apiPost(path, body) {
  const res = await fetch(`${apiBase}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`)
  return res.json()
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
