export default function AdminEntityList({ items, emptyText, renderItem }) {
  if (!items?.length) {
    return <div className="rounded-2xl border border-dashed border-cyan-100 bg-cyan-50 p-6 text-sm text-cyan-900/60">{emptyText}</div>;
  }

  return <div className="grid gap-4">{items.map(renderItem)}</div>;
}
