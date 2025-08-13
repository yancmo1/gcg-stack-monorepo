import React, { useState, useEffect } from 'react';

export default function AddRecordModal({ open, onClose, onSubmit, fields, loading, initial, onDelete }) {
  const initialState = Object.fromEntries(fields.map(f => [f.name, initial?.[f.name] || '']));
  const [form, setForm] = useState(initialState);
  useEffect(() => { setForm(initialState); }, [initial]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };
  const handleSubmit = e => { e.preventDefault(); onSubmit(form); };
  const handleDelete = async () => {
    if (!initial || !onDelete) return;
    if (!window.confirm('Delete this record? This action cannot be undone.')) return;
    onDelete(initial);
  };
  if (!open) return null;
  const inputStyle = { background:'#fff', color:'#111', border:'2px solid #000', borderRadius:6, padding:6, fontSize:14, width:'100%' };
  return (
    <div className="modal-overlay" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:'5vh', overflowY:'auto' }}>
      <div className="modal-content" style={{ background:'#fff', color:'#111', borderRadius:12, padding:32, minWidth:340, maxWidth:860, width:'90%', boxShadow:'0 8px 40px rgba(0,0,0,0.25)' }}>
        <h2 style={{ marginBottom:18, fontSize:22, fontWeight:700 }}>{initial ? 'Edit Record' : 'Add Record'}</h2>
        <form onSubmit={handleSubmit} style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16 }}>
          {fields.map(f => (
            f.multiline ? (
              <div key={f.name} style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column' }}>
                <label style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>{f.label}</label>
                <textarea name={f.name} value={form[f.name]} onChange={handleChange} rows={4} style={{ ...inputStyle, resize:'vertical' }} />
              </div>
            ) : (
              <div key={f.name} style={{ display:'flex', flexDirection:'column' }}>
                <label style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>{f.label}{f.required && <span style={{color:'red'}}>*</span>}</label>
                {f.type === 'date' ? (
                  <input type="date" name={f.name} value={form[f.name]} onChange={handleChange} style={inputStyle} />
                ) : f.type === 'select' ? (
                  <select name={f.name} value={form[f.name]} onChange={handleChange} style={inputStyle}>
                    <option value="">Select</option>
                    {f.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input type={f.type === 'number' ? 'number' : 'text'} name={f.name} value={form[f.name]} onChange={handleChange} style={inputStyle} />
                )}
              </div>
            )
          ))}
          <div style={{ gridColumn:'1/-1', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, marginTop:8 }}>
            <div>
              {initial && onDelete && (
                <button type="button" onClick={handleDelete} style={{ padding:'10px 18px', fontSize:14, fontWeight:600, border:'2px solid #000', background:'#dc2626', color:'#fff', borderRadius:6, cursor:'pointer' }}>Delete</button>
              )}
            </div>
            <div style={{display:'flex', gap:12}}>
              <button type="button" onClick={onClose} style={{ padding:'10px 20px', fontSize:15, fontWeight:600, border:'2px solid #000', background:'#f1f5f9', borderRadius:6, cursor:'pointer' }}>Cancel</button>
              <button type="submit" disabled={loading} style={{ padding:'10px 24px', fontSize:15, fontWeight:700, border:'2px solid #000', background:'#0069ff', color:'#fff', borderRadius:6, cursor:'pointer', opacity:loading?0.7:1 }}>{loading? '...' : initial ? 'Save' : 'Add'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
