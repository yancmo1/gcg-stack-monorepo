import React, { useMemo, useState } from 'react';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, PointElement, LineElement } from 'chart.js';
import { useAuth } from '../context/AuthContext';
Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, PointElement, LineElement);

export default function DashboardHome({ records, onAddRecord }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('region');
  const recent = useMemo(() => [...records].sort((a,b)=> new Date(b.id?b.id:0) - new Date(a.id?a.id:0)).slice(0,4), [records]);

  // Statistics
  const activeCourses = 18; // Fixed for mock
  const completionRate = 82; // Fixed for mock  
  const avgTimeToComplete = "3.4d"; // Fixed for mock

  // Analytics calculations
  const analytics = useMemo(() => {
    // Region distribution
    const regionCounts = {};
    records.forEach(r => {
      if (r.region) regionCounts[r.region] = (regionCounts[r.region]||0)+1;
    });

    // Monthly data
    const monthlyData = {};
    records.forEach(r => {
      if (r.start_date) {
        const month = r.start_date.slice(0,7); // YYYY-MM
        monthlyData[month] = (monthlyData[month]||0)+1;
      }
    });

    // Course popularity (based on title)
    const courseCounts = {};
    records.forEach(r => {
      if (r.title) courseCounts[r.title] = (courseCounts[r.title]||0)+1;
    });

    return {
      regions: {
        labels: Object.keys(regionCounts),
        data: Object.values(regionCounts)
      },
      monthly: {
        labels: Object.keys(monthlyData).sort(),
        data: Object.keys(monthlyData).sort().map(m => monthlyData[m])
      },
      courses: {
        labels: Object.keys(courseCounts).slice(0, 6), // Top 6 courses
        data: Object.keys(courseCounts).slice(0, 6).map(c => courseCounts[c])
      }
    };
  }, [records]);

  const renderAnalyticsChart = () => {
    const colors = ['#084c8e', '#10b981', '#f59e42', '#6366f1', '#ef4444', '#8b5cf6'];
    
    switch (activeTab) {
      case 'region':
        return (
          <div style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Pie 
              data={{
                labels: analytics.regions.labels,
                datasets: [{
                  data: analytics.regions.data,
                  backgroundColor: colors
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { fontSize: 10 }
                  }
                }
              }}
            />
          </div>
        );
      case 'monthly':
        return (
          <div style={{ height: '200px' }}>
            <Line 
              data={{
                labels: analytics.monthly.labels,
                datasets: [{
                  label: 'Training Records',
                  data: analytics.monthly.data,
                  borderColor: '#084c8e',
                  backgroundColor: 'rgba(8, 76, 142, 0.1)',
                  tension: 0.3,
                  fill: true
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true }
                }
              }}
            />
          </div>
        );
      case 'courses':
        return (
          <div style={{ height: '200px' }}>
            <Bar 
              data={{
                labels: analytics.courses.labels,
                datasets: [{
                  data: analytics.courses.data,
                  backgroundColor: '#084c8e'
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true },
                  x: { 
                    ticks: { 
                      maxRotation: 45,
                      font: { size: 10 }
                    }
                  }
                }
              }}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-grid">
      {/* Top Statistics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
        gridColumn: '1 / -1'
      }}>
        <StatCard title="TOTAL LEARNERS" value="124" color="#6b7280" />
        <StatCard title="ACTIVE COURSES" value={activeCourses} color="#6b7280" />
        <StatCard title="COMPLETION RATE" value={`${completionRate}%`} color="#6b7280" />
        <StatCard title="AVG TIME TO COMPLETE" value={avgTimeToComplete} color="#6b7280" />
      </div>

      {/* Main Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        gridColumn: '1 / -1'
      }}>
        {/* Left Column */}
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* Recent Records */}
          <div style={cardStyle}>
            <h3 style={cardHeaderStyle}>Recent Records</h3>
            <div style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <th style={tableHeaderStyle}>Employee</th>
                    <th style={tableHeaderStyle}>Title</th>
                    <th style={tableHeaderStyle}>Region</th>
                    <th style={tableHeaderStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.length > 0 ? recent.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={tableCellStyle}>{r.employee_name}</td>
                      <td style={tableCellStyle}>{r.title || '—'}</td>
                      <td style={tableCellStyle}>{r.region}</td>
                      <td style={tableCellStyle}>
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" style={{...tableCellStyle, textAlign: 'center', color: '#6b7280'}}>
                        No recent records
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Announcements */}
          <div style={cardStyle}>
            <h3 style={cardHeaderStyle}>Announcements</h3>
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '14px'
            }}>
              Team notes / updates
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* Analytics */}
          <div style={cardStyle}>
            <h3 style={cardHeaderStyle}>Analytics</h3>
            <div style={{ marginBottom: '16px', padding: '0 20px' }}>
              <div style={{
                display: 'flex',
                background: '#f3f4f6',
                borderRadius: '8px',
                padding: '4px'
              }}>
                <button 
                  onClick={() => setActiveTab('region')}
                  style={{
                    ...tabButtonStyle,
                    background: activeTab === 'region' ? '#084c8e' : 'transparent',
                    color: activeTab === 'region' ? '#fff' : '#6b7280'
                  }}
                >
                  By Region
                </button>
                <button 
                  onClick={() => setActiveTab('monthly')}
                  style={{
                    ...tabButtonStyle,
                    background: activeTab === 'monthly' ? '#084c8e' : 'transparent',
                    color: activeTab === 'monthly' ? '#fff' : '#6b7280'
                  }}
                >
                  Per Month
                </button>
                <button 
                  onClick={() => setActiveTab('courses')}
                  style={{
                    ...tabButtonStyle,
                    background: activeTab === 'courses' ? '#084c8e' : 'transparent',
                    color: activeTab === 'courses' ? '#fff' : '#6b7280'
                  }}
                >
                  Courses
                </button>
              </div>
            </div>
            <div style={{ padding: '0 20px 20px' }}>
              {renderAnalyticsChart()}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={cardStyle}>
            <h3 style={cardHeaderStyle}>Quick Actions</h3>
            <div style={{ display: 'grid', gap: '8px' }}>
              <button onClick={onAddRecord} style={{
                ...actionButtonStyle,
                background: '#084c8e'
              }}>
                Add Record
              </button>
              <button style={{
                ...actionButtonStyle,
                background: '#084c8e'
              }}>
                ⟲ Sync SharePoint
              </button>
              <button style={{
                ...actionButtonStyle,
                background: '#084c8e'
              }}>
                ⬇ Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        fontSize: '11px',
        fontWeight: '600',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '8px'
      }}>
        {title}
      </div>
      <div style={{
        fontSize: '32px',
        fontWeight: '700',
        color: '#1f2937',
        lineHeight: '1'
      }}>
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const getStatusStyle = (status) => {
    const baseStyle = {
      padding: '4px 8px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '500',
      textTransform: 'capitalize'
    };
    
    switch (status) {
      case 'In Progress':
        return { ...baseStyle, background: '#dbeafe', color: '#1e40af' };
      case 'Completed':
        return { ...baseStyle, background: '#dcfce7', color: '#166534' };
      case 'Blocked':
        return { ...baseStyle, background: '#fed7aa', color: '#c2410c' };
      default:
        return { ...baseStyle, background: '#f3f4f6', color: '#6b7280' };
    }
  };

  return <span style={getStatusStyle(status)}>{status}</span>;
}

// Styles
const cardStyle = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '0',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  overflow: 'hidden'
};

const cardHeaderStyle = {
  margin: '0',
  padding: '20px 20px 16px 20px',
  fontSize: '16px',
  fontWeight: '600',
  color: '#1f2937',
  borderBottom: '1px solid #f3f4f6'
};

const tableHeaderStyle = {
  textAlign: 'left',
  padding: '12px 20px',
  fontSize: '12px',
  fontWeight: '500',
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const tableCellStyle = {
  padding: '12px 20px',
  fontSize: '14px',
  color: '#1f2937'
};

const tabButtonStyle = {
  flex: 1,
  padding: '8px 12px',
  border: 'none',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s ease'
};

const actionButtonStyle = {
  padding: '12px 16px',
  border: 'none',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s ease'
};