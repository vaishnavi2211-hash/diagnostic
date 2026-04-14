import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PatientLayout } from '../components/patient/PatientLayout.jsx';

function glassCard(extra = '') {
  return `rounded-3xl border border-white/40 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/60 shadow-xl backdrop-blur-md transition-colors ${extra}`;
}

export function PatientAwareness() {
  return (
    <PatientLayout>
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={glassCard('p-6 md:p-10')}
        >
          <div className="flex items-center gap-3 text-slate-900 dark:text-white mb-6">
            <BookOpen className="h-8 w-8 text-sky-600 dark:text-sky-400" />
            <h1 className="text-2xl font-bold">Health Awareness</h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
            Preventive panels (diabetes, heart, thyroid) help catch shifts early before symptoms appear. 
            Understanding your diagnostic results empowers you to manage your health proactively. 
          </p>
          <div className="mt-8 space-y-4">
             <div className="p-5 rounded-2xl bg-orange-50/80 border border-orange-200">
                <h3 className="font-bold text-orange-900 mb-2">Recommended Actions</h3>
                <ul className="list-disc pl-5 text-sm text-orange-800 space-y-1">
                   <li>Schedule annual complete blood count (CBC) screenings.</li>
                   <li>Monitor your blood glucose values if there's family history of diabetes.</li>
                   <li>Consult your clinician regarding targeted health profiles.</li>
                </ul>
             </div>
          </div>
          <div className="mt-8">
            <Link
              to="/home"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow hover:bg-orange-600 transition"
            >
              Browse Home Packages
            </Link>
          </div>
        </motion.div>
      </div>
    </PatientLayout>
  );
}
