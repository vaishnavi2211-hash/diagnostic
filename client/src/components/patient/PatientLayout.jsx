import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bot,
  ChevronDown,
  FileText,
  Gem,
  LayoutDashboard,
  LogOut,
  Moon,
  PackageSearch,
  Sun,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { NotificationBell } from '../NotificationBell.jsx';

const TOP_NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/patient', label: 'Dashboard', end: true },
  { to: '/patient/reports', label: 'My Tests' },
  { to: '/patient/insights', label: 'Health Insights' },
  { to: '/patient/awareness', label: 'Awareness' },
];

const SIDEBAR = [
  { to: '/patient', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/patient/reports', label: 'My Reports', icon: FileText },
  { to: '/patient/track/P-123', label: 'Track Samples', icon: PackageSearch },
];

function initials(name) {
  if (!name) return '?';
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || '?';
}

function firstName(name) {
  return name?.trim().split(/\s+/)[0] || 'there';
}

export function PatientLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => 
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
  const menuRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const scrollToPatientSection = (scrollId) => {
    const run = () => document.getElementById(scrollId)?.scrollIntoView({ behavior: 'smooth' });
    if (location.pathname !== '/patient') {
      navigate('/patient');
      setTimeout(run, 80);
    } else {
      run();
    }
  };

  const handleTopNavClick = (e, item) => {
    // Navigation relies on standard routing now
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50/90 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-white/30 bg-slate-900/85 shadow-lg shadow-blue-900/20 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-6">
          <Link to="/patient" className="flex min-w-0 flex-1 items-center gap-3 text-white lg:flex-none">
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-blue-500/40 ring-2 ring-white/30">
              <Gem className="h-5 w-5 text-white" strokeWidth={2} />
            </span>
            <span className="text-sm font-semibold leading-tight tracking-tight text-white/95 sm:block md:text-base">
              AI-Powered Transparent Diagnostic System
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {TOP_NAV.map((item) => (
              <NavLink
                key={`${item.to}-${item.label}`}
                to={item.to}
                end={item.end}
                onClick={(e) => handleTopNavClick(e, item)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-white/15 text-white ring-1 ring-sky-400/50'
                      : 'text-white/75 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={() => {
              const next = theme === 'light' ? 'dark' : 'light';
              setTheme(next);
              document.documentElement.classList.toggle('dark', next === 'dark');
              localStorage.setItem('theme', next);
            }} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20 transition-all hidden sm:flex">
              {theme === 'light' ? (
                <Moon className="h-4 w-4 cursor-pointer" />
              ) : (
                <Sun className="h-4 w-4 text-yellow-300 cursor-pointer" />
              )}
            </button>
            <div className="hidden sm:block">
              <NotificationBell dark />
            </div>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 py-1.5 pl-1.5 pr-3 text-white backdrop-blur hover:bg-white/15"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-rose-400 text-sm font-bold text-white shadow-md">
                  {initials(user?.fullName)}
                </span>
                <span className="hidden text-sm font-semibold sm:inline">
                  HI, {firstName(user?.fullName)}
                </span>
                <ChevronDown className={`h-4 w-4 transition ${menuOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-white/20 bg-slate-900/95 py-1 shadow-xl backdrop-blur-xl"
                  >
                    {SIDEBAR.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={`${item.to}-${item.label}`}
                          to={item.to}
                          onClick={() => setMenuOpen(false)}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white"
                        >
                          <Icon className="h-4 w-4 text-sky-400" />
                          {item.label}
                        </Link>
                      );
                    })}
                    <div className="my-1 border-t border-white/10" />
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold text-red-400 hover:bg-white/10 hover:text-red-300"
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                        navigate('/login');
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col min-h-[calc(100vh-4rem)]">
        {/* Main scroll area */}
        <div className="min-w-0 flex-1 overflow-x-hidden">
          <main className="mx-auto w-full max-w-[1600px] p-4 md:p-6 lg:p-8">{children}</main>
        </div>
        <footer className="mt-auto border-t border-white/20 bg-white/10 px-6 py-4 text-center text-[11px] text-slate-600 backdrop-blur">
          Information only — not a substitute for professional medical care.
        </footer>
      </div>
    </div>
  );
}
