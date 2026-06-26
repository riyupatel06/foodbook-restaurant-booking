import { useEffect, useState } from "react";
import { FaCoins, FaGift } from "react-icons/fa";
import { apiGet, apiPost, getToken } from "../../lib/api";

export default function LoyaltyPoints() {
  const [account, setAccount] = useState({ points: 0, tier: "Bronze", lifetimeSpent: 0 });
  const [status, setStatus] = useState(null);

  useEffect(() => {
    apiGet("/customer/loyalty")
      .then(setAccount)
      .catch(() => setAccount({ points: 0, tier: "Bronze", lifetimeSpent: 0 }));
  }, []);

  const redeem = async () => {
    setStatus(null);
    try {
      const next = await apiPost("/customer/loyalty/redeem", { points: 100 }, getToken());
      setAccount(next);
      setStatus({ type: "success", message: "100 points redeemed successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Could not redeem points" });
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <section className="glass-panel-strong rounded-[2rem] p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-400/15 text-amber-200">
            <FaCoins />
          </div>
          <div>
            <span className="section-kicker">Loyalty</span>
            <h1 className="font-display mt-2 text-4xl font-bold text-white">Loyalty Points System</h1>
          </div>
        </div>

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

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat label="Points" value={account.points} />
          <Stat label="Tier" value={account.tier} />
          <Stat label="Lifetime Spend" value={`₹${account.lifetimeSpent ?? 0}`} />
        </div>

        <button
          onClick={redeem}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ff9f43] to-[#ff6b8b] px-5 py-3 font-semibold text-slate-950"
        >
          <FaGift /> Redeem 100 points
        </button>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
