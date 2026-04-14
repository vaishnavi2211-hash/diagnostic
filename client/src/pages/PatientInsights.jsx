import { motion } from 'framer-motion';
import { Activity, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PatientLayout } from '../components/patient/PatientLayout.jsx';
import { AiReportInsightCard } from '../components/patient/AiReportInsightCard.jsx';

function glassCard(extra = '') {
  return `rounded-3xl border border-white/40 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/60 shadow-xl backdrop-blur-md transition-colors ${extra}`;
}

export function PatientInsights() {
  return (
    <PatientLayout>
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={glassCard('p-6 md:p-8')}
          >
            <div className="flex items-center gap-3 text-slate-900 dark:text-white mb-4">
              <Activity className="h-8 w-8 text-sky-600 dark:text-sky-400" />
              <h1 className="text-2xl font-bold">Health Insights</h1>
            </div>
            <p className="text-base text-slate-600 dark:text-slate-300">
              Upload reports for AI-assisted highlights. Trends and graphs can be added as you build history — always
              confirm results with your doctor.
            </p>
            <div className="mt-8">
              <Link
                to="/patient/reports"
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-sm font-bold text-white shadow hover:bg-sky-700 transition"
              >
                Open My Reports <QrCode className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
        
        <div className="flex w-full shrink-0 flex-col gap-4 xl:w-[360px]">
          <AiReportInsightCard />
        </div>
      </div>
    </PatientLayout>
  );
}
