import { CheckCircle2, Circle, Package, Truck, FlaskConical, FileCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const STEPS = [
  { key: 'collected', label: 'Collected', icon: Package },
  { key: 'dispatched', label: 'Dispatched', icon: Truck },
  { key: 'processing', label: 'Processing', icon: FlaskConical },
  { key: 'completed', label: 'Completed', icon: FileCheck },
];

const ORDER = { collected: 0, dispatched: 1, processing: 2, completed: 3 };

export function SampleTimeline({ status, compact }) {
  const idx = ORDER[status] ?? 0;
  return (
    <ol className={`flex ${compact ? 'flex-col gap-2' : 'flex-wrap gap-4 md:gap-6'}`}>
      {STEPS.map((step, i) => {
        const done = i <= idx;
        const Icon = step.icon;
        return (
          <motion.li
            key={step.key}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-2"
          >
            {done ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden />
            ) : (
              <Circle className="h-5 w-5 shrink-0 text-slate-300" aria-hidden />
            )}
            <Icon className={`h-4 w-4 shrink-0 ${done ? 'text-primary' : 'text-slate-300'}`} aria-hidden />
            <span className={`text-sm font-medium ${done ? 'text-slate-900' : 'text-slate-400'}`}>
              {step.label}
            </span>
          </motion.li>
        );
      })}
    </ol>
  );
}
