import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/tailwind.css';
import App from './App.jsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/ToastProvider.jsx';
import { ThemeProvider } from './context/ThemeContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
      retry: 1
    }
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <App />
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
