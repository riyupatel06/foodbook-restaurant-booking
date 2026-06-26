import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api";

export default function LastMinuteDeals() {
  const [deals, setDeals] = useState([]);
  useEffect(() => {
    apiGet("/customer/deals").then(setDeals).catch(() => setDeals([]));
  }, []);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <section className="glass-panel-strong rounded-[2rem] p-6 sm:p-8">
        <span className="section-kicker">Offers</span>
        <h1 className="font-display mt-2 text-4xl font-bold text-white">User Deals</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {deals.map((deal) => (
            <div key={deal._id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-200">
              <p className="font-semibold text-white">{deal.title}</p>
              <p className="text-sm text-slate-400">{deal.description || "Special deal for users"}</p>
              <p className="mt-3 text-sm text-emerald-300">{deal.discount}% off {deal.minOrder ? `above Rs ${deal.minOrder}` : ""}</p>
              <p className="mt-2 text-xs text-slate-400">{deal.code ? `Code: ${deal.code}` : "No code required"} {deal.validUntil ? `| Valid until ${deal.validUntil}` : ""}</p>
            </div>
          ))}
          {!deals.length ? <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-300 md:col-span-2 xl:col-span-3">No user deals live right now.</div> : null}
        </div>
      </section>
    </div>
  );
}
