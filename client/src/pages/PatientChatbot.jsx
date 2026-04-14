import { motion } from 'framer-motion';
import { PatientLayout } from '../components/patient/PatientLayout.jsx';
import { AIHealthBotPanel } from '../components/patient/AIHealthBotPanel.jsx';

export function PatientChatbot() {
  return (
    <PatientLayout>
      <div className="mx-auto flex max-w-[1000px] flex-col gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white/40 dark:bg-slate-800/60 p-4 shadow-xl backdrop-blur-md transition-colors"
        >
           <h1 className="text-2xl font-bold text-slate-900 dark:text-white ml-2 mb-4 flex items-center gap-2">Health Assistant</h1>
           <p className="text-sm text-slate-600 ml-2 mb-6 max-w-2xl">
              Ask our AI health bot about your latest test results, dietary tips for identified deficiencies, or general health insights based on your medical profile.
           </p>
           {/* Render the full AI bot panel */}
           <div className="w-full">
              <AIHealthBotPanel id="dedicated-bot" />
           </div>
        </motion.div>
      </div>
    </PatientLayout>
  );
}
