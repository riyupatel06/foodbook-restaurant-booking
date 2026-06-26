import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api";

export default function RecurringBooking() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    apiGet("/customer/recurring").then(setItems).catch(() => setItems([]));
  }, []);
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <section className="glass-panel-strong rounded-[2rem] p-6 sm:p-8">
        <span className="section-kicker">Repeat reservations</span>
        <h1 className="font-display mt-2 text-4xl font-bold text-white">Weekly / Monthly Reservation</h1>
        <div className="mt-6 grid gap-3">
          {items.map((item) => <div key={item._id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200">{item.frequency} • next run {item.nextRun}</div>)}
        </div>
      </section>
    </div>
  );
}
