import { useEffect, useState } from "react";
import { FaGift } from "react-icons/fa";
import { apiGet, apiPost, getToken } from "../../lib/api";

export default function SpinWin() {
  const [coupons, setCoupons] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiGet("/customer/spin").then(setCoupons).catch(() => setCoupons([]));
  }, []);

  const spin = async () => {
    const coupon = await apiPost("/customer/spin", {}, getToken());
    setCoupons((list) => [coupon, ...list]);
    setMessage(`You won ${coupon.title} with code ${coupon.code}`);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <section className="glass-panel-strong rounded-[2rem] p-6 sm:p-8">
        <span className="section-kicker">Promotions</span>
        <h1 className="font-display mt-2 text-4xl font-bold text-white">Spin & Win Coupons</h1>
        <button onClick={spin} className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ff9f43] to-[#ff6b8b] px-5 py-3 font-semibold text-slate-950">
          <FaGift /> Spin the wheel
        </button>
        {message ? <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200">{message}</p> : null}
        <div className="mt-6 grid gap-3">
          {coupons.map((coupon) => (
            <div key={coupon._id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              {coupon.title} • {coupon.code} • {coupon.discount}% off
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
