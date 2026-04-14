import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BadgeCheck, Download } from 'lucide-react';
import { api, getToken } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Layout } from '../components/Layout.jsx';
import { PatientLayout } from '../components/patient/PatientLayout.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { SkeletonPage } from '../components/Skeleton.jsx';

const glass = 'rounded-3xl border border-white/50 bg-white/30 shadow-xl backdrop-blur-xl';

export function ReportDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const isPatient = user?.role === 'patient';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const d = await api(`/reports/${id}`);
        setData(d);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return isPatient ? (
      <PatientLayout>
        <SkeletonPage />
      </PatientLayout>
    ) : (
      <Layout role="lab">
        <SkeletonPage />
      </Layout>
    );
  }

  if (!data) {
    return isPatient ? (
      <PatientLayout>
        <p className="text-sm text-red-600">Report not found.</p>
      </PatientLayout>
    ) : (
      <Layout role="lab">
        <p className="text-sm text-red-600">Report not found.</p>
      </Layout>
    );
  }

  const { report, analysis } = data;
  const base = user?.role === 'lab' ? '/lab/samples' : '/patient/reports';
  const structured = analysis?.structured || [];

  const downloadFile = async () => {
    const token = getToken();
    const res = await fetch(`/api/reports/${report.id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = report.originalFilename || 'report';
    a.click();
    URL.revokeObjectURL(url);
  };

  const Shell = isPatient ? PatientLayout : Layout;
  const shellProps = isPatient ? {} : { role: 'lab' };

  return (
    <Shell {...shellProps}>
      <div className={`mx-auto max-w-5xl space-y-6 ${isPatient ? '' : ''}`}>
        <Link
          to={base}
          className={`inline-flex items-center gap-1 text-sm font-medium hover:underline ${isPatient ? 'text-sky-800' : 'text-primary'}`}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div
          className={`flex flex-wrap items-start justify-between gap-4 ${isPatient ? `${glass} p-6` : ''}`}
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 font-mono">{report.reportCode}</h1>
              {report.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified report
                </span>
              )}
              {report.sealed && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  Sealed — no edits after upload
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted">
              {report.originalFilename} · {new Date(report.createdAt).toLocaleString()}
            </p>
          </div>
          <button
            type="button"
            onClick={downloadFile}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm ${
              isPatient
                ? 'border border-white/60 bg-white/50 text-slate-800 hover:bg-white/70'
                : 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>

        {report.lab && (
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={isPatient ? `${glass} p-5` : 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'}
          >
            <h2 className="text-sm font-semibold text-slate-900">Processing lab</h2>
            <p className="mt-1 text-lg font-bold text-primary">{report.lab.name}</p>
            <p className="text-sm text-muted">Accreditation: {report.lab.accreditation || '—'}</p>
            <p className="text-sm text-muted">
              Rating: {report.lab.rating != null ? `${report.lab.rating} / 5` : '—'}
            </p>
          </motion.section>
        )}

        {analysis?.summary && (
          <div
            className={
              isPatient
                ? 'rounded-3xl border border-amber-200/60 bg-amber-50/70 p-4 text-sm text-amber-950 backdrop-blur-md'
                : 'rounded-2xl border border-amber-100 bg-amber-50/80 p-4 text-sm text-amber-950'
            }
          >
            <p className="font-semibold text-amber-900">AI summary</p>
            <p className="mt-1">{analysis.summary}</p>
          </div>
        )}

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Results</h2>
          {structured.length === 0 ? (
            <p className="text-sm text-muted">No structured values extracted. Try a clearer scan or consult your clinician.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {structured.map((row, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={
                    isPatient
                      ? `${glass} p-4`
                      : 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">{row.testName}</p>
                    <StatusBadge status={row.status} />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{row.value}</p>
                  {row.reference && <p className="text-xs text-muted">Ref: {row.reference}</p>}
                </motion.div>
              ))}
            </div>
          )}
        </section>

        <p className="text-xs text-muted">
          AI analysis is assistive only. Always consult a qualified doctor about your results.
        </p>
      </div>
    </Shell>
  );
}
