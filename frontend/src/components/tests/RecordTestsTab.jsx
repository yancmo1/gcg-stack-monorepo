
export default function RecordTestsTab({ recordId }) {
  // Static sample data for now
  const tests = [
    { id: 1, test_type: 'Initial', test_date: '2025-08-01', score: 85, passed: true, notes: 'Good performance' },
    { id: 2, test_type: 'Retest', test_date: '2025-08-02', score: 75, passed: true, notes: '' },
  ];

  if (!tests.length) {
    return (
      <div style={{padding: '2rem', textAlign: 'center', color: '#6b7280'}}>
        <p style={{margin: '0'}}>No tests found for this record.</p>
      </div>
    );
  }

  return (
    <div style={{overflowX: 'auto'}}>
      <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem'}}>
        <thead>
          <tr style={{backgroundColor: '#f8fafc'}}>
            <th style={{padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb'}}>Type</th>
            <th style={{padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb'}}>Date</th>
            <th style={{padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb'}}>Score</th>
            <th style={{padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb'}}>Pass</th>
            <th style={{padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb'}}>Notes</th>
          </tr>
        </thead>
        <tbody>
          {tests.map((t, i) => (
            <tr key={t.id || i} style={{borderBottom: i === tests.length - 1 ? 'none' : '1px solid #f1f5f9'}}>
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
  );
}
