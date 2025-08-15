import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, FileText, BarChart, CheckSquare, Users, Settings, User, LogOut } from 'react-feather';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export default function Sidebar() {
  const { user, logout } = useAuth();

  const navItems = [
    { 
      to: '/dashboard', 
      icon: Home, 
      label: 'Dashboard' 
    },
    { 
      to: '/records', 
      icon: FileText, 
      label: 'Records' 
    },
    { 
      to: '/analytics', 
      icon: BarChart, 
      label: 'Analytics' 
    },
    { 
      to: '/checklist', 
      icon: CheckSquare, 
      label: 'Checklist' 
    },
    ...(user?.role === 'Admin' ? [
      { 
        to: '/admin', 
        icon:Users, 
        label: 'Admin' 
      },
      { 
        to: '/settings', 
        icon: Settings, 
        label: 'Settings' 
      }
    ] : [])
  ];

  return (
    <aside 
      className="sidebar"
      style={{
        background: 'linear-gradient(180deg, var(--brand), var(--brand-600))',
        color: '#fff',
        borderRadius: '0 0 18px 0',
        boxShadow: 'var(--shadow)',
        height: '100%',
        borderTop: '1px solid rgba(255, 255, 255, 1)'
      }}
    >
      <nav style={{
        padding: '10px',
        display: 'grid',
        gap: '8px',
        gridAutoRows: 'min-content'
      }}>
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="nav-link"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '14px',
                textDecoration: 'none',
                color: isActive ? '#fff' : '#ffffffdd',
                fontWeight: 800,
                whiteSpace: 'nowrap',
                background: isActive ? 'rgba(255,255,255,0.22)' : 'transparent',
                transition: 'all 0.18s ease'
              })}
            >
              <span style={{
                width: '28px',
                minWidth: '28px',
                height: '28px',
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                fontSize: '20px'
              }}>
                <IconComponent size={20} strokeWidth={2} />
              </span>
              <span className="nav-label">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* User footer (always at bottom) */}
      <div style={{
        marginTop: 'auto',
        padding: 10,
        borderTop: '1px solid rgba(255,255,255,0.2)'
      }}>
        <div className="sidebar-user" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: 10,
          borderRadius: 14,
          background: 'rgba(255,255,255,0.12)'
        }}>
          <span style={{ 
            width: 28, 
            minWidth: 28,
            height: 28,
            display: 'flex', 
            justifyContent: 'flex-start', 
            alignItems: 'center' 
          }}>
            <User size={18} strokeWidth={2} />
          </span>
          <div className="nav-label" style={{ display: 'grid' }}>
            <div style={{ fontWeight: 800, lineHeight: 1 }}>{(() => { const n=(user?.username||'User').split('@')[0].split('.')[0]; return n.charAt(0).toUpperCase()+n.slice(1); })()}</div>
            <div style={{ opacity: 0.85, fontSize: 12 }}>({user?.role||'Admin'})</div>
          </div>
        </div>

        <button onClick={logout}
          className="nav-link"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: 12,
            marginTop: 8,
            borderRadius: 14,
            background: 'rgba(255,255,255,0.08)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer'
          }}
          aria-label="Logout"
        >
          <span style={{ 
            width: 28, 
            minWidth: 28,
            height: 28,
            display: 'flex', 
            justifyContent: 'flex-start', 
            alignItems: 'center' 
          }}>
            <LogOut size={18} strokeWidth={2} />
          </span>
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}