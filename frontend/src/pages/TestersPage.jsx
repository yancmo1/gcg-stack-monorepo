import React, { useState } from 'react';

// TODO: Import real testers data from CSV or backend
const testersData = [];

function RetestBadge() {
  return (
    <span style={{
      background: '#fbbf24', color: '#fff', padding: '2px 10px', borderRadius: '12px', fontSize: '0.85em', fontWeight: 600, marginLeft: 6, display: 'inline-flex', alignItems: 'center', gap: 4
    }}>
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" style={{marginRight: 2}}><path d="M10 2v2m0 12v2m8-8h-2M4 10H2m13.07-5.07l-1.42 1.42M6.34 17.66l-1.42-1.42m12.02 0l-1.42-1.42M6.34 4.34L4.92 5.76" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
      Retest
    </span>
  );
}

export default function TestersPage() {
  const [tab, setTab] = useState('all');
  const testers = tab === 'all' ? testersData : testersData.filter(t => t.retest);

  return (
    <div style={{padding: '2rem'}}>
      <h2 style={{fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem'}}>Testers</h2>
      <div style={{display: 'flex', gap: '1rem', marginBottom: '1.5rem'}}>
        <button onClick={() => setTab('all')} style={{padding: '0.5rem 1.5rem', borderRadius: '8px', border: 'none', background: tab==='all' ? '#3b82f6' : '#e5e7eb', color: tab==='all' ? '#fff' : '#334155', fontWeight: 600, fontSize: '1rem', cursor: 'pointer'}}>All</button>
        <button onClick={() => setTab('retest')} style={{padding: '0.5rem 1.5rem', borderRadius: '8px', border: 'none', background: tab==='retest' ? '#fbbf24' : '#e5e7eb', color: tab==='retest' ? '#fff' : '#334155', fontWeight: 600, fontSize: '1rem', cursor: 'pointer'}}>Retests</button>
      </div>
      <div style={{overflowX: 'auto'}}>
        <table style={{width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'}}>
          <thead>
            <tr style={{background: '#f1f5f9'}}>
              <th style={{padding: '0.75rem', textAlign: 'left'}}>Name</th>
              <th style={{padding: '0.75rem', textAlign: 'left'}}>Title</th>
              <th style={{padding: '0.75rem', textAlign: 'left'}}>Region</th>
              <th style={{padding: '0.75rem', textAlign: 'left'}}>Test Date</th>
              <th style={{padding: '0.75rem', textAlign: 'left'}}>Score</th>
              <th style={{padding: '0.75rem', textAlign: 'left'}}>Pass</th>
              <th style={{padding: '0.75rem', textAlign: 'left'}}>Retest</th>
              <th style={{padding: '0.75rem', textAlign: 'left'}}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {testers.map(t => (
              <tr key={t.id} style={{borderBottom: '1px solid #f1f5f9'}}>
                <td style={{padding: '0.75rem', fontWeight: 600, color: '#0f172a'}}>{t.name}</td>
                <td style={{padding: '0.75rem'}}>{t.title}</td>
                <td style={{padding: '0.75rem'}}>{t.region}</td>
                <td style={{padding: '0.75rem'}}>{t.testDate}</td>
                <td style={{padding: '0.75rem'}}>{t.score ?? ''}</td>
                <td style={{padding: '0.75rem'}}>{t.passed ? '✅' : '❌'}</td>
                <td style={{padding: '0.75rem'}}>{t.retest ? <RetestBadge /> : ''} {t.retest && t.retestDate ? <span style={{marginLeft:8, color:'#64748b', fontSize:'0.95em'}}>{t.retestDate}</span> : null}</td>
                <td style={{padding: '0.75rem'}}>{t.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
