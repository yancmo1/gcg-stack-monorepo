import React, { useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, EyeOff, Eye } from 'lucide-react';
import clsx from 'clsx';

export default function VirtualRecordTable({ records, fields, onRowClick }) {
  const [sort, setSort] = useState({ key: 'id', dir: 'desc' });
  const [hidden, setHidden] = useState({});

  const toggleColumn = (key) => setHidden(h => ({ ...h, [key]: !h[key] }));

  const sorted = useMemo(() => {
    if (!sort.key) return records;
    const copy = [...records];
    copy.sort((a,b) => {
      const av = a[sort.key] ?? '';
      const bv = b[sort.key] ?? '';
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [records, sort]);

  const visibleFields = fields.filter(f => !hidden[f.name]);

  const headerCell = (f) => {
    const active = sort.key === f.name;
    return (
      <th key={f.name} style={{ position: 'sticky', top: 0, background: '#fff', color: '#111', cursor: 'pointer', padding: '6px 8px', fontSize: 12, textAlign: 'left', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}
          onClick={() => setSort(s => ({ key: f.name, dir: s.key === f.name && s.dir === 'asc' ? 'desc' : 'asc' }))}>
        <span>{f.label}</span>
        {active && (sort.dir === 'asc' ? <ChevronUp size={12} style={{ marginLeft: 4 }} /> : <ChevronDown size={12} style={{ marginLeft: 4 }} />)}
      </th>
    );
  };

  if (!records || records.length === 0) {
    return <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>No records found.</div>;
  }

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff', overflow: 'auto', maxHeight: '60vh' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '6px 10px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
        {fields.map(f => (
          <button key={f.name} onClick={() => toggleColumn(f.name)} className={clsx('btn btn-sm', hidden[f.name] ? 'btn-secondary' : 'btn-ghost')} style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4, color: '#111', background: hidden[f.name] ? '#e5e7eb' : '#fff', border: '1px solid #e5e7eb' }}>
            {hidden[f.name] ? <EyeOff size={12}/> : <Eye size={12} />}
            {f.label}
          </button>
        ))}
      </div>
      <div style={{ width: '100%', height: 400, position: 'relative', overflow: 'auto', background: '#fff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', color: '#111', tableLayout: 'fixed' }}>
          <colgroup>
            {visibleFields.map(f =>
              f.name === 'notes'
                ? <col key={f.name} style={{ width: 'auto' }} />
                : <col key={f.name} style={{ width: f.width || 140, maxWidth: f.width || 140 }} />
            )}
          </colgroup>
          <thead style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 2 }}>
            <tr style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>
              {visibleFields.map(headerCell)}
            </tr>
          </thead>
          <tbody>
            {records.map((r,i) => (
              <tr key={i} onClick={()=>onRowClick && onRowClick(r)} style={{ cursor:'pointer', background: i%2===0? '#fff':'#fdfdfd' }}>
                {visibleFields.map(f => {
                  let value = r[f.name];
                  // For select fields, show value even if not in options, and fallback for missing
                  if (f.type === 'select') {
                    if (!value) value = <span style={{ color: '#aaa' }}>—</span>;
                    else if (!f.options.includes(value)) value = <span style={{ color: '#eab308' }}>{r[f.name]} <em>(unknown)</em></span>;
                  } else if (!value) {
                    value = <span style={{ color: '#aaa' }}>—</span>;
                  }
                  return (
                    <td key={f.name} style={{ padding:'8px 12px', fontSize:13, borderBottom:'1px solid #f1f5f9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', ...(f.name === 'notes' ? { width: 'auto' } : { width: f.width, maxWidth: f.width }) }} title={r[f.name] || ''}>{value}</td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
