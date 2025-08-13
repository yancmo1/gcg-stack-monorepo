import { Outlet, NavLink } from 'react-router-dom';
import { Menu, Bell, Search, PlusCircle } from 'lucide-react';
import { useState } from 'react';

function Sidebar({ collapsed, setCollapsed }) {
  const nav = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/courses', label: 'Courses' },
    { to: '/learners', label: 'Learners' },
    { to: '/assignments', label: 'Assignments' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/settings', label: 'Settings' }
  ];
  return (
    <aside className={`h-full border-r border-slate-200 bg-white ${collapsed ? 'w-16' : 'w-64'} transition-all`}> 
      <div className="flex items-center justify-between p-4">
        <span className="font-semibold">{collapsed ? 'LMS' : 'Training LMS'}</span>
        <button className="btn btn-ghost p-2" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
          <Menu size={18} />
        </button>
      </div>
      <nav className="px-2 pb-4">
        {nav.map(n => (
          <NavLink key={n.to} to={n.to} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-slate-100 text-primary' : 'text-slate-700 hover:bg-slate-50'}`}>
            <span className="truncate">{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

function Topbar() {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-2">
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input className="input pl-9 w-80" placeholder="Search courses, learners, assignments" aria-label="Global search" />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button className="btn btn-secondary"><PlusCircle size={16}/> Quick Add</button>
        <button className="btn btn-ghost p-2" aria-label="Notifications"><Bell size={18}/></button>
        <div className="h-8 w-8 rounded-full bg-slate-200" aria-label="User avatar" />
      </div>
    </header>
  );
}

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="h-screen grid" style={{ gridTemplateColumns: collapsed ? '64px 1fr' : '256px 1fr', gridTemplateRows: 'auto 1fr' }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex min-w-0 flex-col">
        <Topbar />
        <main className="min-w-0 flex-1 bg-slate-50 p-4">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
