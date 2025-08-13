import React from 'react';
import { Sun, Moon, User, BarChart2, ClipboardList, Settings, PlusCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { NavLink } from 'react-router-dom';

export default function TopNav({ onAddRecord, searchTerm, setSearchTerm }) {
  const { dark, setDark } = useTheme();
  const tabs = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Records', to: '/records' },
    { label: 'Analytics', to: '/analytics' },
    { label: 'Checklist', to: '/checklist' },
    { label: 'Settings', to: '/settings' }
  ];
  return (
    <nav style={{
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      position: 'sticky', top: 0, zIndex: 100
    }}>
      <div style={{maxWidth:1440, margin:'0 auto', padding:'0.6rem 2rem', display:'flex', alignItems:'center', gap:24, flexWrap:'wrap'}}>
        <span style={{ fontWeight: 700, fontSize: 20, color: 'var(--color-primary)' }}>Training LMS Tracker</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {tabs.map(tab => (
            <NavLink key={tab.to} to={tab.to} end={tab.to==='/' } style={({isActive})=>({
              textDecoration:'none',
              padding:'6px 14px',
              borderRadius:8,
              fontSize:14,
              fontWeight:600,
              color:isActive?'#fff':'var(--color-text-muted)',
              background:isActive?'#00699b':'transparent',
              border:'2px solid #00699b'
            })}>
              {tab.label}
            </NavLink>
          ))}
        </div>
        <div style={{marginLeft:'auto', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap'}}>
          <input
            type="text"
            value={searchTerm}
            onChange={e=>setSearchTerm(e.target.value)}
            placeholder="Search records..."
            style={{padding:'8px 10px', border:'2px solid #00699b', borderRadius:8, fontSize:14, minWidth:240, background:'#fff', color:'#111'}}
          />
          <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, padding:'8px 16px', background:'#0069ff', color:'#fff', fontWeight:600, border:'2px solid #004caa', borderRadius:8 }} onClick={onAddRecord}><PlusCircle size={16}/> Add Record</button>
          <button className="btn btn-ghost btn-sm" aria-label="Toggle dark mode" onClick={() => setDark(d => !d)} style={{border:'2px solid #00699b', borderRadius:8, padding:'6px 10px', background:'#fff', color:'#00699b'}}>
            {dark ? <Sun size={16}/> : <Moon size={16}/>} 
          </button>
        </div>
      </div>
    </nav>
  );
}
