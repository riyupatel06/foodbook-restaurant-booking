export default function AdminSectionTitle({ kicker, title, description }) {
  return (
    <div className="space-y-2">
      {kicker ? <p className="text-xs uppercase tracking-[0.35em] text-cyan-500">{kicker}</p> : null}
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      {description ? <p className="max-w-3xl text-sm leading-6 text-cyan-900/65">{description}</p> : null}
    </div>
  );
}
