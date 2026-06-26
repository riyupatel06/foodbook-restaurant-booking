import { Link, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { FaCheckCircle, FaDownload, FaEnvelope, FaMobileAlt, FaStar } from "react-icons/fa";

export default function BookingSuccess() {
  const [searchParams] = useSearchParams();
  const restaurant = searchParams.get("restaurant") ?? "Your restaurant";
  const city = searchParams.get("city") ?? "your selected city";
  const tableType = searchParams.get("tableType") ?? "selected table";
  const method = searchParams.get("method") ?? "Razorpay";
  const bookingId = searchParams.get("bookingId") ?? "";
  const invoiceNo = searchParams.get("invoiceNo") ?? "";
  const invoiceParams = new URLSearchParams(searchParams);
  const feedbackParams = new URLSearchParams();
  invoiceParams.set("confirmed", "true");
  if (bookingId) feedbackParams.set("bookingId", bookingId);

  useEffect(() => {
    window.localStorage.removeItem("foodbook-cart");
  }, []);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-120px)] max-w-4xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <section className="glass-panel-strong relative w-full overflow-hidden rounded-[2rem] p-8 text-center sm:p-12">
        <div className="absolute left-10 top-10 h-32 w-32 rounded-full bg-emerald-400/20 blur-3xl float-slow" />
        <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-[#ff9f43]/20 blur-3xl float-slower" />

        <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/15 text-4xl text-emerald-300">
          <FaCheckCircle />
        </div>

        <span className="section-kicker relative mt-6 inline-block">Reservation complete</span>
        <h1 className="relative mt-4 font-display text-5xl font-bold text-white sm:text-6xl">
          Booking Confirmed
        </h1>
        <p className="relative mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
          Your table reservation is confirmed after payment. The cart has been cleared automatically,
          and a text message and email notification have been sent when notification services are configured.
        </p>

        <div className="relative mx-auto mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            <p className="text-slate-400">Restaurant</p>
            <p className="mt-1 font-semibold text-white">{restaurant}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            <p className="text-slate-400">Location</p>
            <p className="mt-1 font-semibold text-white">{city}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            <p className="text-slate-400">Table type</p>
            <p className="mt-1 font-semibold text-white">{tableType}</p>
          </div>
        </div>

        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
          <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200">
            Instant confirmation
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200">
            Priority seating
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200">
            <FaStar className="text-amber-300" />
            Premium dining flow
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200">
            <FaMobileAlt className="text-orange-200" />
            Text sent
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200">
            <FaEnvelope className="text-orange-200" />
            Email sent
          </div>
        </div>

        <div className="relative mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
          Payment method used: <span className="font-semibold text-white">{method}</span>
          {bookingId ? <span className="ml-3">Booking: <span className="font-semibold text-white">{bookingId}</span></span> : null}
          {invoiceNo ? <span className="ml-3">Invoice: <span className="font-semibold text-white">{invoiceNo}</span></span> : null}
        </div>

        <div className="relative mt-10 grid gap-4 sm:grid-cols-3">
          <Link
            to="/my-bookings"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#ff9f43] to-[#ff6b8b] px-5 py-3 font-semibold text-slate-950 transition hover:scale-[1.01]"
          >
            View My Bookings
          </Link>
          <Link
            to={`/invoice?${invoiceParams.toString()}`}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            <FaDownload />
            Download Invoice
          </Link>
          <Link
            to={bookingId ? `/feedback?${feedbackParams.toString()}` : "/feedback"}
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            Leave Feedback
          </Link>
        </div>
      </section>
    </div>
  );
}
