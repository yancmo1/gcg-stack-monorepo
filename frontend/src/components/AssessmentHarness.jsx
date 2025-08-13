import React, { useState, useEffect } from 'react';

/*
  AssessmentHarness: Minimal manual test UI for prototype assessment endpoints.
  Features:
    1. Create or load sample template (Tier 1 Assessment)
    2. Select a record (learner) and create an assessment instance
    3. Fetch assessment items & enter responses
    4. Submit responses to compute weighted score & pass/fail
*/

export default function AssessmentHarness() {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [sampleTemplate, setSampleTemplate] = useState(null);
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState('');
  const [assessmentId, setAssessmentId] = useState(null);
  const [assessmentData, setAssessmentData] = useState(null);
  const [responses, setResponses] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Load records (reusing existing API)
  useEffect(() => {
    fetch('/api/records')
      .then(r => r.json())
      .then(data => setRecords(Array.isArray(data) ? data : (data.items || [])))
      .catch(() => setError('Failed to load records'));
  }, []);

  const createOrLoadSampleTemplate = async () => {
    setLoading(true); setError(''); setMessage('');
    try {
      const res = await fetch('/api/assessment-templates/sample', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create sample template');
      setSampleTemplate(data.template);
      setTemplates([data.template]);
      setMessage(data.message === 'exists' ? 'Sample template already exists.' : 'Sample template created.');
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  const createAssessment = async () => {
    if (!sampleTemplate || !selectedRecord) return;
    setLoading(true); setError(''); setMessage('');
    try {
      const res = await fetch(`/api/records/${selectedRecord}/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: sampleTemplate.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create assessment');
      setAssessmentId(data.assessment_id);
      setMessage('Assessment created');
      await fetchAssessment(data.assessment_id);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  const fetchAssessment = async (id = assessmentId) => {
    if (!id) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/assessments/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch assessment');
      setAssessmentData(data);
      // Initialize responses with existing values
      const initial = {};
      (data.items || []).forEach(it => {
        if (it.value_text != null) initial[it.id] = it.value_text;
      });
      setResponses(initial);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  const updateResponse = (item, value) => {
    setResponses(prev => ({ ...prev, [item.id]: value }));
  };

  const submitResponses = async () => {
    if (!assessmentId) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const payload = {
        responses: Object.entries(responses).map(([item_id, value]) => ({ item_id: Number(item_id), value }))
      };
      const res = await fetch(`/api/assessments/${assessmentId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setResult(data);
      setMessage('Responses saved');
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="assessment-harness" style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: 8 }}>
      <h2 style={{ marginTop: 0 }}>Assessment Harness (Prototype)</h2>
      <p style={{ fontSize: 14, color: '#555' }}>Use this panel to exercise the new assessment endpoints without affecting core workflow.</p>

      {error && <div style={{ background: '#fee2e2', padding: '0.5rem 0.75rem', borderRadius: 6, color: '#991b1b', marginBottom: 8 }}>{error}</div>}
      {message && <div style={{ background: '#ecfdf5', padding: '0.5rem 0.75rem', borderRadius: 6, color: '#065f46', marginBottom: 8 }}>{message}</div>}

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button disabled={loading} onClick={createOrLoadSampleTemplate} className="btn btn-primary btn-sm">{loading ? '...' : 'Load/Create Sample Template'}</button>
        <select value={selectedRecord} onChange={e => setSelectedRecord(e.target.value)} style={{ minWidth: 200 }}>
          <option value="">Select Record</option>
          {records.map(r => <option key={r.id} value={r.id}>{r.employee_name || `Record ${r.id}`}</option>)}
        </select>
        <button disabled={!sampleTemplate || !selectedRecord || loading} onClick={createAssessment} className="btn btn-secondary btn-sm">Create Assessment</button>
        {assessmentId && <button onClick={() => fetchAssessment()} disabled={loading} className="btn btn-ghost btn-sm">Refresh Assessment</button>}
      </div>

      {sampleTemplate && (
        <div style={{ marginBottom: '1rem', fontSize: 14 }}>
          <strong>Template:</strong> {sampleTemplate.name} (Items: {sampleTemplate.items?.length || 'n/a'})
        </div>
      )}

      {assessmentData && (
        <div style={{ marginTop: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>Assessment #{assessmentId}</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
            <thead>
              <tr>
                <th style={th}>Item</th>
                <th style={th}>Type</th>
                <th style={th}>Max</th>
                <th style={th}>Weight</th>
                <th style={th}>Response</th>
                <th style={th}>Existing Score</th>
              </tr>
            </thead>
            <tbody>
              {assessmentData.items.map(item => {
                const current = responses[item.id] ?? '';
                return (
                  <tr key={item.id}>
                    <td style={td}>{item.label}</td>
                    <td style={td}>{item.item_type}</td>
                    <td style={td}>{item.max_score}</td>
                    <td style={td}>{item.weight}</td>
                    <td style={td}>
                      {item.item_type === 'boolean' ? (
                        <input
                          type="checkbox"
                          checked={['true','1','yes','y'].includes(String(current).toLowerCase())}
                          onChange={e => updateResponse(item, e.target.checked)}
                        />
                      ) : item.item_type === 'score' ? (
                        <input
                          type="number"
                          style={{ width: 80 }}
                          value={current}
                          min={0}
                          max={item.max_score}
                          onChange={e => updateResponse(item, e.target.value)}
                        />
                      ) : (
                        <input
                          type="text"
                          style={{ width: '100%' }}
                          value={current}
                          onChange={e => updateResponse(item, e.target.value)}
                        />
                      )}
                    </td>
                    <td style={td}>{item.numeric_score != null ? item.numeric_score : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button disabled={loading} onClick={submitResponses} className="btn btn-primary btn-sm">{loading ? 'Saving...' : 'Submit Responses'}</button>
        </div>
      )}

      {result && (
        <div style={{ marginTop: '1rem', background: '#f1f5f9', padding: '0.75rem 1rem', borderRadius: 6 }}>
          <strong>Result:</strong> {result.percent.toFixed(2)}% ({result.total_score.toFixed(2)} / {result.max_score.toFixed(2)}) – {result.passed ? 'PASS' : 'FAIL'}
        </div>
      )}
    </div>
  );
}

const th = { borderBottom: '1px solid #cbd5e1', textAlign: 'left', padding: '4px 6px', fontSize: 12, background: '#f8fafc' };
const td = { borderBottom: '1px solid #e2e8f0', padding: '4px 6px', fontSize: 12 };
