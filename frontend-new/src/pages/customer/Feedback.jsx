import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiGet, apiPost, getToken } from "../../lib/api";

export default function Feedback() {
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState({
    bookingId: searchParams.get("bookingId") ?? "",
    foodRating: "5",
    serviceRating: "5",
    comment: "",
  });

  useEffect(() => {
    apiGet("/bookings", getToken())
      .then(setBookings)
      .catch(() => setBookings([]));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setStatus(null);
    try {
      await apiPost(
        "/feedback",
        {
          bookingId: form.bookingId,
          foodRating: Number(form.foodRating),
          serviceRating: Number(form.serviceRating),
          comment: form.comment,
        },
        getToken(),
      );
      setStatus({ type: "success", message: "Thanks. Your feedback was sent successfully." });
      setForm((current) => ({ ...current, comment: "" }));
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Could not send feedback" });
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-120px)] max-w-4xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <section className="glass-panel-strong w-full rounded-[2rem] p-6 sm:p-8">
        <span className="section-kicker">Feedback</span>
        <h1 className="font-display mt-2 text-5xl font-bold text-white sm:text-6xl">Share Your Experience</h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
          Please choose a booking and leave feedback for food and service.
        </p>

        {status ? (
          <div
            className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
              status.type === "success"
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                : "border-rose-400/30 bg-rose-400/10 text-rose-200"
            }`}
          >
            {status.message}
          </div>
        ) : null}

        <form onSubmit={submit} className="mt-8 grid gap-4">
          <select
            value={form.bookingId}
            onChange={(event) => setForm((current) => ({ ...current, bookingId: event.target.value }))}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
            required
          >
            <option value="">Select booking</option>
            {bookings.map((booking) => (
              <option key={booking._id} value={booking._id}>
                {booking.restaurantName} - {booking.date} - {booking.time}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            max="5"
            value={form.foodRating}
            onChange={(event) => setForm((current) => ({ ...current, foodRating: event.target.value }))}
            placeholder="Food Rating (1-5)"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
            required
          />
          <input
            type="number"
            min="1"
            max="5"
            value={form.serviceRating}
            onChange={(event) => setForm((current) => ({ ...current, serviceRating: event.target.value }))}
            placeholder="Service Rating (1-5)"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
            required
          />
          <textarea
            value={form.comment}
            onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))}
            placeholder="Write your feedback"
            rows={5}
            className="w-full rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
          />

          <button className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#ff9f43] to-[#ff6b8b] px-6 py-3 font-semibold text-slate-950 transition hover:scale-[1.01]">
            Submit Feedback
          </button>

          <Link
            to="/restaurants"
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            Back to Restaurants
          </Link>
        </form>
      </section>
    </div>
  );
}
