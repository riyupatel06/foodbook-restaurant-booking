import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaDownload, FaEnvelope, FaMobileAlt, FaReceipt } from "react-icons/fa";
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

export default function Invoice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatedInvoiceNo] = useState(() => `INV-${Date.now()}`);
  const isConfirmed = searchParams.get("confirmed") === "true";

  const invoice = useMemo(() => {
    const restaurant = searchParams.get("restaurant") ?? "Selected restaurant";
    const city = searchParams.get("city") ?? "Selected city";
    const tableType = searchParams.get("tableType") ?? "Selected table";
    const tableId = searchParams.get("tableId") ?? "VIP-01";
    const guests = searchParams.get("guests") ?? "4 Guests";
    const date = searchParams.get("date") ?? "15 June 2026";
    const time = searchParams.get("time") ?? "8:00 PM";
    const method = searchParams.get("method") ?? "Razorpay";
    const slot = searchParams.get("slot") ?? "dinner";
    const bookingMode = searchParams.get("bookingMode") ?? "standard";
    const combineTables = searchParams.get("combineTables") === "true";
    const tableGroup = searchParams.get("tableGroup") ?? "";
    const recurringFrequency = searchParams.get("recurringFrequency") ?? "none";
    const recurringEndsOn = searchParams.get("recurringEndsOn") ?? "";
    const items = parseItems(searchParams.get("items") ?? searchParams.get("dish") ?? "Paneer Tikka x2 | Veg Biryani x1");

    const subtotal = items.reduce((sum, item) => sum + item.quantity * 299, 0);
    const gst = Math.round(subtotal * 0.12);
    const total = subtotal + gst;

    return {
      invoiceNo: searchParams.get("invoiceNo") ?? generatedInvoiceNo,
      bookingId: searchParams.get("bookingId") ?? "FB12345",
      restaurant,
      city,
      tableType,
      tableId,
      guests,
      date,
      time,
      method,
      slot,
      bookingMode,
      combineTables,
      tableGroup,
      recurringFrequency,
      recurringEndsOn,
      items,
      subtotal,
      gst,
      total,
    };
  }, [generatedInvoiceNo, searchParams]);

  const downloadSlip = () => {
    window.print();
  };

  const confirmAndContinue = () => {
    setSubmitting(true);
    setStatus(null);

    const confirmationParams = new URLSearchParams(searchParams);
    confirmationParams.set("notifications", "text,email");
    confirmationParams.set("paymentStatus", "paid");

    const payload = {
      restaurantName: invoice.restaurant,
      city: invoice.city,
      tableId: invoice.tableId,
      tableType: invoice.tableType,
      guests: invoice.guests,
      date: invoice.date,
      time: invoice.time,
      slot: invoice.slot,
      bookingMode: invoice.bookingMode,
      combineTables: invoice.combineTables,
      tableGroup: invoice.tableGroup,
      recurring: {
        frequency: invoice.recurringFrequency,
        endsOn: invoice.recurringEndsOn || undefined,
      },
      items: invoice.items,
      payment: {
        provider: "razorpay",
        method: invoice.method,
        amount: invoice.total,
        status: "paid",
      },
      invoice: {
        invoiceNo: invoice.invoiceNo,
        subtotal: invoice.subtotal,
        gst: invoice.gst,
        total: invoice.total,
      },
      notifications: {
        channels: ["text", "email"],
        message: `Your booking at ${invoice.restaurant} is confirmed.`,
      },
      feedback: {
        enabled: true,
      },
      contact: {
        email: "user@example.com",
        phone: "",
      },
    };

    apiPost("/bookings/confirm", payload, getToken())
      .then((response) => {
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
          // Keep the backend record even if local cache fails.
        }

        confirmationParams.set("bookingId", response.booking._id);
        confirmationParams.set("invoiceNo", response.invoice.invoiceNo);
        setStatus({ type: "success", message: "Booking confirmed successfully. Message sent and cart cleared. Redirecting..." });
        window.setTimeout(() => navigate(`/booking-success?${confirmationParams.toString()}`), 900);
      })
      .catch((error) => {
        setStatus({ type: "error", message: error.message || "Could not confirm booking" });
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="glass-panel-strong overflow-hidden rounded-[2rem] p-6 sm:p-8">
        <div className="flex items-center gap-3 text-slate-200">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-400/15 text-orange-200">
            <FaReceipt />
          </div>
          <div>
            <p className="text-sm text-slate-400">Bill slip</p>
            <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">RestorantBooking Invoice</h1>
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

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-[1.75rem] border border-white/10 bg-white p-6 text-slate-950 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">Invoice No</p>
                <p className="text-2xl font-bold">{invoice.invoiceNo}</p>
                <p className="mt-1 text-sm text-slate-600">Booking ID: {invoice.bookingId}</p>
              </div>
              <div className="rounded-2xl bg-slate-950 px-4 py-3 text-right text-white">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Total</p>
                <p className="text-2xl font-bold">Rs. {invoice.total}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-slate-500">Restaurant</p>
                <p className="font-semibold">{invoice.restaurant}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Location</p>
                <p className="font-semibold">{invoice.city}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Table</p>
                <p className="font-semibold">{invoice.tableId}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Guests</p>
                <p className="font-semibold">{invoice.guests}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Date</p>
                <p className="font-semibold">{invoice.date}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Time</p>
                <p className="font-semibold">{invoice.time}</p>
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Bill items</p>
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Item</th>
                      <th className="px-4 py-3 font-semibold">Qty</th>
                      <th className="px-4 py-3 font-semibold">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="border-t border-slate-200">
                        <td className="px-4 py-3">{item.name}</td>
                        <td className="px-4 py-3">{item.quantity}</td>
                        <td className="px-4 py-3">Rs. {item.quantity * 299}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Subtotal: <span className="font-semibold text-slate-950">Rs. {invoice.subtotal}</span>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                GST: <span className="font-semibold text-slate-950">Rs. {invoice.gst}</span>
              </div>
              <div className="rounded-2xl bg-slate-950 px-4 py-3 text-sm text-white">
                Payment: <span className="font-semibold">{invoice.method}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-panel rounded-[1.75rem] p-5">
              <p className="text-sm text-slate-400">Notification status</p>
              <div className="mt-3 space-y-3 text-sm text-slate-200">
                <div className="flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-3">
                  <FaMobileAlt className="text-orange-200" />
                  {isConfirmed ? "Text notification queued after payment" : "Text message will be sent to the user"}
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-3">
                  <FaEnvelope className="text-orange-200" />
                  {isConfirmed ? "Email notification queued after payment" : "Email notification will be sent to the user"}
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-[1.75rem] p-5">
              <p className="text-sm text-slate-400">Invoice actions</p>
              <button
                type="button"
                onClick={downloadSlip}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                <FaDownload />
                Download bill slip
              </button>
              {isConfirmed ? (
                <div className="mt-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-200">
                  Booking Confirmed
                </div>
              ) : (
                <button
                  type="button"
                  onClick={confirmAndContinue}
                  disabled={submitting}
                  className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#ff9f43] to-[#ff6b8b] px-5 py-3 font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? "Confirming..." : "Confirm booking and send notification"}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
