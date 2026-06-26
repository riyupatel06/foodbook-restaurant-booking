import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaBell, FaCheckCircle, FaClock, FaExclamationCircle } from "react-icons/fa";
import { apiGet, getToken } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

function statusIcon(status) {
  if (status === "sent") return <FaCheckCircle className="text-emerald-300" />;
  if (status === "failed") return <FaExclamationCircle className="text-rose-300" />;
  return <FaClock className="text-orange-200" />;
}

export default function Notifications() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      const timer = window.setTimeout(() => {
        setNotifications([]);
        setLoading(false);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      setLoading(true);
      apiGet("/notifications", getToken())
        .then(setNotifications)
        .catch(() => setNotifications([]))
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated]);

  return (
    <div className="mx-auto min-h-[calc(100vh-120px)] max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="glass-panel-strong rounded-[2rem] p-6 sm:p-8">
        <span className="section-kicker">Inbox</span>
        <h1 className="font-display mt-2 text-5xl font-bold text-white sm:text-6xl">Notifications</h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
          Booking confirmations, reminders, payment updates, and restaurant messages appear here.
        </p>

        {!isAuthenticated ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-300">
            Please login to view notifications.
          </div>
        ) : null}

        {isAuthenticated && loading ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-300">
            Loading notifications...
          </div>
        ) : null}

        {isAuthenticated && !loading && notifications.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
            <FaBell className="mx-auto text-3xl text-slate-500" />
            <p className="mt-4 font-semibold text-white">No notifications yet</p>
            <p className="mt-2 text-sm text-slate-400">Your booking updates will show here automatically.</p>
          </div>
        ) : null}

        <div className="mt-8 grid gap-4">
          {notifications.map((item) => {
            const booking = item.bookingId && typeof item.bookingId === "object" ? item.bookingId : null;
            return (
              <article key={item._id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-start gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/5">
                    {statusIcon(item.status)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="font-semibold text-white">{booking?.restaurantName ?? "RestorantBooking update"}</h2>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.14em] text-slate-400">
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{item.message}</p>
                    {booking ? (
                      <p className="mt-3 text-xs text-slate-500">
                        {booking.date} {booking.time ? `at ${booking.time}` : ""} {booking.tableId ? `- Table ${booking.tableId}` : ""}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <Link to="/" className="mt-8 inline-flex rounded-full border border-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/10">
          Back to Home
        </Link>
      </section>
    </div>
  );
}
