import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Activity, LogOut, Microscope, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { NotificationBell } from './NotificationBell.jsx';

export function Layout({ children, role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => 
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const patientLinks = [
    { to: '/patient', label: 'Dashboard' },
    { to: '/patient/reports', label: 'Reports' },
  ];
  const labLinks = [
    { to: '/lab', label: 'Dashboard' },
    { to: '/lab/samples', label: 'Samples' },
    { to: '/lab/reports', label: 'Reports' },
  ];
  const links = role === 'lab' ? labLinks : patientLinks;

  return (
    <div className="min-h-screen flex flex-col bg-surface dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-semibold text-primary">
            <motion.span
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-card"
            >
              <ShieldCheck className="h-5 w-5" aria-hidden />
            </motion.span>
            <span className="hidden sm:inline text-slate-900 dark:text-slate-100">Transparent Diagnostics</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm font-medium">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 transition-colors ${
                    isActive ? 'bg-primary/10 text-primary dark:bg-blue-900/50 dark:text-blue-400' : 'text-muted dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => {
              const next = theme === 'light' ? 'dark' : 'light';
              setTheme(next);
              document.documentElement.classList.toggle('dark', next === 'dark');
              localStorage.setItem('theme', next);
            }} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
              {theme === 'light' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-300"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              )}
            </button>
            <NotificationBell />
            <span className="hidden text-xs text-muted dark:text-slate-400 md:inline max-w-[140px] truncate">
              {user?.fullName}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1.5 text-xs font-medium text-muted dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-muted">
        <p className="flex items-center justify-center gap-2">
          {role === 'lab' ? <Microscope className="h-3.5 w-3.5" /> : <Activity className="h-3.5 w-3.5" />}
          AI-Powered Transparent Diagnostic System — information only; not a substitute for professional care.
        </p>
      </footer>
    </div>
  );
}
