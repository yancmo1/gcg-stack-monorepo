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

function fetchSummary() {
  return fetch(`${window.__API_BASE__}/metrics/summary`).then(r => r.json());
}


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
    <div className="dashboard space-y-8">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <KPI title="Total Records" value={summary?.totalRecords ?? '...'} />
        <KPI title="Completed" value={summary?.completed ?? '...'} />
        <KPI title="In Progress" value={summary?.inProgress ?? '...'} />
        <KPI title="Overdue" value={summary?.overdue ?? '...'} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <h4 className="font-semibold mb-2">Tests Last 30 Days</h4>
          <BarChart data={tests?.last30Days || {}} />
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center">
          <h4 className="font-semibold mb-2">Pass Rate (Last 30 Days)</h4>
          <div className="text-4xl font-bold text-green-600">{tests ? `${tests.passRateLast30.toFixed(1)}%` : '...'}</div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <h4 className="font-semibold mb-4">Recent Tests</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="px-3 py-2 text-left">Employee</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Score</th>
                <th className="px-3 py-2 text-left">Pass</th>
                <th className="px-3 py-2 text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {tests?.recent?.map((t, i) => (
                <tr key={t.id || i} className="border-b last:border-b-0 hover:bg-slate-50">
                  <td className="px-3 py-2">{t.employee_name}</td>
                  <td className="px-3 py-2">{t.test_type}</td>
                  <td className="px-3 py-2">{t.test_date}</td>
                  <td className="px-3 py-2">{t.score ?? ''}</td>
                  <td className="px-3 py-2">{t.passed ? '✅' : '❌'}</td>
                  <td className="px-3 py-2">{t.notes}</td>
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
    <div className="bg-white rounded-xl shadow flex flex-col items-center justify-center p-6">
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-slate-500 text-sm font-medium">{title}</div>
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(...Object.values(data || { Initial: 0, Retest: 0 }), 1);
  return (
    <div className="space-y-2">
      {Object.entries(data).map(([type, val]) => (
        <div key={type} className="flex items-center gap-2">
          <span className="w-20 text-slate-600 text-xs font-medium">{type}</span>
          <div className="flex-1 bg-slate-200 rounded h-4 relative">
            <div className="bg-blue-500 h-4 rounded" style={{ width: `${(val / max) * 100}%` }} />
          </div>
          <span className="w-8 text-right text-xs font-semibold">{val}</span>
        </div>
      ))}
    </div>
  );
}
