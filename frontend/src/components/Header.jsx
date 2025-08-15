import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Header({ currentPage, pageDescription }) {
  const { user } = useAuth();

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 'var(--header-h)',
      zIndex: 10,
      background: 'linear-gradient(45deg, var(--brand), var(--brand-600))',
      color: '#fff',
      boxShadow: '0 6px 18px rgba(0,0,0,.08)'
    }}>
      <div style={{
        maxWidth: '100%',
        margin: '0 auto',
        height: '100%',
        padding: '0 18px',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: '12px',
        alignItems: 'center'
      }}>
        {/* Brand/Logo Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          minWidth: 0
        }}>
          <img 
            src="/gcg-logo.png" 
            alt="GCG logo" 
            style={{
              height: '56px',
              width: 'auto',
              display: 'block'
            }}
          />
          <div style={{
            fontWeight: 900,
            letterSpacing: '.25px',
            whiteSpace: 'nowrap',
            lineHeight: '1.2',
            fontSize: 'clamp(14px, 2vw, 16px)'
          }}>
            Field Services<br/>
            Training LMS
          </div>
        </div>

        {/* Page Title Section */}
        <div style={{
          justifySelf: 'end',
          textAlign: 'right',
          minWidth: 0
        }}>
          <div style={{
            fontSize: 'clamp(20px, 4vw, 30px)',
            fontWeight: 900,
            lineHeight: 1
          }}>
            {currentPage || 'Dashboard'}
          </div>
          <div style={{
            opacity: 0.9,
            fontSize: 'clamp(11px, 2vw, 13px)',
            marginTop: '4px'
          }}>
            {pageDescription || 'Quick overview of training, completion and activity.'}
          </div>
        </div>

  {/* User Actions moved to Sidebar bottom */}
      </div>
    </header>
  );
}