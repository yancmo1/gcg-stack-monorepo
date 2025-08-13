import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './App.css';
import VirtualRecordTable from './components/VirtualRecordTable.jsx';
import AddRecordModal from './components/AddRecordModal.jsx';
import TopNav from './components/TopNav.jsx';
import { useTheme } from './context/ThemeContext';
import DashboardAnalytics from './pages/DashboardAnalytics.jsx';
import DashboardHome from './components/DashboardHome.jsx';

const fields = [
  { name: 'employee_name', label: 'Employee Name', required: true, width: '220px' },
  { name: 'title', label: 'Job Title', width: '160px' },
  { name: 'region', label: 'Region', type: 'select', options: ['North', 'South', 'East', 'West', 'Central'], width: '120px' },
  { name: 'start_date', label: 'Start Date', type: 'date', width: '130px' },
  { name: 'completion_date', label: 'Completion Date', type: 'date', width: '130px' },
  { name: 'status', label: 'Status', type: 'select', options: ['Not Started', 'In Progress', 'Completed', 'On Hold'], width: '140px' },
  { name: 'trainer', label: 'Trainer', type: 'select', options: ['Yancy Shepherd', 'Enoch Haney', 'Ken Gentner'], width: '150px' },
  { name: 'mtl_completed', label: 'MTL', type: 'select', options: ['Yes', 'No', 'N/A'], width: '100px' },
  { name: 'new_hire_test_score', label: 'Test Score', type: 'number', width: '110px' },
  { name: 'notes', label: 'Notes', width: '400px', multiline: true }
];

function formatError(e) {
  if (!e) return '';
  if (typeof e === 'string') {
    try {
      const arr = JSON.parse(e);
      if (Array.isArray(arr) && arr[0]?.message) return arr[0].message;
    } catch (err) {}
    return e;
  }
  if (e.message) return e.message;
  return String(e);
}

function getStatusBadge(status) {
  const statusClasses = {
    'Not Started': 'status-not-started',
    'In Progress': 'status-in-progress',
    'Completed': 'status-completed',
    'On Hold': 'status-on-hold'
  };
  return <span className={`status-badge ${statusClasses[status] || ''}`}>{status}</span>;
}

function App() {
  const { dark, setDark } = useTheme();
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editRecord, setEditRecord] = useState(null);

  useEffect(() => {
    async function fetchRecords() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('http://localhost:6001/api/records');
        if (!res.ok) throw new Error('Failed to fetch records');
        const data = await res.json();
        setRecords(data);
      } catch (e) {
        setError(e.message || 'Error fetching records');
      } finally {
        setLoading(false);
      }
    }
    fetchRecords();
  }, []);

  // Filter records logic (replace with actual logic)
  const filteredRecords = records.filter(r =>
    (!searchTerm || r.employee_name?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!filterStatus || r.status === filterStatus)
  );

  return (
    <BrowserRouter>
      <div className={`app${dark ? ' dark' : ''}`}> 
        <TopNav onAddRecord={() => setShowAddModal(true)} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <AddRecordModal
          open={showAddModal || !!editRecord}
          onClose={() => { setShowAddModal(false); setEditRecord(null); }}
          onSubmit={async (form) => {
            setLoading(true);
            try {
              const isEdit = !!editRecord;
              const url = 'http://localhost:6001/api/records' + (isEdit ? `/${editRecord.id}` : '');
              const method = isEdit ? 'PUT' : 'POST';
              const res = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
              if (!res.ok) throw new Error(isEdit? 'Failed to update record':'Failed to add record');
              const data = await res.json();
              if (isEdit) {
                setRecords(prev => prev.map(r => r.id === editRecord.id ? data : r));
                setSuccess('Record updated');
              } else {
                setRecords(prev => [...prev, data]);
                setSuccess('Record added!');
              }
              setShowAddModal(false); setEditRecord(null);
            } catch (e) {
              setError(formatError(e));
            } finally { setLoading(false); }
          }}
          onDelete={async (rec) => {
            if (!rec?.id) return;
            setLoading(true);
            try {
              const res = await fetch(`http://localhost:6001/api/records/${rec.id}`, { method: 'DELETE' });
              if (!res.ok) throw new Error('Failed to delete record');
              setRecords(prev => prev.filter(r => r.id !== rec.id));
              setSuccess('Record deleted');
              setEditRecord(null); setShowAddModal(false);
            } catch (e) { setError(formatError(e)); } finally { setLoading(false); }
          }}
          fields={fields}
          loading={loading}
          initial={editRecord}
        />
        <Routes>
          <Route path="/analytics" element={<DashboardAnalytics />} />
          <Route path="/dashboard" element={<DashboardHome records={records} />} />
          <Route path="/settings" element={<div style={{padding:'2rem'}}><h2>Settings</h2></div>} />
          <Route path="/checklist" element={<div style={{padding:'2rem'}}><h2>Checklist (Placeholder)</h2></div>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/records" element={
            <div className="container">
              {error && <div className="alert alert-error" role="alert">{formatError(error)}</div>}
              {success && <div className="alert alert-success" role="status">{success}</div>}
              <div className="controls-bar" style={{display:'flex', justifyContent:'flex-end'}}>
                <div className="record-count">
                  Showing {filteredRecords.length} of {records.length} records
                </div>
              </div>
              {loading ? (
                <div style={{padding: '2rem', textAlign: 'center', color: '#666'}}>Loading records…</div>
              ) : (
                <VirtualRecordTable records={filteredRecords} fields={fields} onRowClick={(r)=>setEditRecord(r)} />
              )}
              {filteredRecords.length === 0 && records.length > 0 && !loading && (
                <div className="empty-state">
                  <p>No records match your search criteria.</p>
                </div>
              )}
              {records.length === 0 && !loading && (
                <div className="empty-state">
                  <p>No training records yet. Add your first record using the Add Record button above.</p>
                </div>
              )}
            </div>
          } />
          <Route path="*" element={<div style={{padding:'2rem'}}><h2>Not Found</h2></div>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
