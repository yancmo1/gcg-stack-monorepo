import RecordForm from '../RecordForm';
import React, { useEffect, useMemo, useState, createContext } from 'react';
export const ModalContext = createContext();
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Menu, Bell, Search, PlusCircle } from 'lucide-react';

function Sidebar({ collapsed, setCollapsed }) {
  const nav = [
    { to: '/', label: 'Dashboard' },
    { to: '/learners', label: 'Learners' },
    { to: '/testing', label: 'Testing' },
    { to: '/analytics', label: 'Analytics' },
    // { to: '/', label: 'Records' }, // Remove or comment out Records if not needed
    { to: '/courses', label: 'Courses' },
    { to: '/assignments', label: 'Assignments' },
    { to: '/settings', label: 'Settings' }
  ];
  return (
  <aside className={`h-full border-r border-slate-200 bg-white ${collapsed ? 'w-16' : 'w-64'} transition-all`} style={{ borderTopLeftRadius: 20, borderBottomLeftRadius: 20 }}>
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

// Simulated logged-in user for beta
const TRAINERS = [
  'Yancy Shepherd',
  'Enoch Haney',
  'Theron Tyler'
];

import { useContext } from 'react';
function Topbar({ search, setSearch }) {
  const { openModal } = useContext(ModalContext);
  // For beta, just use the first trainer as logged in
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const loggedInTrainer = TRAINERS[0];
  // Close dropdown when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (!e.target.closest?.('[data-user-menu-root]')) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);
  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-2">
      <div className="flex-1 flex items-center max-w-lg relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2">
          <Search className="h-5 w-5 text-slate-400" />
        </span>
        <input
          className="pl-10 w-full h-10 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200 text-base"
          style={{ minWidth: 260, maxWidth: 420 }}
          placeholder="Search courses, learners, assignments"
          aria-label="Global search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <button
        className="ml-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
        onClick={() => openModal('add')}
        aria-label="Quick Add Learner"
      >
        <PlusCircle className="h-5 w-5" />
        Quick Add
      </button>
      <div className="ml-auto flex items-center gap-2 relative" data-user-menu-root>
        {/* User info dropdown */}
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium focus:outline-none"
          onClick={() => setUserMenuOpen(v => !v)}
          aria-label="User menu"
        >
          <span className="hidden md:inline">{loggedInTrainer}</span>
          <div className="h-8 w-8 rounded-full bg-slate-300 flex items-center justify-center font-bold text-slate-700">
            {loggedInTrainer.split(' ').map(n => n[0]).join('')}
          </div>
        </button>
        {userMenuOpen && (
          <div className="absolute right-0 top-12 bg-white border border-slate-200 rounded-lg shadow-lg min-w-[180px] z-50">
            <div className="px-4 py-3 border-b border-slate-100">
              <div className="font-semibold">{loggedInTrainer}</div>
              <div className="text-xs text-slate-500">Trainer</div>
            </div>
            <div className="px-4 py-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-50" onClick={() => setUserMenuOpen(false)}>
              Profile (beta)
            </div>
            <div className="px-4 py-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-50" onClick={() => setUserMenuOpen(false)}>
              Log out (disabled)
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  // Global modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  // Global search with debounce
  const [rawSearch, setRawSearch] = useState('');
  const [search, setSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setSearch(rawSearch), 250);
    return () => clearTimeout(t);
  }, [rawSearch]);

  // Modal context handlers
  const openModal = (mode = 'add') => {
    setModalMode(mode);
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  return (
    <ModalContext.Provider value={{ openModal, closeModal, isModalOpen, modalMode, search, setSearch: setRawSearch }}>
      <div
        className="grid"
        style={{
          gridTemplateColumns: collapsed ? '64px 1fr' : '256px 1fr',
          gridTemplateRows: 'auto 1fr',
          background: 'transparent',
          border: '8px solid #082f83ff',
          borderRadius: 32,
          boxShadow: '0 4px 24px rgba(37,99,235,0.08)',
          maxWidth: 1200,
          maxHeight: 900,
          margin: '32px auto',
          minHeight: 600,
        }}
      >
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <div className="flex min-w-0 flex-col">
          <Topbar search={rawSearch} setSearch={setRawSearch} />
          <main className="min-w-0 flex-1 bg-slate-50 p-4">
            <div className="mx-auto max-w-7xl" style={{ padding: '32px 24px', minHeight: 'calc(100vh - 120px)', marginTop: 8, marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 24 }}>
              <Outlet />
            </div>
          </main>
          {/* Global Modal for Quick Add */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
                <RecordForm onAdd={closeModal} onCancel={closeModal} />
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalContext.Provider>
  );
}
