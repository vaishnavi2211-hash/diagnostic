import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Microscope } from 'lucide-react';
import { api } from '../api/client.js';
import { PatientLayout } from '../components/patient/PatientLayout.jsx';
import { HorizontalSampleTracker } from '../components/patient/HorizontalSampleTracker.jsx';

export function PatientTrack() {
  const { code } = useParams();
  const [sample, setSample] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code) return;
    (async () => {
      try {
        const data = await api(`/samples/track/${encodeURIComponent(code)}`);
        setSample(data.sample);
        setError('');
      } catch (e) {
        setError(e.data?.error || e.message);
        setSample(null);
      }
    })();
  }, [code]);

  return (
    <PatientLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          to="/patient"
          className="inline-flex text-sm font-semibold text-sky-800 hover:underline"
        >
          ← Dashboard
        </Link>
        {error && <p className="rounded-2xl bg-red-50/90 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">{error}</p>}
        {sample && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/50 dark:border-slate-700/50 bg-white/35 dark:bg-slate-800/60 p-6 shadow-xl backdrop-blur-xl transition-colors md:p-8"
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">Active Sample</p>
            <p className="mt-1 font-mono text-2xl font-bold text-slate-900 dark:text-white">{sample.sampleCode}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Registered on {new Date(sample.createdAt).toLocaleDateString()}
            </p>
            <div className="mt-8 overflow-x-auto pb-2">
              <HorizontalSampleTracker sample={sample} />
            </div>
            <div className="mt-8 flex flex-wrap gap-6 border-t border-white/40 pt-6 text-xs text-slate-600">
              <div>
                <p className="font-semibold text-slate-800">Collected</p>
                <p>{sample.collectedAt ? new Date(sample.collectedAt).toLocaleString() : '—'}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-800">Dispatched</p>
                <p>{sample.dispatchedAt ? new Date(sample.dispatchedAt).toLocaleString() : '—'}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-800">Processing</p>
                <p>{sample.processingAt ? new Date(sample.processingAt).toLocaleString() : '—'}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-800">Completed</p>
                <p>{sample.completedAt ? new Date(sample.completedAt).toLocaleString() : '—'}</p>
              </div>
            </div>
            <div className="mt-8 rounded-2xl border border-white/60 dark:border-slate-700 bg-white/50 dark:bg-slate-800/40 p-4 transition-colors">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Processing Entity</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  <Microscope className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{sample.lab?.name}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{sample.lab?.accreditation}</p>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Rating: {sample.lab?.rating ?? '—'} / 5</p>
            </div>
          </motion.div>
        )}
      </div>
    </PatientLayout>
  );
}
