

import React, { useState } from 'react';

const initialState = {
  employee_name: '',
  title: '',
  region: '',
  status: 'Pending',
  trainer: '',
  start_date: '',
};

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE || 'http://localhost:6001/api';


function RecordForm({ onAdd, onCancel }) {
  const [form, setForm] = useState(initialState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Dropdown options (can be customized)
  const TITLES = ['Game Tech', 'Travel Tech'];
  const REGIONS = ['Northern', 'Central', 'Southern', 'North Carolina'];
  const TRAINERS = ['Yancy Shepherd', 'Enoch Haney', 'Theron Tyler'];
  const STATUSES = ['Pending', 'In Progress', 'Completed', 'Testing', 'Retest'];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!response.ok) throw new Error('Failed to add record');
      setForm(initialState);
      if (onAdd) onAdd();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="record-form" onSubmit={handleSubmit} style={{
      background: 'white',
      border: '10px solid #082f83ff',
      borderRadius: 25,
      boxShadow: '0 4px 24px rgba(37,99,235,0.08)',
      padding: 24,
      maxWidth: 480,
      margin: '5px auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }}>
      <h2 style={{textAlign: 'center', color: '#082f83ff', fontWeight: 700, fontSize: 22, marginBottom: 8}}>Quick Add Learner</h2>
      {error && <div style={{color: '#ef4444', textAlign: 'center', marginBottom: 8}}>{error}</div>}
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
        <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
          <label>Employee Name*</label>
          <input name="employee_name" value={form.employee_name} onChange={handleChange} required style={{padding: 8, borderRadius: 6, border: '1px solid #d1d5db', background: 'rgba(0,0,0,0.05)'}} />
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
          <label>Title</label>
          <select name="title" value={form.title} onChange={handleChange} style={{padding: 8, borderRadius: 6, border: '1px solid #d1d5db', background: 'rgba(0,0,0,0.05)'}}>
            <option value="">Select Title</option>
            {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
          <label>Region</label>
          <select name="region" value={form.region} onChange={handleChange} style={{padding: 8, borderRadius: 6, border: '1px solid #d1d5db', background: 'rgba(0,0,0,0.05)'}}>
            <option value="">Select Region</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
          <label>Status</label>
          <select name="status" value={form.status} onChange={handleChange} style={{padding: 8, borderRadius: 6, border: '1px solid #d1d5db', background: 'rgba(0,0,0,0.05)'}}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
          <label>Trainer</label>
          <select name="trainer" value={form.trainer} onChange={handleChange} style={{padding: 8, borderRadius: 6, border: '1px solid #d1d5db', background: 'rgba(0,0,0,0.05)'}}>
            <option value="">Select Trainer</option>
            {TRAINERS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
          <label>Start Date</label>
          <input type="date" name="start_date" value={form.start_date} onChange={handleChange} style={{padding: 8, borderRadius: 6, border: '1px solid #d1d5db', background: 'rgba(0,0,0,0.05)'}} />
        </div>
      </div>
      <div style={{display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16}}>
        <button type="button" onClick={onCancel} style={{
          background: 'white',
          color: '#374151',
          border: '1px solid #d1d5db',
          borderRadius: 8,
          padding: '10px 24px',
          fontWeight: 500,
          fontSize: 16,
          cursor: 'pointer'
        }}>Cancel</button>
        <button type="submit" disabled={saving} style={{
          background: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          padding: '10px 24px',
          fontWeight: 600,
          fontSize: 16,
          cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.7 : 1
        }}>{saving ? 'Adding...' : 'Add Learner'}</button>
      </div>
    </form>
  );
}

export default RecordForm;
