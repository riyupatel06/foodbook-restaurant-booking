import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaCheckCircle, FaCreditCard, FaMoneyBillWave, FaPrint, FaReceipt, FaStore, FaTimes } from "react-icons/fa";
import { fetchAdminPayment, fetchAdminRestaurantPayments, payRestaurantForPayment, payRestaurantPayments } from "./services/adminApi";

function formatCurrency(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function Detail({ label, value }) {
  return (
    <div className="rounded-2xl border border-cyan-100 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-slate-900">{value || "-"}</p>
    </div>
  );
}

function PaymentTable({ title, total, emptyText, payments }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-cyan-100 bg-white">
      <div className="flex flex-col gap-2 bg-cyan-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">{title}</p>
          <p className="mt-1 text-sm text-cyan-900/70">{payments.length} payments</p>
        </div>
        <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-cyan-700 shadow-sm">{formatCurrency(total)}</span>
      </div>
      <div className="grid grid-cols-5 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">
        <span>Customer</span>
        <span>Booking</span>
        <span>Status</span>
        <span>Amount</span>
        <span>Transaction</span>
      </div>
      <div className="divide-y divide-cyan-100">
        {payments.map((item) => (
          <div key={item._id} className="grid grid-cols-5 gap-3 px-4 py-4 text-sm">
            <span className="font-semibold text-slate-900">{item.customerName || "Guest"}</span>
            <span className="text-cyan-900/70">{[item.date, item.time].filter(Boolean).join(" at ") || "-"}</span>
            <span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.payoutStatus === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {item.payoutStatus === "paid" ? "Paid" : "Remaining"}
              </span>
            </span>
            <span className="font-semibold text-slate-900">{formatCurrency(item.amount)}</span>
            <span className="break-all text-cyan-900/70">{item.transactionId || item._id}</span>
          </div>
        ))}
        {!payments.length ? <div className="px-4 py-6 text-sm text-cyan-900/60">{emptyText}</div> : null}
      </div>
    </div>
  );
}

export default function AdminPayRestaurant() {
  const { paymentId, restaurantId } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [showCompletedReceipt, setShowCompletedReceipt] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        if (restaurantId) {
          const result = await fetchAdminRestaurantPayments(restaurantId);
          if (mounted) {
            setRestaurant(result.restaurant);
            setPayments(Array.isArray(result.payments) ? result.payments : []);
            setPayment(null);
          }
          return;
        }

        const result = await fetchAdminPayment(paymentId);
        if (mounted) {
          setPayment(result);
          setRestaurant(null);
          setPayments([]);
        }
      } catch (loadError) {
        if (mounted) setError(loadError.message || "Unable to load payment");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [paymentId, restaurantId]);

  const confirmPayout = async () => {
    setPaying(true);
    setError("");
    try {
      if (restaurantId) {
        const updated = await payRestaurantPayments(restaurantId);
        setRestaurant(updated.restaurant);
        setPayments(Array.isArray(updated.payments) ? updated.payments : []);
        return;
      }

      const updated = await payRestaurantForPayment(paymentId);
      setPayment(updated);
    } catch (payError) {
      setError(payError.message || "Unable to pay restaurant");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return <div className="rounded-[28px] border border-cyan-100 bg-white p-8 text-sm text-cyan-900/70 shadow-sm">Loading payout details...</div>;
  }

  if (error && !payment) {
    return (
      <div className="space-y-4">
        <Link to="/admin/modules/payments" className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700">
          <FaArrowLeft /> Back to payments
        </Link>
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700 shadow-sm">{error}</div>
      </div>
    );
  }

  const displayRestaurant = restaurant || {
    name: payment?.restaurantName,
    location: payment?.restaurantLocation,
  };
  const displayPayments = restaurantId ? payments : payment ? [payment] : [];
  const pendingPayments = displayPayments.filter((item) => item.payoutStatus !== "paid");
  const paidPayments = displayPayments.filter((item) => item.payoutStatus === "paid");
  const totalAmount = displayPayments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const payableAmount = pendingPayments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const paidAmount = paidPayments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const isPaid = displayPayments.length > 0 && pendingPayments.length === 0;

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-cyan-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-600">Pay Restaurant</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">{displayRestaurant.name || "Restaurant payout"}</h2>
            <p className="mt-2 text-sm text-cyan-900/70">{displayRestaurant.location || "Branch"} payout confirmation</p>
          </div>
          <Link to="/admin/modules/payments" className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700">
            <FaArrowLeft /> Back to payments
          </Link>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <section className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="rounded-[28px] border border-cyan-100 bg-cyan-50 p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-cyan-700 shadow-sm">
                <FaStore />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">Restaurant</p>
                <h3 className="text-xl font-semibold text-slate-900">{displayRestaurant.name || "Restaurant"}</h3>
                <p className="text-sm text-cyan-900/70">{displayRestaurant.location || "-"}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Detail label="Total Payments" value={displayPayments.length} />
            <Detail label="Pending Payouts" value={pendingPayments.length} />
            <Detail label="Paid Payouts" value={paidPayments.length} />
            <Detail label="Total Sales" value={formatCurrency(totalAmount)} />
            <Detail label="Remaining Amount" value={formatCurrency(payableAmount)} />
            <Detail label="Paid Amount" value={formatCurrency(paidAmount)} />
          </div>

          <PaymentTable
            title="Remaining Payments"
            total={payableAmount}
            payments={pendingPayments}
            emptyText="No remaining payments for this restaurant."
          />

          <PaymentTable
            title="Paid Payments"
            total={paidAmount}
            payments={paidPayments}
            emptyText="No paid payments for this restaurant yet."
          />
        </div>

        <aside className="rounded-[28px] border border-cyan-100 bg-white p-6 shadow-sm">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-cyan-50 text-2xl text-cyan-700">
            <FaMoneyBillWave />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">Payable Amount</p>
          <p className="mt-2 text-4xl font-semibold text-slate-900">{formatCurrency(payableAmount)}</p>
          <p className="mt-2 text-sm text-cyan-900/70">Total payment value: {formatCurrency(totalAmount)}</p>

          <div className="mt-5 space-y-3 rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-cyan-900/70">Payout status</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isPaid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {isPaid ? "Paid" : "Pending"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-cyan-900/70">Payments</span>
              <span className="font-semibold text-slate-900">{displayPayments.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-cyan-900/70">Pending</span>
              <span className="font-semibold text-slate-900">{pendingPayments.length}</span>
            </div>
          </div>

          <button
            type="button"
            disabled={isPaid || paying}
            onClick={confirmPayout}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#22c1c3] to-[#2563eb] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPaid ? <FaCheckCircle /> : <FaCreditCard />}
            {isPaid ? "Already paid to restaurant" : paying ? "Paying restaurant..." : "Confirm pay to restaurant"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/modules/payments")}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-700"
          >
            <FaReceipt /> View payments
          </button>

          {paidPayments.length ? (
            <button
              type="button"
              onClick={() => setShowCompletedReceipt(true)}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
            >
              <FaReceipt /> View completed receipt
            </button>
          ) : null}
        </aside>
      </section>

      {showCompletedReceipt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-100 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 bg-cyan-50 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-600">Completed Payout Receipt</p>
                <h3 className="mt-1 text-2xl font-semibold text-slate-900">{displayRestaurant.name || "Restaurant payout"}</h3>
                <p className="mt-1 text-sm text-cyan-900/70">{displayRestaurant.location || "Branch"} | {paidPayments.length} paid payments</p>
              </div>
              <button
                type="button"
                aria-label="Close receipt"
                onClick={() => setShowCompletedReceipt(false)}
                className="rounded-full bg-white p-3 text-cyan-700 shadow-sm"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="grid gap-4 rounded-2xl border border-cyan-100 p-4 md:grid-cols-2">
                <Detail label="Restaurant" value={displayRestaurant.name} />
                <Detail label="Branch" value={displayRestaurant.location} />
                <Detail label="Paid Payments" value={paidPayments.length} />
                <Detail label="Paid Amount" value={formatCurrency(paidAmount)} />
              </div>

              <div className="rounded-2xl border border-cyan-100">
                <div className="flex items-center justify-between border-b border-cyan-100 px-4 py-3 text-sm">
                  <span className="font-semibold text-slate-900">Completed payout amount</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(paidAmount)}</span>
                </div>
                <div className="grid grid-cols-4 bg-cyan-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">
                  <span>Customer</span>
                  <span>Booking</span>
                  <span>Amount</span>
                  <span>Transaction</span>
                </div>
                <div className="divide-y divide-cyan-100">
                  {paidPayments.map((item) => (
                    <div key={item._id} className="grid grid-cols-4 gap-3 px-4 py-4 text-sm">
                      <span className="font-semibold text-slate-900">{item.customerName || "Guest"}</span>
                      <span className="text-cyan-900/70">{[item.date, item.time].filter(Boolean).join(" at ") || "-"}</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(item.amount)}</span>
                      <span className="break-all text-cyan-900/70">{item.transactionId || item._id}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-cyan-100 pt-5">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700"
                >
                  <FaPrint /> Print
                </button>
                <button
                  type="button"
                  onClick={() => setShowCompletedReceipt(false)}
                  className="rounded-full bg-gradient-to-r from-[#22c1c3] to-[#2563eb] px-4 py-2 text-sm font-semibold text-white"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
