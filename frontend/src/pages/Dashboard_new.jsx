import React from 'react';


export default function Dashboard() {
  // Static data for now
  const summary = { totalRecords: 10, completed: 5, inProgress: 3, overdue: 2 };
  const tests = {
    last30Days: { Initial: 8, Retest: 2 },
    passRateLast30: 85.5,
    recent: [
      { id: 1, employee_name: 'John Doe', test_type: 'Initial', test_date: '2025-08-01', score: 85, passed: true, notes: 'Good performance' }
    ]
  };

  return (
    <div style={{padding: '1.5rem'}}>
      <h2 style={{margin: '0 0 2rem 0', fontSize: '1.5rem', fontWeight: '600'}}>Dashboard</h2>
      
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem'}}>
        <KPI title="Total Records" value={summary?.totalRecords ?? '...'} />
        <KPI title="Completed" value={summary?.completed ?? '...'} />
        <KPI title="In Progress" value={summary?.inProgress ?? '...'} />
        <KPI title="Overdue" value={summary?.overdue ?? '...'} />
      </div>
      
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem'}}>
        <div style={{background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '1.5rem'}}>
          <h4 style={{margin: '0 0 1rem 0', fontWeight: '600'}}>Tests Last 30 Days</h4>
          <BarChart data={tests?.last30Days || {}} />
        </div>
        <div style={{background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
          <h4 style={{margin: '0 0 1rem 0', fontWeight: '600'}}>Pass Rate (Last 30 Days)</h4>
          <div style={{fontSize: '2.5rem', fontWeight: '700', color: '#10b981'}}>{tests ? `${tests.passRateLast30.toFixed(1)}%` : '...'}</div>
        </div>
      </div>
      
      <div style={{background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '1.5rem'}}>
        <h4 style={{margin: '0 0 1rem 0', fontWeight: '600'}}>Recent Tests</h4>
        <div style={{overflowX: 'auto'}}>
          <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem'}}>
            <thead>
              <tr style={{backgroundColor: '#f8fafc'}}>
                <th style={{padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb'}}>Employee</th>
                <th style={{padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb'}}>Type</th>
                <th style={{padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb'}}>Date</th>
                <th style={{padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb'}}>Score</th>
                <th style={{padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb'}}>Pass</th>
                <th style={{padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb'}}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {tests?.recent?.map((t, i) => (
                <tr key={t.id || i} style={{borderBottom: i === tests.recent.length - 1 ? 'none' : '1px solid #f1f5f9'}}>
                  <td style={{padding: '0.75rem'}}>{t.employee_name}</td>
                  <td style={{padding: '0.75rem'}}>{t.test_type}</td>
                  <td style={{padding: '0.75rem'}}>{t.test_date}</td>
                  <td style={{padding: '0.75rem'}}>{t.score ?? ''}</td>
                  <td style={{padding: '0.75rem'}}>{t.passed ? '✅' : '❌'}</td>
                  <td style={{padding: '0.75rem'}}>{t.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
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

function BarChart({ data }) {
  const max = Math.max(...Object.values(data || { Initial: 0, Retest: 0 }), 1);
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
      {Object.entries(data).map(([type, val]) => (
        <div key={type} style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          <span style={{width: '80px', color: '#6b7280', fontSize: '0.75rem', fontWeight: '500'}}>{type}</span>
          <div style={{flex: '1', backgroundColor: '#e5e7eb', borderRadius: '4px', height: '16px', position: 'relative'}}>
            <div style={{backgroundColor: '#3b82f6', height: '16px', borderRadius: '4px', width: `${(val / max) * 100}%`}} />
          </div>
          <span style={{width: '32px', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600'}}>{val}</span>
        </div>
      ))}
    </div>
  );
}
