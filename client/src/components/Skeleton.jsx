import { motion } from 'framer-motion';

export function SkeletonPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <motion.div
        className="h-10 w-64 rounded-xl bg-slate-200/80"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      />
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="h-28 rounded-2xl bg-slate-200/70"
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.1 }}
          />
        ))}
      </div>
      <motion.div
        className="h-64 rounded-2xl bg-slate-200/60"
        animate={{ opacity: [0.45, 0.85, 0.45] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      />
    </div>
  );
}
