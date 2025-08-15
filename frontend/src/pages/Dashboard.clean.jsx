import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE || 'http://localhost:6001/api';

export default function Dashboard() {
  console.log('Rendering Dashboard component');
  const [learners, setLearners] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editLearner, setEditLearner] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newLearner, setNewLearner] = useState({
    employee_name: '',
    title: '',
    region: '',
    start_date: '',
    status: 'Pending',
    trainer: '',
    notes: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [learnersRes, metricsRes] = await Promise.all([
          fetch(`${API_BASE}/learners`),
          fetch(`${API_BASE}/metrics/summary`)
        ]);
        if (!learnersRes.ok || !metricsRes.ok) {
          throw new Error('Failed to fetch data');
        }
        setLearners(await learnersRes.json());
        setMetrics(await metricsRes.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleEdit = (learner) => {
    setEditLearner(learner);
    setShowEdit(true);
  };

  const handleEditSubmit = async (e) => {
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
      const learnersRes = await fetch(`${API_BASE}/learners`);
      if (learnersRes.ok) setLearners(await learnersRes.json());
      alert('Learner updated successfully!');
    } catch (err) {
      alert('Failed to update learner: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (learner) => {
    setSaving(true);
    try {
      if (!window.confirm(`Delete learner ${learner.employee_name}? This cannot be undone.`)) return;
      const response = await fetch(`${API_BASE}/learners/${learner.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete learner');
      setShowEdit(false);
      setEditLearner(null);
      const learnersRes = await fetch(`${API_BASE}/learners`);
      if (learnersRes.ok) setLearners(await learnersRes.json());
      alert('Learner deleted successfully!');
    } catch (err) {
      alert('Failed to delete learner: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/learners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLearner)
      });
      if (!response.ok) throw new Error('Failed to add learner');
      setShowQuickAdd(false);
      setNewLearner({
        employee_name: '',
        title: '',
        region: '',
        start_date: '',
        status: 'Pending',
        trainer: '',
        notes: ''
      });
      const learnersRes = await fetch(`${API_BASE}/learners`);
      if (learnersRes.ok) setLearners(await learnersRes.json());
      alert('Learner added successfully!');
    } catch (err) {
      alert('Failed to add learner: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{padding: '2rem'}}>Loading...</div>;
  if (error) return <div style={{padding: '2rem', color: 'red'}}>Error: {error}</div>;

  return (
    <div>
      <div style={{padding: '1.5rem'}}>
        <h2 style={{margin: '0 0 2rem 0', fontSize: '1.5rem', fontWeight: '600'}}>Dashboard</h2>
        
        <div style={{marginBottom: '2rem'}}>
          <h3 style={{margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '600'}}>Training Summary</h3>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
            <KPI title="Total Learners" value={metrics?.totalRecords || 0} />
            <KPI title="Completed" value={metrics?.completed || 0} />
            <KPI title="In Progress" value={metrics?.inProgress || 0} />
            <KPI title="Overdue" value={metrics?.overdue || 0} />
          </div>
        </div>

        <div style={{marginBottom: '2rem'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
            <h3 style={{margin: 0, fontSize: '1.25rem', fontWeight: '600'}}>Recent Learners</h3>
            <button
              onClick={() => setShowQuickAdd(true)}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span style={{fontSize: '1.25rem'}}>+</span>
              Quick Add
            </button>
          </div>

          {showEdit && editLearner && (
            <div style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <div style={{background: 'white', borderRadius: '8px', padding: '2rem', minWidth: '400px', maxWidth: '90vw', boxShadow: '0 10px 25px rgba(0,0,0,0.15)'}}>
                <h3 style={{margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '600'}}>Edit Learner</h3>
                <form onSubmit={handleEditSubmit}>
                  <div style={{display: 'grid', gap: '1rem', marginBottom: '1.5rem'}}>
                    <div>
                      <label style={{display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151'}}>Employee Name *</label>
                      <input
                        type="text"
                        value={editLearner.employee_name}
                        onChange={e => setEditLearner({...editLearner, employee_name: e.target.value})}
                        style={{width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem'}}
                        required
                      />
                    </div>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                      <div>
                        <label style={{display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151'}}>Title</label>
                        <select
                          value={editLearner.title || ''}
                          onChange={e => setEditLearner({...editLearner, title: e.target.value})}
                          style={{width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem'}}
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
                          style={{width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem'}}
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
                          style={{width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem'}}
                        />
                      </div>
                      <div>
                        <label style={{display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151'}}>Status</label>
                        <select
                          value={editLearner.status || ''}
                          onChange={e => setEditLearner({...editLearner, status: e.target.value})}
                          style={{width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem'}}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={{display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151'}}>Trainer</label>
                      <input
                        type="text"
                        value={editLearner.trainer || ''}
                        onChange={e => setEditLearner({...editLearner, trainer: e.target.value})}
                        style={{width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem'}}
                      />
                    </div>
                    <div>
                      <label style={{display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151'}}>Notes</label>
                      <textarea
                        value={editLearner.notes || ''}
                        onChange={e => setEditLearner({...editLearner, notes: e.target.value})}
                        rows={2}
                        style={{width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', resize: 'vertical'}}
                      />
                    </div>
                  </div>
                  <div style={{display: 'flex', gap: '0.75rem', justifyContent: 'flex-end'}}>
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
                </form>
                <div style={{borderTop: '1px solid #e5e7eb', marginTop: '1.5rem', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-start'}}>
                  <button
                    onClick={() => handleDelete(editLearner)}
                    style={{background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '0.5rem 1.25rem', fontWeight: '500', cursor: 'pointer'}}
                  >Delete Learner</button>
                </div>
              </div>
            </div>
          )}

          {showQuickAdd && (
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
                <h3 style={{margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '600'}}>Quick Add Learner</h3>
                <form onSubmit={handleQuickAdd}>
                  <div style={{display: 'grid', gap: '1rem', marginBottom: '1.5rem'}}>
                    <div>
                      <label style={{display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151'}}>Employee Name *</label>
                      <input
                        type="text"
                        value={newLearner.employee_name}
                        onChange={e => setNewLearner({...newLearner, employee_name: e.target.value})}
                        style={{width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem'}}
                        required
                      />
                    </div>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                      <div>
                        <label style={{display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151'}}>Title</label>
                        <select
                          value={newLearner.title}
                          onChange={e => setNewLearner({...newLearner, title: e.target.value})}
                          style={{width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem'}}
                        >
                          <option value="">Select Title</option>
                          <option value="Game Tech">Game Tech</option>
                          <option value="Travel Tech">Travel Tech</option>
                          <option value="Manager">Manager</option>
                          <option value="Supervisor">Supervisor</option>
                        </select>
                      </div>
                      <div>
                        <label style={{display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151'}}>Region</label>
                        <select
                          value={newLearner.region}
                          onChange={e => setNewLearner({...newLearner, region: e.target.value})}
                          style={{width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem'}}
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
                          value={newLearner.start_date}
                          onChange={e => setNewLearner({...newLearner, start_date: e.target.value})}
                          style={{width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem'}}
                        />
                      </div>
                      <div>
                        <label style={{display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151'}}>Status</label>
                        <select
                          value={newLearner.status}
                          onChange={e => setNewLearner({...newLearner, status: e.target.value})}
                          style={{width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem'}}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={{display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151'}}>Trainer</label>
                      <input
                        type="text"
                        value={newLearner.trainer}
                        onChange={e => setNewLearner({...newLearner, trainer: e.target.value})}
                        placeholder="e.g. Yancy Shepherd"
                        style={{width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem'}}
                      />
                    </div>
                    <div>
                      <label style={{display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151'}}>Notes</label>
                      <textarea
                        value={newLearner.notes}
                        onChange={e => setNewLearner({...newLearner, notes: e.target.value})}
                        placeholder="e.g. New Hire, Transfer, etc."
                        rows={2}
                        style={{width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', resize: 'vertical'}}
                      />
                    </div>
                  </div>
                  <div style={{display: 'flex', gap: '0.75rem', justifyContent: 'flex-end'}}>
                    <button
                      type="button"
                      onClick={() => setShowQuickAdd(false)}
                      disabled={saving}
                      style={{padding: '0.75rem 1.5rem', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: 'white', color: '#374151', fontSize: '0.875rem', fontWeight: '500', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1}}
                    >Cancel</button>
                    <button
                      type="submit"
                      disabled={saving}
                      style={{padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', backgroundColor: '#3b82f6', color: 'white', fontSize: '0.875rem', fontWeight: '500', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1}}
                    >{saving ? 'Adding...' : 'Add Learner'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div style={{background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden'}}>
            <div style={{overflowX: 'auto'}}>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead style={{backgroundColor: '#f9fafb'}}>
                  <tr>
                    <th style={{padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb'}}>Employee</th>
                    <th style={{padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb'}}>Title</th>
                    <th style={{padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb'}}>Region</th>
                    <th style={{padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb'}}>Status</th>
                    <th style={{padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb'}}>Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {learners.slice(0, 5).map((learner, index) => (
                    <tr key={learner.id} style={{borderBottom: index < 4 ? '1px solid #e5e7eb' : 'none', cursor: 'pointer'}} onClick={() => handleEdit(learner)}>
                      <td style={{padding: '0.75rem', fontSize: '0.875rem'}}>{learner.employee_name}</td>
                      <td style={{padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280'}}>{learner.title}</td>
                      <td style={{padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280'}}>{learner.region}</td>
                      <td style={{padding: '0.75rem', fontSize: '0.875rem'}}>
                        <span style={{
                          backgroundColor: learner.status === 'Completed' ? '#dcfce7' : '#fef3c7',
                          color: learner.status === 'Completed' ? '#15803d' : '#d97706',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {learner.status}
                        </span>
                      </td>
                      <td style={{padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280'}}>
                        {learner.completion_date ? new Date(learner.completion_date).toLocaleDateString() : 'In Progress'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({ title, value }) {
  return (
    <div style={{background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'}}>
      <div style={{fontSize: '2rem', fontWeight: '700', marginBottom: '0.25rem'}}>{value}</div>
      <div style={{color: '#6b7280', fontSize: '0.875rem', fontWeight: '500'}}>{title}</div>
    </div>
  );
}
