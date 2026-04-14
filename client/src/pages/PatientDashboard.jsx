import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, FlaskConical, QrCode } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PatientLayout } from '../components/patient/PatientLayout.jsx';
import { HorizontalSampleTracker } from '../components/patient/HorizontalSampleTracker.jsx';
import { AIHealthBotPanel } from '../components/patient/AIHealthBotPanel.jsx';
import { AiReportInsightCard } from '../components/patient/AiReportInsightCard.jsx';
import { SkeletonPage } from '../components/Skeleton.jsx';

function glassCard(className = '') {
  return `rounded-3xl border border-white/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/60 shadow-xl backdrop-blur-xl transition-colors ${className}`;
}

function LabIllustration() {
  return (
    <div
      className={`${glassCard('relative overflow-hidden p-8')} bg-gradient-to-br from-sky-100/80 via-white/40 to-orange-50/60 dark:from-slate-800/80 dark:via-slate-800/40 dark:to-slate-800/60`}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-sky-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 left-10 h-36 w-36 rounded-full bg-orange-200/40 blur-3xl" />
      <div className="relative flex flex-wrap items-end justify-center gap-6">
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="flex h-28 w-20 flex-col items-center justify-end rounded-b-3xl rounded-t-lg border-2 border-sky-200/80 bg-gradient-to-b from-sky-100/90 to-sky-200/50 shadow-lg"
        >
          <div className="mb-2 h-10 w-10 rounded-full bg-sky-400/40" />
        </motion.div>
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          className="flex h-36 w-24 flex-col items-center justify-end rounded-b-3xl rounded-t-md border-2 border-orange-200/90 bg-gradient-to-b from-orange-50 to-orange-100/70 shadow-lg"
        >
          <div className="mb-3 h-14 w-14 rounded-full bg-orange-300/50" />
        </motion.div>
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
          className="flex h-24 w-16 items-end justify-center rounded-b-2xl rounded-t-full border-2 border-indigo-200 bg-gradient-to-b from-indigo-50 to-indigo-100/60 shadow-md"
        >
          <FlaskConical className="mb-2 h-10 w-10 text-indigo-400/90" />
        </motion.div>
      </div>
      <p className="relative mt-6 text-center text-xs font-medium text-slate-600 dark:text-slate-400">
        Laboratory quality · Traceable samples · Verified reporting
      </p>
    </div>
  );
}

export function PatientDashboard() {
  const { user, notifications } = useAuth();
  const [samples, setSamples] = useState([]);
  const [reportsCount, setReportsCount] = useState(0);
  const [claim, setClaim] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [insightRefresh, setInsightRefresh] = useState(0);
  const uploadRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const [sData, rData] = await Promise.all([api('/samples/patient'), api('/reports')]);
      setSamples(sData.samples || []);
      setReportsCount(rData.reports?.length ?? 0);
    } catch {
      setSamples([]);
      setReportsCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const claimSample = async (e) => {
    e.preventDefault();
    if (!claim.trim()) return;
    
    // Intelligently extract the exact SMP code if the user pasted an entire lab table row accidentally by selecting.
    const match = claim.match(/SMP-[A-Z0-9]+-[A-Z0-9]+/i);
    const validCode = match ? match[0].toUpperCase() : claim.trim().toUpperCase();

    setBusy(true);
    try {
      await api('/samples/claim', {
        method: 'POST',
        body: JSON.stringify({ sampleCode: validCode }),
      });
      setClaim('');
      await load();
    } catch (err) {
      alert(err.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  };

  const runUploadWithFile = async (file) => {
    if (!file) return;
    setBusy(true);
    setUploadMsg('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api('/reports/patient', { method: 'POST', body: fd });
      if (uploadRef.current) uploadRef.current.value = '';
      setUploadMsg('Upload complete.');
      setInsightRefresh((k) => k + 1);
      await load();
    } catch (err) {
      setUploadMsg(err.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  };

  const onFileSelected = () => {
    const file = uploadRef.current?.files?.[0];
    if (file) runUploadWithFile(file);
  };

  const activeTests = samples.filter((s) => s.status !== 'completed').length;
  const riskAlerts = notifications.filter((n) => n.type === 'risk_alert').length;
  const featured =
    samples.find((s) => s.status !== 'completed') || samples[0] || null;

  const firstName = user?.fullName?.trim().split(/\s+/)[0] || 'there';

  if (loading) {
    return (
      <PatientLayout>
        <SkeletonPage />
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <input
        ref={uploadRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={onFileSelected}
      />

      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 xl:flex-row xl:items-start">
        {/* Main column */}
        <div className="min-w-0 flex-1 space-y-6">
          {/* Welcome + stats */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={glassCard('p-6 md:p-8')}
          >
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">
              Welcome, {firstName}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Stay updated with your health journey.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-sky-100/80 dark:bg-sky-900/20 px-4 py-4 ring-1 ring-sky-200/60 dark:ring-sky-700/30 transition-colors">
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-900/70 dark:text-sky-300/80">Active tests</p>
                <p className="mt-1 text-3xl font-black text-sky-900 dark:text-sky-100">{activeTests}</p>
              </div>
              <div className="rounded-2xl bg-white/70 dark:bg-slate-700/40 px-4 py-4 ring-1 ring-white/80 dark:ring-slate-600/50 transition-colors">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Reports ready</p>
                <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{reportsCount}</p>
              </div>
              <div className="rounded-2xl bg-orange-50/90 dark:bg-orange-900/10 px-4 py-4 ring-1 ring-orange-200/70 dark:ring-orange-800/30 transition-colors">
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-900/70 dark:text-orange-400/80">Risk alerts</p>
                <p className="mt-1 text-3xl font-black text-orange-700 dark:text-orange-400">{riskAlerts}</p>
              </div>
            </div>
          </motion.section>

          {/* Sample tracking */}
          <motion.section
            id="track-samples"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={`${glassCard('p-6 md:p-8')} scroll-mt-28`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sample Tracking</h2>
              {featured && (
                <Link
                  to={`/patient/track/${encodeURIComponent(featured.sampleCode)}`}
                  className="inline-flex items-center gap-1 rounded-full bg-sky-600 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-sky-700"
                >
                  View details
                </Link>
              )}
            </div>

            {featured ? (
              <>
                <p className="mt-2 font-mono text-sm text-sky-800 dark:text-sky-300">{featured.sampleCode}</p>
                <div className="mt-8 overflow-x-auto pb-2">
                  <HorizontalSampleTracker sample={featured} />
                </div>
                <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/40 dark:border-slate-600/50 pt-6">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    Processing at:{' '}
                    <strong className="text-slate-900 dark:text-white">{featured.lab?.name || 'Your lab'}</strong>
                    {featured.lab?.accreditation ? (
                      <span className="text-slate-500 dark:text-slate-400"> ({featured.lab.accreditation})</span>
                    ) : null}
                  </p>
                  <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800/50">
                    On track
                  </span>
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                No active sample. Link a code from your slip to see the live timeline.
              </p>
            )}

            <form onSubmit={claimSample} className="mt-6 flex flex-col gap-2 border-t border-white/30 dark:border-slate-600/50 pt-6 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Link sample code</label>
                <input
                  className="mt-1 w-full rounded-2xl border border-white/60 dark:border-slate-600 bg-white/50 dark:bg-slate-700/50 px-4 py-2.5 font-mono text-sm uppercase outline-none ring-sky-400/20 focus:ring-2 dark:text-white"
                  placeholder="SMP-..."
                  value={claim}
                  onChange={(e) => setClaim(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg disabled:opacity-50"
              >
                Link
              </button>
            </form>
          </motion.section>

          {/* Extracted Insights and Awareness sections to dedicated pages */}

          <LabIllustration />
        </div>

        {/* Right column */}
        <div className="flex w-full shrink-0 flex-col gap-4 xl:w-[360px] xl:sticky xl:top-24">
          <AiReportInsightCard
            refreshKey={insightRefresh}
            onUploadClick={() => uploadRef.current?.click()}
          />
          {uploadMsg && (
            <p className="rounded-xl bg-white/60 px-3 py-2 text-center text-xs text-slate-700 ring-1 ring-white/60">
              {uploadMsg}
            </p>
          )}
        </div>
      </div>
    </PatientLayout>
  );
}
