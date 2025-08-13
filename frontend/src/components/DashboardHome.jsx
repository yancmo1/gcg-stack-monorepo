import React, { useMemo } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function DashboardHome({ records }) {
  const recent = useMemo(() => [...records].sort((a,b)=> new Date(b.id?b.id:0) - new Date(a.id?a.id:0)).slice(0,10), [records]);

  // Region distribution
  const regionCounts = {};
  const monthCounts = {};
  records.forEach(r => {
    if (r.region) regionCounts[r.region] = (regionCounts[r.region]||0)+1;
    if (r.start_date) {
      const m = r.start_date.slice(0,7);
      monthCounts[m] = (monthCounts[m]||0)+1;
    }
  });
  const regionLabels = Object.keys(regionCounts);
  const regionData = regionLabels.map(l=>regionCounts[l]);
  const monthLabels = Object.keys(monthCounts).sort().slice(-6); // last 6 months
  const monthData = monthLabels.map(m=>monthCounts[m]);

  return (
    <div className="container" style={{display:'grid', gap:'1.5rem'}}>
      <h2 style={{margin:'0.5rem 0 0.5rem', fontSize:28}}>Dashboard</h2>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'1rem'}}>
        <div style={card}><h4 style={cardTitle}>Recent Records</h4><div style={{maxHeight:240, overflowY:'auto'}}>
          <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
            <thead><tr>{['Employee','Title','Region','Status'].map(h=> <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {recent.map((r,i)=> <tr key={i} style={{background:i%2?'#fafafa':'#fff'}}>
                <td style={td}>{r.employee_name}</td>
                <td style={td}>{r.title}</td>
                <td style={td}>{r.region}</td>
                <td style={td}>{r.status}</td>
              </tr>)}
            </tbody>
          </table>
        </div></div>
        <div style={card}><h4 style={cardTitle}>Learners by Region</h4>
          {regionLabels.length ? <Pie data={{labels:regionLabels,datasets:[{data:regionData, backgroundColor:['#3b82f6','#10b981','#6366f1','#f59e0b','#ef4444']}]}} options={{plugins:{legend:{position:'bottom'}}}} /> : <Empty/>}
        </div>
        <div style={card}><h4 style={cardTitle}>Learners per Month</h4>
          {monthLabels.length ? <Bar data={{labels:monthLabels,datasets:[{label:'Learners', data:monthData, backgroundColor:'#00699b'}]}} options={{plugins:{legend:{display:false}}, scales:{y:{ticks:{precision:0}}}}} /> : <Empty/>}
        </div>
      </div>
    </div>
  );
}

function Empty(){return <div style={{padding:'1rem',fontSize:12,color:'#666'}}>No data</div>}
const card = { background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:'1rem', boxShadow:'0 2px 6px rgba(0,0,0,0.04)', display:'flex', flexDirection:'column'};
const cardTitle = {margin:'0 0 0.75rem', fontSize:14, fontWeight:700, letterSpacing:'.5px', textTransform:'uppercase', color:'#374151'};
const th = {textAlign:'left', padding:'6px 8px', fontSize:11, fontWeight:600, borderBottom:'1px solid #e5e7eb', position:'sticky', top:0, background:'#f9fafb'};
const td = {padding:'6px 8px', whiteSpace:'nowrap', textOverflow:'ellipsis', overflow:'hidden', maxWidth:140};
