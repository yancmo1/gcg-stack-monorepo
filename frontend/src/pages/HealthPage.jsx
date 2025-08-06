import React from 'react';

export default function HealthPage() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>Frontend Health: OK</h2>
      <p style={{ marginTop: '1rem', color: '#64748b' }}>This is a static health check route from the frontend. Routing is working.</p>
    </div>
  );
}
