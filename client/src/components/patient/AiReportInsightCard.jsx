import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Upload, Bot, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';

function findHemoglobin(structured) {
  if (!Array.isArray(structured)) return null;
  const row = structured.find(
    (r) =>
      String(r.testName || '')
        .toLowerCase()
        .includes('hemoglobin') && !String(r.testName || '').toLowerCase().includes('a1c')
  );
  return row || null;
}

export function AiReportInsightCard({ onUploadClick, refreshKey }) {
  const [insight, setInsight] = useState(null);
  const [reportId, setReportId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await api('/reports');
        const first = list.reports?.[0];
        if (!first) {
          if (!cancelled) {
            setInsight({
              demo: true,
              line: 'Hemoglobin : 10.5 (Low)',
              sub: 'Slightly low, indicating mild anemia.',
            });
            setReportId(null);
          }
          return;
        }
        const detail = await api(`/reports/${first.id}`);
        const structured = detail.analysis?.structured;
        const hb = findHemoglobin(structured);
        if (!cancelled) {
          if (hb) {
            setInsight({
              demo: false,
              line: `${hb.testName}: ${hb.value} (${hb.status?.replace(/_/g, ' ') || '—'})`,
              sub: detail.analysis?.summary || 'Review with your clinician.',
              blockchainHash: detail.report?.blockchainHash,
            });
          } else if (detail.analysis?.summary) {
            setInsight({
              demo: false,
              line: 'Latest analysis',
              sub: detail.analysis.summary,
              blockchainHash: detail.report?.blockchainHash,
            });
          } else {
            setInsight({
              demo: true,
              line: 'Hemoglobin : 10.5 (Low)',
              sub: 'Slightly low, indicating mild anemia.',
            });
          }
          setReportId(first.id);
        }
      } catch {
        if (!cancelled) {
          setInsight({
            demo: true,
            line: 'Hemoglobin : 10.5 (Low)',
            sub: 'Slightly low, indicating mild anemia.',
          });
          setReportId(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-3xl border border-white/50 dark:border-slate-700/50 bg-white/35 dark:bg-slate-800/60 shadow-xl backdrop-blur-xl transition-colors"
    >
      <div className="flex items-center justify-between border-b border-white/40 px-4 py-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI Report Analysis</h3>
        {reportId && (
          <Link
            to={`/patient/reports/${reportId}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:underline"
          >
            View <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <div className="p-4">
        {loading ? (
          <p className="text-sm text-slate-500">Loading insight…</p>
        ) : (
          <>
            <p className={`text-lg font-bold ${insight?.demo ? 'text-orange-600 dark:text-orange-400' : 'text-slate-900 dark:text-slate-100'}`}>
              {insight?.line}
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{insight?.sub}</p>
            {insight?.blockchainHash && (
              <div title={insight.blockchainHash} className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 text-xs font-mono text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50">
                <ShieldCheck className="h-4 w-4" />
                {insight.blockchainHash.substring(0, 18)}...
              </div>
            )}
          </>
        )}
        <button
          type="button"
          onClick={onUploadClick}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:brightness-105"
        >
          <Upload className="h-5 w-5" />
          Upload Report
        </button>
        <Link
          to="/patient/chatbot"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition hover:brightness-105"
        >
          <Bot className="h-5 w-5" />
          Ask AI Chatbot
        </Link>
        {insight?.demo && (
          <p className="mt-3 text-center text-[10px] text-slate-500">Demo values shown until you upload a report.</p>
        )}
      </div>
    </motion.div>
  );
}
