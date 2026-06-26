import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaCalendarAlt, FaClock, FaDownload, FaMapMarkerAlt, FaQrcode, FaStar } from "react-icons/fa";
import QRCode from "qrcode";
import { apiGet } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const DEFAULT_BOOKINGS = [
  {
    id: "BK101",
    restaurant: "Spice Garden",
    date: "10 June 2026",
    time: "8:00 PM",
    table: "VIP-1",
    status: "Confirmed",
    city: "Thaltej",
  },
  {
    id: "BK102",
    restaurant: "Italian House",
    date: "14 June 2026",
    time: "7:30 PM",
    table: "T2",
    status: "Upcoming",
    city: "Sindhu Bhavan",
  },
];

function loadBookings() {
  try {
    const stored = window.localStorage.getItem("foodbook-bookings");
    const parsed = stored ? JSON.parse(stored) : [];
    const combined = [...parsed, ...DEFAULT_BOOKINGS];
    return Array.from(
      new Map(
        combined.map((booking) => {
          const key = [booking.restaurant ?? "", booking.date ?? "", booking.time ?? "", booking.table ?? ""].join("|");
          return [key, booking];
        }),
      ).values(),
    );
  } catch {
    return DEFAULT_BOOKINGS;
  }
}

export default function MyBookings() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState(() => loadBookings());
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;

    apiGet("/bookings")
      .then((response) => {
        const mapped = response.map((booking) => ({
          id: booking._id,
          restaurant: booking.restaurantName,
          date: booking.date,
          time: booking.time,
          table: booking.tableId,
          status: booking.status === "confirmed" ? "Confirmed" : booking.status,
          city: booking.city,
        }));
        const combined = [...mapped, ...DEFAULT_BOOKINGS];
        const unique = Array.from(
          new Map(
            combined.map((booking) => {
              const key = [booking.restaurant ?? "", booking.date ?? "", booking.time ?? "", booking.table ?? ""].join("|");
              return [key, booking];
            }),
          ).values(),
        );
        setBookings(unique);
      })
      .catch(() => {
        setBookings(loadBookings());
      });
  }, [isAuthenticated]);

  const latestBooking = bookings[0];
  const selectedBooking = useMemo(
    () => bookings.find((booking) => booking.id === selectedBookingId) ?? latestBooking ?? null,
    [bookings, latestBooking, selectedBookingId],
  );

  useEffect(() => {
    let active = true;
    const booking = selectedBooking;
    if (!booking) {
      return undefined;
    }

    const payload = JSON.stringify({
      bookingId: booking.id,
      restaurant: booking.restaurant,
      table: booking.table,
      date: booking.date,
      time: booking.time,
      city: booking.city,
      status: booking.status,
    });

    QRCode.toDataURL(payload, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 360,
      color: {
        dark: "#050816",
        light: "#ffffff",
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl("");
      });

    return () => {
      active = false;
    };
  }, [selectedBooking]);

  const downloadQr = () => {
    if (!qrDataUrl || !selectedBooking) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `${selectedBooking.restaurant || "booking"}-qr.png`;
    link.click();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="glass-panel-strong overflow-hidden rounded-[2rem] p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="space-y-4">
            <span className="section-kicker">Reservation hub</span>
            <h1 className="font-display text-5xl font-bold text-white sm:text-6xl">
              My Bookings
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Track your confirmed and upcoming reservations in a polished dashboard-style view.
            </p>
          </div>

          <div className="glass-panel rounded-[1.5rem] p-5">
            <div className="flex items-center gap-3 text-slate-200">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-200">
                <FaStar />
              </div>
              <div>
                <p className="text-sm text-slate-400">Saved reservations</p>
                <p className="font-semibold text-white">{bookings.length} active bookings</p>
              </div>
            </div>
          </div>
        </div>

        {latestBooking ? (
          <div className="mt-6 rounded-[1.75rem] border border-orange-300/20 bg-orange-400/10 px-4 py-4 text-sm text-orange-100">
            Latest booking from your confirmation flow: <span className="font-semibold text-white">{latestBooking.restaurant}</span>
            {' '}on {latestBooking.date} at {latestBooking.time}.
          </div>
        ) : null}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_auto]">
        <div className="grid gap-5">
          {bookings.map((booking, index) => (
            <article
              key={booking.id}
              className="glass-panel lift-card rounded-[1.75rem] p-6"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                  <div>
                    <p className="section-kicker">{booking.id}</p>
                    <h2 className="font-display mt-2 text-3xl font-bold text-white">
                      {booking.restaurant}
                    </h2>
                  </div>

                  <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                    <div className="flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-3">
                      <FaCalendarAlt className="text-orange-200" />
                      {booking.date}
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-3">
                      <FaClock className="text-orange-200" />
                      {booking.time}
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-3">
                      <FaMapMarkerAlt className="text-orange-200" />
                      {booking.city}
                    </div>
                    <div className="rounded-2xl bg-white/5 px-4 py-3 text-slate-200">
                      Table {booking.table}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-3">
                  <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200">
                    {booking.status}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedBookingId(booking.id)}
                      className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white"
                    >
                      <FaQrcode className="mr-2" />
                      View QR
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/rebook?bookingId=${booking.id}`)}
                      className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white"
                    >
                      One Click Rebooking
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="glass-panel rounded-[1.75rem] p-6 sm:p-8">
          <span className="section-kicker">QR Check-In</span>
          <h2 className="font-display mt-2 text-3xl font-bold text-white">
            Booking QR, details, and download
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            Use this QR at the restaurant counter or with the admin scanner. It contains the
            booking reference and table details.
          </p>

          {selectedBooking ? (
            <div className="mt-6 space-y-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <div className="rounded-3xl bg-white p-4">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR code for ${selectedBooking.restaurant}`}
                    className="mx-auto h-56 w-56 object-contain"
                  />
                ) : (
                  <div className="grid h-56 w-56 place-items-center rounded-2xl bg-slate-100 text-sm text-slate-500">
                    Generating QR...
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0b1222] px-4 py-3 text-sm text-slate-200">
                <p className="font-semibold text-white">{selectedBooking.restaurant}</p>
                <p className="mt-1 text-slate-400">
                  {selectedBooking.date} · {selectedBooking.time} · Table {selectedBooking.table}
                </p>
                <p className="mt-1 text-slate-400">{selectedBooking.city}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={downloadQr}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#ff9f43] to-[#ff6b8b] px-5 py-3 font-semibold text-slate-950 transition hover:scale-[1.01]"
                >
                  <FaDownload className="mr-2" />
                  Download QR
                </button>
                <Link
                  to="/booking"
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
                >
                  Book Another Table
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-sm text-slate-400">
              Select a booking to view its QR code and details.
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
