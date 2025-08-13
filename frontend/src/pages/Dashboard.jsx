import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Users, BookOpen, AlarmClockOff } from 'lucide-react';

const API_URL = 'http://localhost:6001/api/records';

const KPICard = ({ title, value, delta, positive, icon: Icon }) => (
  <div className="kpi">
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-600">{title}</span>
      <Icon className="text-slate-400" size={18} />
    </div>
    <div className="kpi-value">{value}</div>
    <div className={`kpi-delta flex items-center gap-1 ${positive ? 'text-success' : 'text-error'}`}>
      {positive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
      <span>{delta}</span>
    </div>
  </div>
);

export default function Dashboard() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({
    employee_name: '', title: '', region: '', start_date: '', completion_date: '', status: '', sort_order: '', notes: '', trainer: '', mtl_completed: '', new_hire_test_score: ''
  });

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(setRecords);
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
      .then(res => res.json())
      .then(() => {
        setForm({ employee_name: '', title: '', region: '', start_date: '', completion_date: '', status: '', sort_order: '', notes: '', trainer: '', mtl_completed: '', new_hire_test_score: '' });
        fetch(API_URL)
          .then(res => res.json())
          .then(setRecords);
      });
  }

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 900, margin: 'auto', padding: 20 }}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <button className="btn btn-primary">Create course</button>
          <button className="btn btn-ghost">Invite learner</button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Active learners" value="1,248" delta="12%" positive icon={Users} />
        <KPICard title="Courses" value="86" delta="3%" positive icon={BookOpen} />
        <KPICard title="Completion rate" value="78%" delta="-2%" positive={false} icon={AlarmClockOff} />
        <KPICard title="Overdue assignments" value="34" delta="5%" positive={false} icon={AlarmClockOff} />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card col-span-2">
          <div className="card-header">Completion trend</div>
          <div className="card-body min-h-[240px] flex items-center justify-center text-slate-500">Chart placeholder</div>
        </div>
        <div className="card">
          <div className="card-header">At-risk learners</div>
          <div className="card-body">
            <ul className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-200" />
                    <div>
                      <div className="text-sm font-medium">Learner {i + 1}</div>
                      <div className="text-xs text-slate-500">2 overdue, 54% avg</div>
                    </div>
                  </div>
                  <button className="btn btn-ghost">View</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-header">Recent activity</div>
        <div className="card-body">
          <ul className="divide-y divide-slate-200">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-slate-200" />
                  <div>
                    <div className="text-sm"><span className="font-medium">Learner {i + 1}</span> submitted <span className="font-medium">Assignment {i + 3}</span></div>
                    <div className="text-xs text-slate-500">12 minutes ago</div>
                  </div>
                </div>
                <button className="btn btn-ghost">Open</button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <form onSubmit={handleSubmit} style={{ marginTop: 30 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {Object.keys(form).map(key => (
            <input key={key} name={key} value={form[key]} onChange={handleChange} placeholder={key.replace(/_/g, ' ')} />
          ))}
        </div>
        <button type="submit" style={{ marginTop: 10 }}>Add Record</button>
      </form>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {Object.keys(form).map(key => (
              <th key={key} style={{ border: '1px solid #ccc', padding: 5 }}>{key.replace(/_/g, ' ')}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((rec, idx) => (
            <tr key={idx}>
              {Object.keys(form).map(key => (
                <td key={key} style={{ border: '1px solid #eee', padding: 5 }}>{rec[key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
