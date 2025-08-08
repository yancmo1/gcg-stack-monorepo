import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE || 'http://localhost:6001/api';

export default function TestingPage() {
  const [testers, setTesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTesters();
  }, []);

  const fetchTesters = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/records`);
      if (!response.ok) throw new Error('Failed to fetch testers');
      const data = await response.json();
      // Filter for status 'Testing' or 'Retest Scheduled'
      const filtered = data.filter(r => r.status === 'Testing' || r.status === 'Retest Scheduled');
      setTesters(filtered);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Testing</h2>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">Error: {error}</div>}
      <table className="min-w-full bg-white border border-slate-200">
        <thead>
          <tr>
            <th className="px-4 py-2 border-b">Name</th>
            <th className="px-4 py-2 border-b">Status</th>
            <th className="px-4 py-2 border-b">Test Date</th>
            <th className="px-4 py-2 border-b">Retest Date</th>
          </tr>
        </thead>
        <tbody>
          {testers.map(t => (
            <tr key={t.id}>
              <td className="px-4 py-2 border-b">{t.employee_name || t.name}</td>
              <td className="px-4 py-2 border-b">{t.status}</td>
              <td className="px-4 py-2 border-b">{t.test_date || ''}</td>
              <td className="px-4 py-2 border-b">{t.retest_date || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
