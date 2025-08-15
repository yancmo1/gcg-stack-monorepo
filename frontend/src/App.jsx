import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './index.css';
import './components/Layout.css';
import VirtualRecordTable from './components/VirtualRecordTable.jsx';
import AddRecordModal from './components/AddRecordModal.jsx';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import Login from './components/Login.jsx';
import { useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import DashboardAnalytics from './pages/DashboardAnalytics.jsx';
import DashboardHome from './components/DashboardHome.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminSettings from './pages/AdminSettings.jsx';

const fields = [
  { name: 'employee_name', label: 'Employee Name', required: true, width: '180px' },
  { name: 'title', label: 'Job Title', width: '100px' },
  { name: 'region', label: 'Region', type: 'select', options: ['Tulsa', 'Central', 'Southern', 'Durant', 'North Carolina'], width: '100px' },
  { name: 'start_date', label: 'Start Date', type: 'date', width: '120px' },
  { name: 'completion_date', label: 'Completion Date', type: 'date', width: '120px' },
  { name: 'status', label: 'Status', type: 'select', options: ['Not Started', 'In Progress', 'Completed', 'On Hold'], width: '140px' },
  { name: 'trainer', label: 'Trainer', type: 'select', options: ['Yancy Shepherd', 'Enoch Haney'], width: '120px' },
  { name: 'mtl_completed', label: 'MTL', type: 'select', options: ['Yes', 'No', 'N/A'], width: '60px' },
  { name: 'new_hire_test_score', label: 'Test Score', type: 'number', width: '80px' },
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

function getPageInfo(pathname) {
  switch (pathname) {
    case '/dashboard':
      return { title: 'Dashboard', description: 'Quick overview of training, completion and activity.' };
    case '/records':
      return { title: 'Records', description: 'Manage and view all training records.' };
    case '/analytics':
      return { title: 'Analytics', description: 'Data insights and performance metrics.' };
    case '/checklist':
      return { title: 'Checklist', description: 'Training checklists and requirements.' };
    case '/admin':
      return { title: 'Admin', description: 'User management and system administration.' };
    case '/settings':
      return { title: 'Settings', description: 'Department and system configuration.' };
    default:
      return { title: 'Dashboard', description: 'Quick overview of training, completion and activity.' };
  }
}

function AppContent() {
  const location = useLocation();
  const pageInfo = getPageInfo(location.pathname);
  
  return (
    <div className="app"> 
      <Header 
        currentPage={pageInfo.title}
        pageDescription={pageInfo.description}
      />
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <MainContent />
        </div>
      </div>
    </div>
  );
}

function MainContent() {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editRecord, setEditRecord] = useState(null);

  // Auto-clear popups after 3 seconds
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(t);
    }
  }, [error]);

  // Fetch records helper
  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:6001/api/records', {
        headers: {
          'X-USER-ID': user?.id || ''
        }
      });
      if (!res.ok) throw new Error('Failed to fetch records');
      const data = await res.json();
      setRecords(data);
    } catch (e) {
      setError(e.message || 'Error fetching records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (user) {
      fetchRecords(); 
    }
  }, [user]);

  // Filter records logic
  const filteredRecords = records.filter(r =>
    (!searchTerm || r.employee_name?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!filterStatus || r.status === filterStatus)
  );

  return (
    <main className="main-content">
      <AddRecordModal
        open={showAddModal || !!editRecord}
        onClose={() => { setShowAddModal(false); setEditRecord(null); }}
        onSubmit={async (form) => {
          setLoading(true);
          try {
            const isEdit = !!editRecord;
            const url = 'http://localhost:6001/api/records' + (isEdit ? `/${editRecord.id}` : '');
            const method = isEdit ? 'PUT' : 'POST';
            const res = await fetch(url, { 
              method, 
              headers: {
                'Content-Type': 'application/json',
                'X-USER-ID': user?.id || ''
              }, 
              body: JSON.stringify(form) 
            });
            if (!res.ok) throw new Error(isEdit? 'Failed to update record':'Failed to add record');
            await res.json();
            setSuccess(isEdit ? 'Record updated' : 'Record added!');
            setShowAddModal(false); setEditRecord(null);
            await fetchRecords();
          } catch (e) {
            setError(formatError(e));
          } finally { setLoading(false); }
        }}
        onDelete={async (rec) => {
          if (!rec?.id) return;
          setLoading(true);
          try {
            const res = await fetch(`http://localhost:6001/api/records/${rec.id}`, { 
              method: 'DELETE',
              headers: {
                'X-USER-ID': user?.id || ''
              }
            });
            if (!res.ok) throw new Error('Failed to delete record');
            setSuccess('Record deleted');
            setEditRecord(null); setShowAddModal(false);
            await fetchRecords();
          } catch (e) { setError(formatError(e)); } finally { setLoading(false); }
        }}
        fields={fields}
        loading={loading}
        initial={editRecord}
      />
      <Routes>
        <Route path="/analytics" element={
          <div className="page-container">
            <DashboardAnalytics />
          </div>
        } />
        <Route path="/dashboard" element={
          <div className="page-container">
            <DashboardHome 
              records={records} 
              onAddRecord={() => setShowAddModal(true)}
            />
          </div>
        } />
        {user?.role === 'Admin' && (
          <>
            <Route path="/admin" element={
              <div className="page-container">
                <AdminUsers />
              </div>
            } />
            <Route path="/settings" element={
              <div className="page-container">
                <AdminSettings />
              </div>
            } />
          </>
        )}
        <Route path="/checklist" element={
          <div className="page-container">
            <h2>Checklist (Placeholder)</h2>
          </div>
        } />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/records" element={
          <div className="page-container">
            {error && <div className="alert alert-error" role="alert">{formatError(error)}</div>}
            {success && <div className="alert alert-success" role="status">{success}</div>}
            
            {/* Add Record Button */}
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={e=>setSearchTerm(e.target.value)}
                placeholder="Search records..."
                style={{
                  padding:'12px 16px', 
                  border:'2px solid var(--ring)', 
                  borderRadius: 'var(--radius)', 
                  fontSize:14, 
                  minWidth:280, 
                  background:'var(--panel)', 
                  color:'var(--ink)'
                }}
                autoComplete="off"
                data-lpignore="true"
              />
              <button 
                onClick={() => setShowAddModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius)',
                  border: 0,
                  cursor: 'pointer',
                  fontWeight: 900,
                  color: '#fff',
                  background: 'var(--brand)',
                  boxShadow: 'var(--shadow)'
                }}
              >
                + Add Record
              </button>
            </div>
            
            <div style={{ 
              background: 'var(--panel)', 
              borderRadius: 'var(--radius)', 
              padding: 0, 
              marginBottom: 24, 
              overflow: 'hidden',
              boxShadow: 'var(--shadow)',
              border: '1px solid #eef3ff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px 0 10px', background: '#f9fbff', borderBottom: '1px solid var(--ring)' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                </div>
                <div style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500, marginLeft: 'auto', textAlign: 'right' }}>
                  Showing {filteredRecords.length} of {records.length} records
                </div>
              </div>
              {loading ? (
                <div style={{padding: '2rem', textAlign: 'center', color: 'var(--muted)'}}>Loading records…</div>
              ) : (
                <VirtualRecordTable records={filteredRecords} fields={fields} onRowClick={(r)=>setEditRecord(r)} />
              )}
            </div>
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
        <Route path="*" element={
          <div className="page-container">
            <h2>Not Found</h2>
          </div>
        } />
      </Routes>
    </main>
  );
}

function AuthenticatedApp() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function App() {
  const { loading, isAuthenticated, login } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={login} />;
  }

  return <AuthenticatedApp />;
}

function AppWithAuth() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

export default AppWithAuth;
