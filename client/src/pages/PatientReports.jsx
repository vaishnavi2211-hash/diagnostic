import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BadgeCheck, FileText, ShieldCheck } from 'lucide-react';
import { api } from '../api/client.js';
import { PatientLayout } from '../components/patient/PatientLayout.jsx';
import { SkeletonPage } from '../components/Skeleton.jsx';

const card =
  'flex h-full flex-col rounded-3xl border border-white/50 dark:border-slate-700/50 bg-white/35 dark:bg-slate-800/60 p-5 shadow-xl backdrop-blur-xl transition hover:border-sky-300/60 dark:hover:border-sky-700/60 hover:shadow-2xl';

export function PatientReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api('/reports');
        setReports(data.reports || []);
      } catch {
        setReports([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <PatientLayout>
        <SkeletonPage />
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/60 p-6 shadow-xl backdrop-blur-xl transition-colors">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My reports</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">View and download your final laboratory results.</p>
        </div>
        <ul className="grid gap-4 md:grid-cols-2">
          {reports.map((r, i) => {
            const d = new Date(r.createdAt);
            return (
              <motion.li
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link to={`/patient/reports/${r.id}`} className={card}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-primary/10 dark:bg-primary/20 p-2 text-primary dark:text-blue-400">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{r.reportCode}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{d.toLocaleString()}</p>
                        {r.blockchainHash && (
                          <div title={r.blockchainHash} className="mt-1 flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800/50 w-max">
                            <ShieldCheck className="h-3 w-3" />
                            {r.blockchainHash.substring(0, 16)}...
                          </div>
                        )}
                      </div>
                    </div>
                    {r.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/90 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-200">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    )}
                  </div>
                  {r.summary && <p className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{r.summary}</p>}
                </Link>
              </motion.li>
            );
          })}
        </ul>
        {reports.length === 0 && (
          <p className="rounded-3xl border border-dashed border-white/60 dark:border-slate-700/60 bg-white/20 dark:bg-slate-800/40 p-8 text-center text-sm text-slate-600 dark:text-slate-400 backdrop-blur-md transition-colors">
            No reports available yet. Track your ongoing samples.
          </p>
        )}
      </div>
    </PatientLayout>
  );
}
