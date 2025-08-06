import { StrictMode } from 'react'
import React from 'react';
// Top-level error boundary for the whole app
class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Root error boundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div style={{color: 'red', padding: '2rem', fontSize: '1.2rem'}}>App Error: {this.state.error && this.state.error.toString()}</div>;
    }
    return this.props.children;
  }
}
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/tailwind.css';
import App from './App.jsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6001/api'
window.__API_BASE__ = API_BASE

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </RootErrorBoundary>
  </StrictMode>,
)
