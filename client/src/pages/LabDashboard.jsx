import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardList, FlaskConical, Timer, TrendingUp } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Layout } from '../components/Layout.jsx';
import { SkeletonPage } from '../components/Skeleton.jsx';

export function LabDashboard() {
  const { lab } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [m, s] = await Promise.all([api('/lab/metrics'), api('/samples')]);
        setMetrics(m);
        setSamples(s.samples || []);
      } catch {
        setMetrics(null);
        setSamples([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Layout role="lab">
        <SkeletonPage />
      </Layout>
    );
  }

  const kpis = [
    {
      label: 'Total samples',
      value: metrics?.totalSamples ?? 0,
      icon: FlaskConical,
      tone: 'text-primary',
    },
    {
      label: 'Pending tests',
      value: metrics?.pendingTests ?? 0,
      icon: ClipboardList,
      tone: 'text-amber-600',
    },
    {
      label: 'Completed reports',
      value: metrics?.completedReports ?? 0,
      icon: TrendingUp,
      tone: 'text-emerald-600',
    },
    {
      label: 'Avg turnaround (h)',
      value: metrics?.avgTurnaroundHours != null ? metrics.avgTurnaroundHours : '—',
      icon: Timer,
      tone: 'text-slate-700',
    },
  ];

  return (
    <Layout role="lab">
      <div className="space-y-8">
        <section className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm md:p-8 transition-colors">
          <p className="text-sm font-medium text-primary">Lab workspace</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{lab?.name || 'Your diagnostic center'}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted dark:text-slate-400">
            {lab?.accreditation} · Transparency metrics help patients trust your turnaround and quality.
          </p>
          {metrics?.delayedSamples > 0 && (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-100">
              {metrics.delayedSamples} sample(s) exceeded 72h collected→completed — review logistics.
            </p>
          )}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k, i) => (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm transition-colors"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted dark:text-slate-400">{k.label}</p>
                <k.icon className={`h-5 w-5 ${k.tone}`} />
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100">{k.value}</p>
            </motion.div>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-4 py-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent samples</h2>
            <Link to="/lab/samples" className="text-sm font-semibold text-primary">
              Manage all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase text-muted dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Sample ID</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {samples.slice(0, 8).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-primary">{s.sampleCode}</td>
                    <td className="px-4 py-3 capitalize dark:text-slate-300">{s.status}</td>
                    <td className="px-4 py-3 text-muted dark:text-slate-400">{new Date(s.updatedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {samples.length === 0 && (
              <p className="p-6 text-sm text-muted dark:text-slate-400">No samples yet. Create one from the Samples page.</p>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
