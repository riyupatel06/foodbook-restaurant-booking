import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaBell, FaEnvelope, FaMobileAlt, FaShieldAlt, FaWallet } from "react-icons/fa";
import { apiPost, getToken } from "../../lib/api";

function parseItems(rawItems) {
  if (!rawItems) return [];

  return rawItems.split("|").map((entry, index) => {
    const [namePart, quantityPart] = entry.trim().split(" x");
    return {
      id: index + 1,
      name: namePart ?? entry.trim(),
      quantity: Number(quantityPart) || 1,
    };
  });
}

export default function Payment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [method, setMethod] = useState("razorpay");
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const total = searchParams.get("total") ?? "0";

  const orderSummary = useMemo(
    () => ({
      restaurant: searchParams.get("restaurant") ?? "Selected restaurant",
      city: searchParams.get("city") ?? "Selected city",
      tableType: searchParams.get("tableType") ?? "Selected table",
      tableId: searchParams.get("tableId") ?? "",
      date: searchParams.get("date") ?? "",
      time: searchParams.get("time") ?? "",
      slot: searchParams.get("slot") ?? "",
      guests: searchParams.get("guests") ?? "",
      items: searchParams.get("items") ?? searchParams.get("dish") ?? "",
      bookingMode: searchParams.get("bookingMode") ?? "standard",
      combineTables: searchParams.get("combineTables") === "true",
      tableGroup: searchParams.get("tableGroup") ?? "",
      recurringFrequency: searchParams.get("recurringFrequency") ?? "none",
      recurringEndsOn: searchParams.get("recurringEndsOn") ?? "",
    }),
    [searchParams],
  );

  const handlePayment = async () => {
    setSubmitting(true);
    setStatus(null);

    const confirmationParams = new URLSearchParams(searchParams);
    confirmationParams.set("paymentStatus", "paid");
    confirmationParams.set("method", method);
    confirmationParams.set("notifications", "text,email");

    const items = parseItems(orderSummary.items);
    const subtotal = Number(searchParams.get("subtotal")) || items.reduce((sum, item) => sum + item.quantity * 299, 0);
    const gst = Number(searchParams.get("gst")) || Math.round(subtotal * 0.12);
    const payableTotal = Number(total) || subtotal + gst;
    const invoiceNo = `INV-${Date.now()}`;

    const payload = {
      restaurantName: orderSummary.restaurant,
      restaurantId: searchParams.get("restaurantId") ?? "",
      city: orderSummary.city,
      tableId: orderSummary.tableId,
      tableType: orderSummary.tableType,
      guests: orderSummary.guests,
      date: orderSummary.date,
      time: orderSummary.time,
      slot: orderSummary.slot || "dinner",
      bookingMode: orderSummary.bookingMode,
      combineTables: orderSummary.combineTables,
      tableGroup: orderSummary.tableGroup,
      recurring: {
        frequency: orderSummary.recurringFrequency,
        endsOn: orderSummary.recurringEndsOn || undefined,
      },
      items,
      payment: {
        provider: "razorpay",
        method,
        amount: payableTotal,
        status: "paid",
        transactionId: `TXN-${Date.now()}`,
      },
      invoice: {
        invoiceNo,
        subtotal,
        gst,
        total: payableTotal,
      },
      notifications: {
        channels: ["text", "email"],
        message: `Your booking at ${orderSummary.restaurant} is confirmed.`,
      },
    };

    try {
      const response = await apiPost("/bookings/confirm", payload, getToken());

      try {
        const stored = window.localStorage.getItem("foodbook-bookings");
        const bookings = stored ? JSON.parse(stored) : [];
        bookings.unshift({
          id: response.booking._id,
          restaurant: response.booking.restaurantName,
          city: response.booking.city,
          table: response.booking.tableId,
          tableType: response.booking.tableType,
          date: response.booking.date,
          time: response.booking.time,
          guests: response.booking.guests,
          status: "Confirmed",
        });
        window.localStorage.setItem("foodbook-bookings", JSON.stringify(bookings.slice(0, 10)));
        window.localStorage.removeItem("foodbook-cart");
      } catch {
        // Backend confirmation is already complete.
      }

      confirmationParams.set("bookingId", response.booking._id);
      confirmationParams.set("invoiceNo", response.invoice.invoiceNo);
      confirmationParams.set("confirmed", "true");
      navigate(`/booking-success?${confirmationParams.toString()}`, { replace: true });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Payment succeeded, but booking confirmation failed" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="glass-panel-strong rounded-[2rem] p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <span className="section-kicker">Payment</span>
            <h1 className="font-display text-5xl font-bold text-white sm:text-6xl">Pay with Razorpay</h1>
            <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Complete payment to confirm the booking automatically and queue text/email notification.
            </p>

            {status ? (
              <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                {status.message}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <p className="text-slate-400">Restaurant</p>
                <p className="mt-1 font-semibold text-white">{orderSummary.restaurant}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <p className="text-slate-400">Location</p>
                <p className="mt-1 font-semibold text-white">{orderSummary.city}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <p className="text-slate-400">Table</p>
                <p className="mt-1 font-semibold text-white">{orderSummary.tableType}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <p className="text-slate-400">Total</p>
                <p className="mt-1 font-semibold text-white">Rs. {total}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <p className="text-slate-400">Slot</p>
                <p className="mt-1 font-semibold capitalize text-white">{orderSummary.slot || "Dinner"}</p>
              </div>
            </div>

            {orderSummary.items ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <p className="mb-2 font-semibold text-white">Selected menu items</p>
                <p className="leading-7">{orderSummary.items}</p>
              </div>
            ) : null}
          </div>

          <div className="glass-panel rounded-[1.75rem] p-5">
            <div className="flex items-center gap-3 text-slate-200">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-400/15 text-orange-200">
                <FaWallet />
              </div>
              <div>
                <p className="text-sm text-slate-400">Secure checkout</p>
                <p className="font-semibold text-white">Razorpay payment gateway</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                { value: "razorpay", label: "Razorpay UPI / Wallet / Card" },
                { value: "upi", label: "UPI" },
                { value: "card", label: "Credit / Debit Card" },
                { value: "netbanking", label: "Net Banking" },
                { value: "cash", label: "Cash at Restaurant" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
                    method === option.value
                      ? "border-orange-300/50 bg-orange-400/15 text-white"
                      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                  }`}
                >
                  <span>{option.label}</span>
                  <input
                    type="radio"
                    name="payment"
                    value={option.value}
                    checked={method === option.value}
                    onChange={() => setMethod(option.value)}
                  />
                </label>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
              <div className="flex items-center gap-2 text-white">
                <FaShieldAlt className="text-emerald-300" />
                Booking confirmation happens after payment
              </div>
              <div className="mt-3 flex items-center gap-2">
                <FaMobileAlt className="text-orange-200" />
                <FaEnvelope className="text-orange-200" />
                <FaBell className="text-orange-200" />
                Text and email notification will be sent to the client after payment
              </div>
            </div>

            <button
              type="button"
              onClick={handlePayment}
              disabled={submitting}
              className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#ff9f43] to-[#ff6b8b] px-5 py-3 font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Confirming booking..." : "Pay and confirm booking"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
