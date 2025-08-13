import React, { createContext, useCallback, useContext, useState } from 'react';
import { X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((toast) => {
    const id = crypto.randomUUID();
    const t = { id, type: toast.type || 'info', message: toast.message, ttl: toast.ttl || 4000 };
    setToasts(prev => [...prev, t]);
    if (t.ttl > 0) {
      setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), t.ttl);
    }
  }, []);

  const dismiss = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);

  return (
    <ToastContext.Provider value={{ push, dismiss }}>
      {children}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 5000, display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: 360 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)',
            borderLeft: `4px solid ${t.type === 'error' ? 'var(--color-danger)' : t.type === 'success' ? 'var(--color-success)' : 'var(--color-primary)'}`,
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start'
          }}>
            <div style={{ flex: 1, fontSize: 14, color: 'var(--color-text)' }}>{t.message}</div>
            <button aria-label="Dismiss" onClick={() => dismiss(t.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 2 }}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
