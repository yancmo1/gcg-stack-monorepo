
import React, { useState, useMemo } from 'react';

export default function RecordList({ records, selectedId, onSelect }) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    if (!search) return records;
    return records.filter(r =>
      (r.employee_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.title || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [records, search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search records..."
        style={{
          marginBottom: '0.75rem',
          padding: '0.5rem 0.75rem',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          fontSize: '1rem',
          outline: 'none',
          background: '#f8fafc',
        }}
        aria-label="Search records"
      />
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', maxHeight: '60vh', paddingRight: '2px' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '1rem' }}>
            <span role="img" aria-label="No records" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📭</span>
            No records found
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filtered.map(record => (
              <div
                key={record.id}
                style={{
                  padding: '0.85rem 1rem',
                  cursor: 'pointer',
                  borderRadius: '10px',
                  border: selectedId === record.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  backgroundColor: selectedId === record.id ? '#eff6ff' : 'white',
                  boxShadow: selectedId === record.id ? '0 2px 8px rgba(59,130,246,0.08)' : '0 1px 3px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                }}
                onClick={() => onSelect(record.id)}
                onMouseEnter={e => {
                  if (selectedId !== record.id) {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                  }
                }}
                onMouseLeave={e => {
                  if (selectedId !== record.id) {
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '1.05rem', color: '#0f172a' }}>{record.employee_name || 'Unknown'}</span>
                <span style={{ fontSize: '0.93rem', color: '#64748b' }}>{record.title || <span style={{ color: '#cbd5e1' }}>No title</span>}</span>
                <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 500 }}>{record.status || 'No status'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
