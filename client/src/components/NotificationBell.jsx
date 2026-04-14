import { AnimatePresence, motion } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export function NotificationBell({ dark }) {
  const { notifications, dismissNotification } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`relative rounded-full p-2 shadow-sm ${
          dark
            ? 'border border-white/25 bg-white/10 text-white hover:bg-white/15'
            : 'border border-slate-200 bg-white text-primary hover:bg-slate-50'
        }`}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {notifications.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute right-0 z-50 mt-2 w-80 max-h-96 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-card"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
              <span className="text-sm font-semibold">Alerts</span>
              <button type="button" className="text-muted hover:text-slate-800" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-muted">No alerts yet. We will notify you about samples and reports.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <li key={n._id} className="flex gap-2 p-3 text-sm">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{n.title}</p>
                      <p className="text-muted">{n.message}</p>
                    </div>
                    <button
                      type="button"
                      className="text-xs text-primary"
                      onClick={() => dismissNotification(n._id)}
                    >
                      Dismiss
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
