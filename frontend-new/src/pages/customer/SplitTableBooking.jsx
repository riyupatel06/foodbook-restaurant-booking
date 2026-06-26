import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";

export default function SplitTableBooking() {
  const [searchParams] = useSearchParams();
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <section className="glass-panel-strong rounded-[2rem] p-6 sm:p-8">
        <span className="section-kicker">Large groups</span>
        <h1 className="font-display mt-2 text-4xl font-bold text-white">Split Table Booking</h1>
        <p className="mt-4 text-slate-300">Use this flow when one table is not enough and the reservation should reserve adjacent tables together.</p>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200">
          Query: {searchParams.toString() || "none"}
        </div>
        <Link to="/booking" className="mt-6 inline-flex rounded-full bg-gradient-to-r from-[#ff9f43] to-[#ff6b8b] px-5 py-3 font-semibold text-slate-950">
          Back to booking flow
        </Link>
      </section>
    </div>
  );
}
