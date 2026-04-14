import { motion } from 'framer-motion';
import { Beaker, Check, FileCheck, Package, Truck } from 'lucide-react';

const STEPS = [
  { key: 'collected', label: 'Sample Collected', icon: Package, timeKey: 'collectedAt' },
  { key: 'dispatched', label: 'In Transit', icon: Truck, timeKey: 'dispatchedAt' },
  { key: 'processing', label: 'Processing in Lab', icon: Beaker, timeKey: 'processingAt' },
  { key: 'completed', label: 'Report Ready', icon: FileCheck, timeKey: 'completedAt' },
];

const ORDER = { collected: 0, dispatched: 1, processing: 2, completed: 3 };

function formatTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '—';
  }
}

import React, { useState, useEffect } from 'react';

export function HorizontalSampleTracker({ sample }) {
  const [localStatus, setLocalStatus] = useState(sample?.status || 'collected');

  useEffect(() => {
    setLocalStatus(sample?.status || 'collected');
  }, [sample?.status]);

  useEffect(() => {
    if (localStatus === 'completed') return;
    
    const sequence = ['collected', 'dispatched', 'processing', 'completed'];
    const currentIdx = sequence.indexOf(localStatus);
    
    if (currentIdx > -1 && currentIdx < sequence.length - 1) {
      const timer = setTimeout(() => {
        setLocalStatus(sequence[currentIdx + 1]);
      }, 6000); // Advances automatically every 6 seconds for the demo
      return () => clearTimeout(timer);
    }
  }, [localStatus]);

  const stepIndex = ORDER[localStatus] ?? 0;
  const allDone = localStatus === 'completed';

  return (
    <div className="w-full pt-2 pb-6 px-1 lg:px-6">
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const done = allDone || i <= stepIndex;
          const current = !allDone && i === stepIndex;

          return (
            <React.Fragment key={step.key}>
              {/* Node */}
              <div className="relative flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: current ? 1.15 : 1 }}
                  className={`z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                    done
                      ? 'border-emerald-500 bg-emerald-500 text-white shadow-md'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-300'
                  } ${current ? 'ring-4 ring-emerald-100 dark:ring-emerald-900 shadow-lg shadow-emerald-500/40' : ''}`}
                >
                  {done ? (
                    <Check strokeWidth={3} className="h-4 w-4" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-slate-200 dark:bg-slate-600" />
                  )}
                </motion.div>

                {/* Absolutely positioned label to prevent throwing off the flex line layout */}
                <div className="absolute top-10 left-1/2 -translate-x-1/2 w-max text-center shrink-0">
                  <p
                    className={`text-[11px] font-bold sm:text-xs ${
                      done ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                    {formatTime(sample?.[step.timeKey])}
                  </p>
                </div>
              </div>

              {/* Connecting Line Segment */}
              {i < STEPS.length - 1 && (
                <div
                  className={`relative overflow-hidden h-1.5 flex-1 mx-2 rounded-full transition-colors ${
                    allDone || i < stepIndex ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  {!allDone && i === stepIndex && (
                    <motion.div
                      className="absolute inset-0 w-full bg-emerald-400"
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        ease: 'linear',
                      }}
                    />
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="h-12" /> {/* Spacing to accommodate the absolute labels underneath */}
    </div>
  );
}
