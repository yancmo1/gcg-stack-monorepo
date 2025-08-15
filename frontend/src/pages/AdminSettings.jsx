import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminSettings() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ name: '', description: '' });

  const adminHeaders = (extra = {}) => {
    return { 
      'Content-Type': 'application/json', 
      'X-USER-ID': user?.id || '', 
      ...extra 
    };
  };

  useEffect(() => { fetchDepartments(); }, []);

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments', {
        headers: {
          'X-USER-ID': user?.id || ''
        }
      });
      const data = await res.json();
      setDepartments(data.departments || []);
    } catch (e) { console.error(e); }
  };

  const createDept = async () => {
    if (!newDept.name) return alert('Name required');
    setLoading(true);
    try {
      const res = await fetch('/api/departments', { method: 'POST', headers: adminHeaders(), body: JSON.stringify(newDept) });
      if (!res.ok) { const d = await res.json(); alert(d.error || 'Failed'); setLoading(false); return; }
      setNewDept({ name: '', description: '' });
      await fetchDepartments();
    } catch (e) { alert('Error'); }
    setLoading(false);
  };

  const startEdit = (d) => { setEditingId(d.id); setDraft({ name: d.name, description: d.description || '' }); };
  const cancelEdit = () => { setEditingId(null); setDraft({ name: '', description: '' }); };
  const saveEdit = async (id) => {
    if (!draft.name) return alert('Name required');
    const res = await fetch(`/api/departments/${id}`, { method: 'PUT', headers: adminHeaders(), body: JSON.stringify(draft) });
    if (!res.ok) { const d = await res.json(); alert(d.error || 'Failed'); return; }
    await fetchDepartments(); cancelEdit();
  };

  const deleteDept = async (id) => {
    const dept = departments.find(d => d.id === id);
    if (dept && dept.user_count > 0) {
      alert(`Cannot delete "${dept.name}" because it has ${dept.user_count} user(s). Please move users to other departments first.`);
      return;
    }
    if (!confirm(`Are you sure you want to delete "${dept?.name}"?`)) return;
    
    const res = await fetch(`/api/departments/${id}`, { method: 'DELETE', headers: adminHeaders({ 'Content-Type': undefined }) });
    if (!res.ok) { 
      const d = await res.json(); 
      alert(d.error || 'Failed to delete department'); 
      return; 
    }
    alert('Department deleted successfully');
    await fetchDepartments();
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: 'var(--color-text)' }}>
        Department Management
      </h1>
      
      {/* Create Department Section */}
      <div style={{ 
        background: 'var(--color-surface)', 
        padding: '20px', 
        borderRadius: '8px', 
        border: '1px solid var(--color-border)', 
        marginBottom: '24px' 
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'var(--color-text)' }}>
          Create New Department
        </h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Department Name *
            </label>
            <input 
              placeholder="e.g. Game Prep, IT Support" 
              value={newDept.name} 
              onChange={e => setNewDept({...newDept, name: e.target.value})} 
              style={{ 
                border: '2px solid var(--color-border)', 
                padding: '8px 12px', 
                borderRadius: '6px',
                fontSize: '14px',
                minWidth: '200px'
              }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Description
            </label>
            <input 
              placeholder="Optional description" 
              value={newDept.description} 
              onChange={e => setNewDept({...newDept, description: e.target.value})} 
              style={{ 
                border: '2px solid var(--color-border)', 
                padding: '8px 12px', 
                borderRadius: '6px',
                fontSize: '14px',
                minWidth: '250px'
              }} 
            />
          </div>
          <button 
            onClick={createDept} 
            disabled={!newDept.name || loading}
            style={{ 
              background: newDept.name ? '#0069ff' : '#ccc', 
              color: 'white', 
              padding: '8px 16px', 
              borderRadius: '6px',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              cursor: newDept.name ? 'pointer' : 'not-allowed'
            }}
          >
            {loading ? 'Creating...' : 'Create Department'}
          </button>
        </div>
      </div>

      {/* Departments List */}
      <div style={{ 
        background: 'var(--color-surface)', 
        borderRadius: '8px', 
        border: '1px solid var(--color-border)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: 'var(--color-text)' }}>
            Existing Departments ({departments.length})
          </h2>
        </div>
        
        {departments.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            No departments found. Create your first department above.
          </div>
        ) : (
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-secondary)' }}>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>
                    Department Name
                  </th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>
                    Description
                  </th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>
                    Active Users
                  </th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {departments.map(d => (
                  <tr key={d.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px 20px' }}>
                      {editingId === d.id ? (
                        <input 
                          value={draft.name} 
                          onChange={e => setDraft({...draft, name: e.target.value})} 
                          style={{ 
                            border: '2px solid #0069ff', 
                            padding: '6px 8px', 
                            borderRadius: '4px',
                            fontSize: '14px',
                            width: '100%'
                          }}
                          placeholder="Department name"
                          autoFocus
                        />
                      ) : (
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>{d.name}</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      {editingId === d.id ? (
                        <input 
                          value={draft.description || ''} 
                          onChange={e => setDraft({...draft, description: e.target.value})} 
                          style={{ 
                            border: '2px solid #0069ff', 
                            padding: '6px 8px', 
                            borderRadius: '4px',
                            fontSize: '14px',
                            width: '100%'
                          }}
                          placeholder="Department description"
                        />
                      ) : (
                        <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                          {d.description || 'No description'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 20px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                      {d.user_count || 0}
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      {editingId === d.id ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => saveEdit(d.id)} 
                            disabled={!draft.name}
                            style={{ 
                              color: draft.name ? '#10b981' : '#ccc', 
                              background: 'none',
                              border: 'none',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: draft.name ? 'pointer' : 'not-allowed'
                            }}
                          >
                            Save
                          </button>
                          <button 
                            onClick={cancelEdit} 
                            style={{ 
                              color: '#6b7280', 
                              background: 'none',
                              border: 'none',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button 
                            onClick={() => startEdit(d)} 
                            style={{ 
                              color: '#0069ff', 
                              background: 'none',
                              border: 'none',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => deleteDept(d.id)} 
                            style={{ 
                              color: '#ef4444', 
                              background: 'none',
                              border: 'none',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
