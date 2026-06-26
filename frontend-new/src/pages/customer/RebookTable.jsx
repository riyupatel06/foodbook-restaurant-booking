import { useEffect, useState } from "react";
import { FaRedo } from "react-icons/fa";
import { apiGet, apiPost, getToken } from "../../lib/api";

export default function RebookTable() {
  const [bookings, setBookings] = useState([]);
  useEffect(() => {
    apiGet("/customer/rebookings")
      .then((response) => {
        const unique = Array.from(
          new Map(
            response.map((booking) => {
              const key = [
                booking.restaurantName ?? "",
                booking.date ?? "",
                booking.time ?? "",
                booking.tableId ?? "",
              ].join("|");
              return [key, booking];
            }),
          ).values(),
        );

        setBookings(unique);
      })
      .catch(() => setBookings([]));
  }, []);

  const rebook = async (booking) => {
    await apiPost(`/customer/rebookings/${booking._id}`, { date: booking.date, time: booking.time }, getToken());
    const refreshed = await apiGet("/customer/rebookings").catch(() => []);
    const unique = Array.from(
      new Map(
        refreshed.map((item) => {
          const key = [item.restaurantName ?? "", item.date ?? "", item.time ?? "", item.tableId ?? ""].join("|");
          return [key, item];
        }),
      ).values(),
    );
    setBookings(unique);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <section className="glass-panel-strong rounded-[2rem] p-6 sm:p-8">
        <span className="section-kicker">One-click booking</span>
        <h1 className="font-display mt-2 text-4xl font-bold text-white">Book Previous Table Again</h1>
        <div className="mt-6 grid gap-3">
          {bookings.map((booking) => (
            <div key={booking._id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200">
              <div>
                <p className="font-semibold text-white">{booking.restaurantName}</p>
                <p className="text-sm text-slate-400">{booking.date} • {booking.time} • {booking.tableId}</p>
              </div>
              <button onClick={() => rebook(booking)} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ff9f43] to-[#ff6b8b] px-4 py-2 font-semibold text-slate-950">
                <FaRedo /> Rebook
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
