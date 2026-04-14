import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, QrCode } from 'lucide-react';
import { api } from '../api/client.js';
import { Layout } from '../components/Layout.jsx';
import { SkeletonPage } from '../components/Skeleton.jsx';

const STATUSES = ['collected', 'dispatched', 'processing', 'completed'];

export function LabSamples() {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null);
  const [newSample, setNewSample] = useState({ testName: '', patientEmail: '', notes: '' });
  const [qr, setQr] = useState(null);
  const [uploadSampleId, setUploadSampleId] = useState('');
  const [uploadFile, setUploadFile] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api('/samples');
      setSamples(data.samples || []);
    } catch {
      setSamples([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createSample = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await api('/samples', {
        method: 'POST',
        body: JSON.stringify({
          testName: newSample.testName || undefined,
          patientEmail: newSample.patientEmail || undefined,
          notes: newSample.notes || undefined,
        }),
      });
      setModal(null);
      setNewSample({ testName: '', patientEmail: '', notes: '' });
      setQr({ ...data, sampleCode: data.sample.sampleCode });
      await load();
    } catch (err) {
      alert(err.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  };

  const updateStatus = async (id, status) => {
    setBusy(true);
    try {
      await api(`/samples/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (err) {
      alert(err.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  };

  const showQr = async (id) => {
    setBusy(true);
    try {
      const data = await api(`/samples/${id}/qr`);
      const s = samples.find((x) => x.id === id);
      setQr({ ...data, sampleCode: s?.sampleCode });
    } catch (err) {
      alert(err.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  };

  const uploadReport = async (e) => {
    e.preventDefault();
    if (!uploadSampleId || !uploadFile) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      fd.append('sampleId', uploadSampleId);
      const res = await api('/reports/lab', { method: 'POST', body: fd });
      setUploadFile(null);
      setUploadSampleId('');
      alert(`Report ${res.report.reportCode} uploaded and verified.`);
      await load();
    } catch (err) {
      alert(err.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  };

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Samples</h1>
            <p className="text-sm text-muted dark:text-slate-400">QR codes, status updates, and sealed final reports.</p>
          </div>
          <button
            type="button"
            onClick={() => setModal('create')}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" />
            New sample
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-colors">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase text-muted dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Sample ID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {samples.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-primary">{s.sampleCode}</td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-xs capitalize dark:text-slate-200"
                      value={s.status}
                      disabled={busy}
                      onChange={(e) => updateStatus(s.id, e.target.value)}
                    >
                      {STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted dark:text-slate-400">{s.patientId ? 'Linked' : '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted dark:text-slate-400">{new Date(s.updatedAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => showQr(s.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-600 px-2 py-1 text-xs font-medium dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      QR
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadSampleId(s.id)}
                      className="rounded-lg bg-slate-900 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
                      disabled={!s.patientId}
                      title={!s.patientId ? 'Link patient email first' : 'Upload final report'}
                    >
                      Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {samples.length === 0 && (
            <p className="p-6 text-sm text-muted dark:text-slate-400">Create your first sample to generate a QR tracking link.</p>
          )}
        </div>

        {uploadSampleId && (
          <motion.form
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={uploadReport}
            className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm transition-colors"
          >
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Upload final report (PDF / image)</h3>
            <p className="text-xs text-muted dark:text-slate-400">Requires linked patient. Report is sealed after upload.</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
              <button
                type="submit"
                disabled={busy || !uploadFile}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Upload & verify
              </button>
              <button
                type="button"
                className="text-sm text-muted"
                onClick={() => {
                  setUploadSampleId('');
                  setUploadFile(null);
                }}
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </div>

      {modal === 'create' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <motion.form
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onSubmit={createSample}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-xl border border-transparent dark:border-slate-700"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">New sample</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-muted dark:text-slate-400">Test name (optional)</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700/50 dark:text-white px-3 py-2 text-sm"
                  value={newSample.testName}
                  onChange={(e) => setNewSample({ ...newSample, testName: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-muted dark:text-slate-400">Patient email (optional, must be registered)</label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700/50 dark:text-white px-3 py-2 text-sm"
                  value={newSample.patientEmail}
                  onChange={(e) => setNewSample({ ...newSample, patientEmail: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-muted dark:text-slate-400">Notes</label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700/50 dark:text-white px-3 py-2 text-sm"
                  rows={2}
                  value={newSample.notes}
                  onChange={(e) => setNewSample({ ...newSample, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="rounded-xl px-4 py-2 text-sm text-muted" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Generate QR
              </button>
            </div>
          </motion.form>
        </div>
      )}

      {qr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 p-6 text-center shadow-xl border border-transparent dark:border-slate-700"
          >
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Sample {qr.sampleCode}</p>
            {qr.qrDataUrl && <img src={qr.qrDataUrl} alt="QR" className="mx-auto mt-4 w-48 h-48 rounded-lg bg-white p-2" />}
            <p className="mt-2 break-all text-xs text-muted dark:text-slate-400">{qr.trackUrl}</p>
            <button
              type="button"
              className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              onClick={() => setQr(null)}
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </Layout>
  );
}
