export default function AdminStatCard({ label, value, hint }) {
  return (
    <div className="rounded-3xl border border-cyan-100 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.24em] text-cyan-500">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        {hint ? <p className="text-xs text-cyan-900/60">{hint}</p> : null}
      </div>
    </div>
  );
}
