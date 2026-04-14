const MAP = {
  normal: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  moderate: 'bg-amber-50 text-amber-900 ring-amber-200',
  high: 'bg-red-50 text-red-800 ring-red-200',
  low: 'bg-amber-50 text-amber-900 ring-amber-200',
  critical_high: 'bg-red-100 text-red-900 ring-red-300',
  critical_low: 'bg-red-100 text-red-900 ring-red-300',
  unknown: 'bg-slate-100 text-slate-700 ring-slate-200',
};

export function StatusBadge({ status }) {
  const cls = MAP[status] || MAP.unknown;
  const label = (status || 'unknown').replace(/_/g, ' ');
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${cls}`}>
      {label}
    </span>
  );
}
