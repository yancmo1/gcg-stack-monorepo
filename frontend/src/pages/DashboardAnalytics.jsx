import React, { useEffect, useState } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend } from 'chart.js';
Chart.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend);

export default function DashboardAnalytics() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:6001/api/records')
      .then(res => res.json())
      .then(setRecords)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // --- Metrics ---
  // Learners per month
  const learnersPerMonth = {};
  // Average training duration
  let totalDuration = 0, durationCount = 0;
  // Average test score
  let totalScore = 0, scoreCount = 0;
  // Learners per region
  const regionCounts = {};
  // Testers per month, Retests per month
  const testersPerMonth = {}, retestsPerMonth = {};

  records.forEach(r => {
    // Learners per month
    if (r.start_date) {
      const month = r.start_date.slice(0,7); // YYYY-MM
      learnersPerMonth[month] = (learnersPerMonth[month]||0)+1;
      testersPerMonth[month] = (testersPerMonth[month]||0)+1;
    }
    // Average training duration
    if (r.start_date && r.completion_date) {
      const start = new Date(r.start_date), end = new Date(r.completion_date);
      const days = (end-start)/(1000*60*60*24);
      if (!isNaN(days) && days>=0) {
        totalDuration += days;
        durationCount++;
      }
    }
    // Average test score
    if (r.new_hire_test_score) {
      totalScore += Number(r.new_hire_test_score);
      scoreCount++;
    }
    // Learners per region
    if (r.region) regionCounts[r.region] = (regionCounts[r.region]||0)+1;
    // Retests per month
    if (r.status && r.status.toLowerCase().includes('retest') && r.completion_date) {
      const month = r.completion_date.slice(0,7);
      retestsPerMonth[month] = (retestsPerMonth[month]||0)+1;
    }
  });

  // --- Chart Data ---
  const months = Array.from(new Set([...Object.keys(learnersPerMonth), ...Object.keys(testersPerMonth), ...Object.keys(retestsPerMonth)])).sort();
  const learnersPerMonthData = months.map(m => learnersPerMonth[m]||0);
  const testersPerMonthData = months.map(m => testersPerMonth[m]||0);
  const retestsPerMonthData = months.map(m => retestsPerMonth[m]||0);
  const regionLabels = Object.keys(regionCounts);
  const regionData = regionLabels.map(r => regionCounts[r]);

  return (
    <div style={{maxWidth: 1200, margin:'auto'}}>
      <h2 style={{fontSize:'2rem', fontWeight:700, marginBottom:'2rem'}}>Analytics Dashboard</h2>
      {loading && <div>Loading…</div>}
      {error && <div style={{color:'red'}}>{error}</div>}
      {!loading && !error && (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(480px,1fr))', gap:'2rem', alignItems:'start'}}>
          <div style={{background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', padding:'1.5rem'}}>
            <h4>Learners per Month</h4>
            <Bar data={{
              labels: months,
              datasets: [{ label: 'Learners', data: learnersPerMonthData, backgroundColor: '#3b82f6' }]
            }} options={{responsive:true, plugins:{legend:{display:false}}}} />
          </div>
          <div style={{background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', padding:'1.5rem'}}>
            <h4>Average Training Duration (days)</h4>
            <div style={{fontSize:'2.5rem', fontWeight:700, color:'#10b981', textAlign:'center'}}>{durationCount ? (totalDuration/durationCount).toFixed(1) : 'N/A'}</div>
          </div>
          <div style={{background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', padding:'1.5rem'}}>
            <h4>Average New Hire Test Score</h4>
            <div style={{fontSize:'2.5rem', fontWeight:700, color:'#6366f1', textAlign:'center'}}>{scoreCount ? (totalScore/scoreCount).toFixed(1) : 'N/A'}</div>
          </div>
          <div style={{background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', padding:'1.5rem'}}>
            <h4>Learners per Region</h4>
            <Pie data={{
              labels: regionLabels,
              datasets: [{ data: regionData, backgroundColor: ['#3b82f6','#10b981','#f59e42','#6366f1','#ef4444'] }]
            }} options={{responsive:true}} />
          </div>
          <div style={{background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', padding:'1.5rem'}}>
            <h4>Testers per Month</h4>
            <Line data={{
              labels: months,
              datasets: [{ label: 'Testers', data: testersPerMonthData, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.2)', tension:0.3, fill:true }]
            }} options={{responsive:true, plugins:{legend:{display:false}}}} />
          </div>
          <div style={{background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', padding:'1.5rem'}}>
            <h4>Retests per Month</h4>
            <Bar data={{
              labels: months,
              datasets: [{ label: 'Retests', data: retestsPerMonthData, backgroundColor: '#ef4444' }]
            }} options={{responsive:true, plugins:{legend:{display:false}}}} />
          </div>
        </div>
      )}
    </div>
  );
}
