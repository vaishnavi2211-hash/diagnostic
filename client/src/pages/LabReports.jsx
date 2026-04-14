import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { api } from '../api/client.js';
import { Layout } from '../components/Layout.jsx';
import { SkeletonPage } from '../components/Skeleton.jsx';

export function LabReports() {
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
      <Layout role="lab">
        <SkeletonPage />
      </Layout>
    );
  }

  return (
    <Layout role="lab">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Issued reports</h1>
          <p className="text-sm text-muted dark:text-slate-400">Sealed PDFs and images uploaded from the Samples workspace.</p>
        </div>
        <ul className="grid gap-4 md:grid-cols-2">
          {reports.map((r, i) => (
            <motion.li
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                to={`/lab/reports/${r.id}`}
                className="flex h-full flex-col rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm transition hover:border-primary/40 dark:hover:border-primary/60"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <p className="font-mono text-sm font-semibold dark:text-slate-200">{r.reportCode}</p>
                </div>
                <p className="mt-2 text-xs text-muted dark:text-slate-400">
                  {r.patientName} · {new Date(r.createdAt).toLocaleString()}
                </p>
                {r.summary && <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{r.summary}</p>}
              </Link>
            </motion.li>
          ))}
        </ul>
        {reports.length === 0 && (
          <p className="text-sm text-muted dark:text-slate-400">No reports uploaded yet.</p>
        )}
      </div>
    </Layout>
  );
}
