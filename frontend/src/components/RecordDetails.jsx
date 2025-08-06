import React, { useState } from 'react';
import RecordTestsTab from './tests/RecordTestsTab';
import RecordHistoryTab from './tests/RecordHistoryTab';

export default function RecordDetails({ record }) {
  const [tab, setTab] = useState('details');
  
  if (!record) {
    return (
      <div style={{padding: '3rem', textAlign: 'center', color: '#6b7280'}}>
        <h3 style={{margin: '0 0 1rem 0', color: '#9ca3af'}}>Select a record</h3>
        <p style={{margin: '0'}}>Choose a record from the list to view details</p>
      </div>
    );
  }

  return (
    <div style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
      <div style={{borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '1rem'}}>
        <h3 style={{margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '600'}}>{record.employee_name}</h3>
        <div style={{fontSize: '0.875rem', color: '#6b7280'}}>
          {record.title && `${record.title} • `}
          {record.region && `${record.region} • `}
          {record.status}
        </div>
      </div>
      
      <div style={{display: 'flex', gap: '1rem', marginBottom: '1rem'}}>
        <button 
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            borderBottom: tab === 'details' ? '2px solid #3b82f6' : '2px solid transparent',
            background: 'none',
            color: tab === 'details' ? '#3b82f6' : '#6b7280',
            cursor: 'pointer',
            fontWeight: tab === 'details' ? '600' : '400'
          }}
          onClick={() => setTab('details')}
        >
          Details
        </button>
        <button 
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            borderBottom: tab === 'tests' ? '2px solid #3b82f6' : '2px solid transparent',
            background: 'none',
            color: tab === 'tests' ? '#3b82f6' : '#6b7280',
            cursor: 'pointer',
            fontWeight: tab === 'tests' ? '600' : '400'
          }}
          onClick={() => setTab('tests')}
        >
          Tests
        </button>
        <button 
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            borderBottom: tab === 'history' ? '2px solid #3b82f6' : '2px solid transparent',
            background: 'none',
            color: tab === 'history' ? '#3b82f6' : '#6b7280',
            cursor: 'pointer',
            fontWeight: tab === 'history' ? '600' : '400'
          }}
          onClick={() => setTab('history')}
        >
          History
        </button>
      </div>
      
      <div style={{flex: '1', overflowY: 'auto'}}>
        {tab === 'details' && (
          <div style={{display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1rem', alignItems: 'start'}}>
            <strong>Employee:</strong> <span>{record.employee_name}</span>
            <strong>Title:</strong> <span>{record.title || 'Not specified'}</span>
            <strong>Region:</strong> <span>{record.region || 'Not specified'}</span>
            <strong>Status:</strong> <span>{record.status}</span>
            <strong>Start Date:</strong> <span>{record.start_date || 'Not specified'}</span>
            <strong>Completion Date:</strong> <span>{record.completion_date || 'Not completed'}</span>
            <strong>Trainer:</strong> <span>{record.trainer || 'Not assigned'}</span>
            <strong>MTL Completed:</strong> <span>{record.mtl_completed || 'Not specified'}</span>
            <strong>Test Score:</strong> <span>{record.new_hire_test_score || 'No score'}</span>
            <strong>Notes:</strong> <span>{record.notes || 'No notes'}</span>
          </div>
        )}
        {tab === 'tests' && <RecordTestsTab recordId={record.id} />}
        {tab === 'history' && <RecordHistoryTab recordId={record.id} />}
      </div>
    </div>
  );
}
