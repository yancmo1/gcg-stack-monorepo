import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import './App.css';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import CoursesPage from './pages/CoursesPage';
import LearnersPage from './pages/LearnersPage';
import SettingsPage from './pages/SettingsPage';
import RecordList from './components/RecordList';
import RecordDetails from './components/RecordDetails';
import HealthPage from './pages/HealthPage';
import TestersPage from './pages/TestersPage';

import { ErrorBoundary } from './components/ErrorBoundary';

function MainView() {
  const [selectedId, setSelectedId] = useState(null);
  // TODO: Load real learners data from CSV or backend
  const records = [];
  const filteredRecords = records;
  const selectedRecord = records.find(r => r.id === selectedId);

  return (
    <div style={{display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', height: 'calc(100vh - 200px)'}}>
      <div style={{background: 'white', borderRadius: '8px', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
        <h3 style={{margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600'}}>Records ({records.length})</h3>
        <RecordList records={filteredRecords} selectedId={selectedId} onSelect={setSelectedId} />
      </div>
      <div style={{background: 'white', borderRadius: '8px', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
        <RecordDetails record={selectedRecord} />
      </div>
    </div>
  );
}


function App() {
  return (
  console.log('Rendering App component'),
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="testers" element={<TestersPage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="learners" element={<LearnersPage />} />
            <Route path="assignments" element={<div style={{padding: '2rem'}}><h2>Assignments</h2><p>Coming soon...</p></div>} />
            <Route path="analytics" element={<div style={{padding: '2rem'}}><h2>Analytics</h2><p>Coming soon...</p></div>} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="health" element={<HealthPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
