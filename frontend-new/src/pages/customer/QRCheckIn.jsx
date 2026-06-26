import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api";

export default function QRCheckIn() {
  const [bookings, setBookings] = useState([]);
  useEffect(() => {
    apiGet("/bookings").then(setBookings).catch(() => setBookings([]));
  }, []);
  const current = bookings[0];
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <section className="glass-panel-strong rounded-[2rem] p-6 sm:p-8">
        <span className="section-kicker">QR</span>
        <h1 className="font-display mt-2 text-4xl font-bold text-white">QR Check-In & Digital Menu</h1>
        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="rounded-[1.5rem] border border-white/10 bg-white p-6">
            <div className="grid grid-cols-5 gap-1">
              {Array.from({ length: 25 }).map((_, index) => <div key={index} className={`${index % 3 === 0 || index % 7 === 0 ? "bg-slate-950" : "bg-slate-200"} aspect-square`} />)}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-slate-200">
            <p className="font-semibold text-white">Latest booking</p>
            <p className="mt-2 text-sm text-slate-400">{current ? `${current.restaurantName} • ${current.date} • ${current.time}` : "No booking available"}</p>
            <p className="mt-4 text-sm text-slate-400">In a production setup, this QR would mark arrival and open the digital menu for table service.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
