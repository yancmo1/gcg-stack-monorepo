import React, { useState, useEffect, useContext } from 'react';
import { ModalContext } from '../components/layout/AppShell';

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE || 'http://localhost:6001/api';


export default function LearnersPage() {
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { openModal, search } = useContext(ModalContext);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editLearner, setEditLearner] = useState(null);
  // Always use context for Quick Add modal

  const TRAINERS = ["Yancy Shepherd", "Enoch Haney"];
  const [newLearner, setNewLearner] = useState({
    employee_name: '',
    title: '',
    region: '',
    start_date: '',
    status: 'Pending',
    trainer: TRAINERS[0],
    notes: ''
  });

  useEffect(() => {
    fetchLearners();
  }, []);

  const fetchLearners = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/records`);
      if (!response.ok) {
        let msg = 'Failed to fetch learners';
        if (response.status === 0) {
          msg = 'Network error or CORS issue. Please check backend CORS settings.';
        }
        throw new Error(msg);
      }
      const data = await response.json();
      setLearners(data);
    } catch (err) {
      setError(err.message);
      alert('Error fetching learners: ' + err.message);
      console.error('Error fetching learners:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!newLearner.employee_name.trim()) {
      alert('Employee name is required');
      return;
    }
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLearner)
      });
      if (!response.ok) {
        let msg = 'Failed to add learner';
        if (response.status === 0) {
          msg = 'Network error or CORS issue. Please check backend CORS settings.';
        }
        throw new Error(msg);
      }
      setNewLearner({
        employee_name: '',
        title: '',
        region: '',
        start_date: '',
        status: 'Pending',
        trainer: '',
        notes: ''
      });
      setShowQuickAdd(false);
      await fetchLearners(); // Force refresh
      alert('Learner added successfully!');
    } catch (err) {
      alert('Failed to add learner: ' + err.message);
      console.error('Error adding learner:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{padding: '2rem'}}>
        <h2 style={{margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: '600'}}>Learners</h2>
        <div style={{textAlign: 'center', padding: '2rem', color: '#6b7280'}}>
          <div style={{fontSize: '2rem', marginBottom: '1rem'}}>⏳</div>
          Loading learners...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{padding: '2rem'}}>
        <h2 style={{margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: '600'}}>Learners</h2>
        <div style={{textAlign: 'center', padding: '2rem', color: '#ef4444'}}>
          <div style={{fontSize: '2rem', marginBottom: '1rem'}}>❌</div>
          Error loading learners: {error}
          <br />
          <button 
            onClick={fetchLearners}
            style={{marginTop: '1rem', padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'}}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }


  // Delete handler
  const handleDelete = async (learner) => {
    if (!window.confirm(`Delete learner ${learner.employee_name}? This cannot be undone.`)) return;
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/learners/${learner.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const text = await response.text();
        throw new Error('Failed to delete learner: ' + text);
      }
      await fetchLearners(); // Force refresh
      setShowEdit(false);
      setEditLearner(null);
      alert('Learner deleted successfully!');
    } catch (err) {
      alert('Failed to delete learner: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{padding: '2rem'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
        <h2 style={{margin: '0', fontSize: '1.5rem', fontWeight: '600'}}>
          Learners ({learners.length})
        </h2>
        {/* Quick Add button removed; only in nav bar now */}
      </div>

      {/* Learners Table */}
      <div style={{background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden', maxHeight: 600, overflowY: 'auto'}}>
        <div style={{overflowX: 'auto'}}>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead style={{backgroundColor: '#f9fafb'}}>
              <tr>
                <th style={{padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb'}}>Employee</th>
                <th style={{padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb'}}>Title</th>
                <th style={{padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb'}}>Region</th>
                <th style={{padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb'}}>Start Date</th>
                <th style={{padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb'}}>Status</th>
                <th style={{padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb'}}>Completion</th>
                <th style={{padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb'}}>Trainer</th>
                <th style={{padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb'}}>Test Score</th>
                {/* Actions column removed for consistent UX */}
              </tr>
            </thead>
            <tbody>
              {learners
                .filter(learner => {
                  if (!search) return true;
                  const q = search.toLowerCase();
                  return [
                    (learner.employee_name || '').toLowerCase(),
                    (learner.title || '').toLowerCase(),
                    (learner.trainer || '').toLowerCase(),
                    (learner.region || '').toLowerCase(),
                    (learner.status || '').toLowerCase()
                  ].some(v => v.includes(q));
                })
                .map((learner, index) => (
                 <tr key={learner.id} style={{cursor: 'pointer'}} onClick={() => { setEditLearner(learner); setShowEdit(true); }}>
                   <td style={{padding: '0.75rem', fontSize: '0.875rem', fontWeight: '500'}}>{learner.employee_name}</td>
                   <td style={{padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280'}}>{learner.title}</td>
                   <td style={{padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280'}}>{learner.region}</td>
                   <td style={{padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280'}}>
                     {learner.start_date ? new Date(learner.start_date).toLocaleDateString() : '-'}
                   </td>
                   <td style={{padding: '0.75rem', fontSize: '0.875rem'}}>
                     <span style={{
                       backgroundColor: learner.status === 'Completed' ? '#dcfce7' : learner.status === 'In Progress' ? '#fef3c7' : '#e5e7eb',
                       color: learner.status === 'Completed' ? '#15803d' : learner.status === 'In Progress' ? '#d97706' : '#6b7280',
                       padding: '0.25rem 0.5rem',
                       borderRadius: '9999px',
                       fontSize: '0.75rem',
                       fontWeight: '500'
                     }}>
                       {learner.status}
                     </span>
                   </td>
                   <td style={{padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280'}}>
                     {learner.completion_date ? new Date(learner.completion_date).toLocaleDateString() : '-'}
                   </td>
                   <td style={{padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280'}}>{learner.trainer}</td>
                   <td style={{padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280'}}>
                     {learner.new_hire_test_score ? `${learner.new_hire_test_score}%` : '-'}
                   </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </div>

  {/* Quick Add Modal handled globally in AppShell */}

      {/* Edit Modal */}
      {showEdit && editLearner && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            padding: '2rem',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '600'}}>Edit Learner</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setSaving(true);
              try {
                const response = await fetch(`${API_BASE}/learners/${editLearner.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(editLearner)
                });
                if (!response.ok) throw new Error('Failed to update learner');
                setShowEdit(false);
                setEditLearner(null);
                await fetchLearners();
                alert('Learner updated successfully!');
              } catch (err) {
                alert('Failed to update learner: ' + err.message);
              } finally {
                setSaving(false);
              }
            }}>
              <div style={{display: 'grid', gap: '1rem', marginBottom: '1.5rem'}}>
                <div>
                  <label style={{display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151'}}>Employee Name *</label>
                  <input
                    type="text"
                    value={editLearner.employee_name}
                    onChange={e => setEditLearner({...editLearner, employee_name: e.target.value})}
                    style={{width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', background: 'rgba(0,0,0,0.10)'}}
                    required
                  />
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                  <div>
                    <label style={{display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151'}}>Title</label>
                    <select
                      value={editLearner.title || ''}
                      onChange={e => setEditLearner({...editLearner, title: e.target.value})}
                      style={{width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', background: 'rgba(0,0,0,0.10)'}}
                    >
                      <option value="">Select Title</option>
                      <option value="Game Tech">Game Tech</option>
                      <option value="Travel Tech">Travel Tech</option>
                    </select>
                  </div>
                  <div>
                    <label style={{display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151'}}>Region</label>
                    <select
                      value={editLearner.region || ''}
                      onChange={e => setEditLearner({...editLearner, region: e.target.value})}
                      style={{width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', background: 'rgba(0,0,0,0.10)'}}
                    >
                          <option value="">Select Region</option>
                          <option value="Tulsa">Tulsa</option>
                          <option value="Central">Central</option>
                          <option value="Southern">Southern</option>
                          <option value="Durant">Durant</option>
                          <option value="North Carolina">North Carolina</option>
                    </select>
                  </div>
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                  <div>
                    <label style={{display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151'}}>Start Date</label>
                    <input
                      type="date"
                      value={editLearner.start_date || ''}
                      onChange={e => setEditLearner({...editLearner, start_date: e.target.value})}
                      style={{width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', background: 'rgba(0,0,0,0.10)'}}
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151'}}>Completed Date</label>
                    <input
                      type="date"
                      value={editLearner.completion_date || ''}
                      onChange={e => setEditLearner({...editLearner, completion_date: e.target.value})}
                      style={{width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', background: 'rgba(0,0,0,0.10)'}}
                    />
                  </div>
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                  <div>
                    <label style={{display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151'}}>Status</label>
                    <select
                      value={editLearner.status || ''}
                      onChange={e => setEditLearner({...editLearner, status: e.target.value})}
                      style={{width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', background: 'rgba(0,0,0,0.10)'}}>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Testing">Testing</option>
                    </select>
                    {/* Retest checkbox only for Testing status */}
                    {(editLearner.status === 'Testing' || editLearner.status === 'Retest') && (
                      <div style={{marginTop: '0.5rem'}}>
                        <label style={{fontSize: '0.875rem', fontWeight: '500', color: '#374151'}}>
                          <input
                            type="checkbox"
                            checked={editLearner.status === 'Retest'}
                            onChange={e => setEditLearner({ ...editLearner, status: e.target.checked ? 'Retest' : 'Testing' })}
                            style={{marginRight: '0.5rem'}}
                          />
                          Retest
                        </label>
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151'}}>Test Score (%)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="e.g. 85"
                      value={(editLearner.new_hire_test_score ?? '').toString()}
                      onChange={e => setEditLearner({...editLearner, new_hire_test_score: e.target.value.replace(/[^0-9]/g, '')})}
                      style={{width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', background: 'rgba(0,0,0,0.10)'}}
                    />
                  </div>
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151'}}>Trainer</label>
                  <select
                    value={editLearner.trainer || ''}
                    onChange={e => setEditLearner({...editLearner, trainer: e.target.value})}
                    style={{width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', background: 'rgba(0,0,0,0.10)'}}
                  >
                    {TRAINERS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151'}}>Notes</label>
                  <textarea
                    value={editLearner.notes || ''}
                    onChange={e => setEditLearner({...editLearner, notes: e.target.value})}
                    rows={2}
                    style={{width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', resize: 'vertical', background: 'rgba(0,0,0,0.10)'}}
                  />
                </div>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem'}}>
                {/* Left side: Delete */}
                <div>
                  <button
                    type="button"
                    title="Delete Learner"
                    onClick={() => handleDelete(editLearner)}
                    disabled={saving}
                    style={{padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', backgroundColor: '#ef4444', color: 'white', fontSize: '0.875rem', fontWeight: '500', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1}}
                  >Delete</button>
                </div>
                {/* Right side: Cancel + Save */}
                <div style={{display: 'flex', gap: '0.75rem'}}>
                  <button
                    type="button"
                    onClick={() => { setShowEdit(false); setEditLearner(null); }}
                    disabled={saving}
                    style={{padding: '0.75rem 1.5rem', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: 'white', color: '#374151', fontSize: '0.875rem', fontWeight: '500', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1}}
                  >Cancel</button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', backgroundColor: '#3b82f6', color: 'white', fontSize: '0.875rem', fontWeight: '500', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1}}
                  >{saving ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        /* Force date input calendar icon to black for legibility */
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1) grayscale(100%);
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
