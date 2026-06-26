import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBell,
  FaBookOpen,
  FaCalendarAlt,
  FaCalendarCheck,
  FaChair,
  FaChartLine,
  FaComments,
  FaCreditCard,
  FaDollarSign,
  FaEye,
  FaFilePdf,
  FaGift,
  FaLayerGroup,
  FaQrcode,
  FaRobot,
  FaUtensils,
  FaUsers,
  FaClock,
  FaImage,
  FaSearch,
} from "react-icons/fa";
import AdminSectionTitle from "./components/AdminSectionTitle";
import AdminStatCard from "./components/AdminStatCard";
import { downloadAdminReport, fetchAdminReports } from "./services/adminApi";
import { useAdminDashboard } from "./hooks/useAdminDashboard";

const modules = [
  ["Dashboard", FaChartLine, "Overview"],
  ["Restaurants", FaUtensils, "CRUD"],
  ["Vendors", FaUsers, "Moderation"],
  ["Customers", FaUsers, "Users"],
  ["Menus", FaBookOpen, "Items"],
  ["Tables", FaChair, "Layout"],
  ["Bookings", FaCalendarCheck, "Reservations"],
  ["Orders", FaBookOpen, "Food Orders"],
  ["Payments", FaCreditCard, "Transactions"],
  ["Offers", FaGift, "Promos"],
  ["QR Check-In", FaQrcode, "Entry"],
  ["Deals", FaEye, "Last Minute"],
  ["Waitlist", FaLayerGroup, "Queue"],
  ["Reviews", FaComments, "Ratings"],
  ["Notifications", FaBell, "Messages"],
  ["Reports", FaChartLine, "Analytics"],
  ["Revenue", FaDollarSign, "Earnings"],
  ["Settings", FaImage, "System"],
];

function CompactCard({ title, value, note }) {
  return (
    <div className="rounded-2xl border border-cyan-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-cyan-900/60">{note}</p>
    </div>
  );
}

function SectionTile({ title, value, tone = "violet" }) {
  const tones = {
    violet: "bg-violet-50 text-violet-700",
    blue: "bg-cyan-50 text-cyan-700",
    green: "bg-emerald-50 text-emerald-700",
    orange: "bg-orange-50 text-orange-700",
  };
  return (
    <div className={`rounded-2xl px-4 py-3 ${tones[tone]}`}>
      <p className="text-xs font-medium uppercase tracking-[0.22em] opacity-70">{title}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function TrendBar({ label, value, accent = "bg-cyan-500" }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-cyan-900/75">{label}</span>
        <span className="font-semibold text-slate-900">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-cyan-50">
        <div className={`h-2 rounded-full ${accent}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function isInRange(dateValue, range) {
  const date = new Date(dateValue ?? Date.now());
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (range === "Today") {
    return date >= start;
  }

  if (range === "This Week") {
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    return date >= start;
  }

  if (range === "This Year") {
    start.setMonth(0, 1);
    return date >= start;
  }

  start.setDate(1);
  return date >= start;
}

function percent(part, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((Number(part || 0) / Number(total || 1)) * 100));
}

export default function AdminDashboard() {
  const { data, loading, error } = useAdminDashboard();
  const [report, setReport] = useState(null);
  const [dateRange, setDateRange] = useState("This Month");
  const navigate = useNavigate();

  useEffect(() => {
    fetchAdminReports().then(setReport).catch(() => setReport(null));
  }, []);

  const summary = data?.summary ?? {};

  const cards = useMemo(
    () => [
      ["Restaurants", summary.restaurants ?? 0, "All partner restaurants"],
      ["Vendors", summary.vendors ?? 0, "Owner accounts"],
      ["Customers", summary.users ?? 0, "Registered diners"],
      ["Bookings", summary.bookings ?? 0, "Reservation volume"],
      ["Revenue", `₹${Number(summary.revenue || 0).toLocaleString("en-IN")}`, "Platform earnings"],
      ["Pending", summary.pendingBookings ?? 0, "Bookings awaiting action"],
      ["Active", summary.approvedRestaurants ?? 0, "Approved restaurants"],
      ["Notifications", summary.notifications ?? 0, "Queued messages"],
    ],
    [summary],
  );

  const recentBookings = data?.bookings?.slice(0, 5) ?? [];
  const topRestaurants = data?.restaurants?.slice(0, 5) ?? [];
  const allBookings = data?.bookings ?? [];
  const allPayments = data?.payments ?? [];
  const rangeBookings = allBookings.filter((booking) => isInRange(booking.createdAt ?? booking.date, dateRange));
  const rangePayments = allPayments.filter((payment) => isInRange(payment.createdAt, dateRange));
  const rangeRevenue = rangePayments
    .filter((payment) => payment.status !== "failed")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const totalRevenue = allPayments
    .filter((payment) => payment.status !== "failed")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const confirmedBookings = rangeBookings.filter((booking) => booking.status === "confirmed").length;
  const pendingBookings = rangeBookings.filter((booking) => booking.status === "pending").length;
  const cancelledBookings = rangeBookings.filter((booking) => booking.status === "cancelled").length;
  const overview = {
    revenue: percent(rangeRevenue, totalRevenue),
    orders: percent(rangePayments.length, allPayments.length),
    bookings: percent(rangeBookings.length, allBookings.length),
  };

  if (loading) {
    return <div className="rounded-3xl border border-cyan-100 bg-white p-6 text-cyan-700 shadow-sm">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="rounded-3xl border border-cyan-100 bg-cyan-50 p-5 text-cyan-700">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-cyan-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-600">Super Admin Panel</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Dashboard</h2>
            <p className="mt-2 text-sm leading-7 text-cyan-900/70">
              Restaurant, vendor, customer, booking, payment, coupon, loyalty, QR, reports,
              AI, support, and system control in one compact command center.
            </p>
          </div>
          <div className="grid min-w-[320px] grid-cols-2 gap-3">
            <SectionTile title="Platform" value="Live" tone="green" />
            <SectionTile title="Access" value="Super Admin" tone="blue" />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-[28px] border border-cyan-100 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-cyan-700 lg:min-w-[360px]">
          <FaSearch className="text-cyan-400" />
          <input placeholder="Search restaurants, vendors, bookings..." className="w-full bg-transparent text-sm outline-none placeholder:text-cyan-300" />
        </div>
        <div className="flex flex-wrap gap-2">
          {["Today", "This Week", "This Month", "This Year"].map((item) => (
            <button
              key={item}
              onClick={() => setDateRange(item)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                dateRange === item ? "bg-gradient-to-r from-[#22c1c3] to-[#2563eb] text-white" : "bg-cyan-50 text-cyan-700"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(([title, value, note]) => (
          <AdminStatCard key={title} label={title} value={value} hint={note} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[28px] border border-cyan-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <AdminSectionTitle kicker="Reports" title="Generated report" description="Download a PDF or review latest summary." />
            <button
              onClick={async () => {
                try {
                  const blob = await downloadAdminReport();
                  const objectUrl = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = objectUrl;
                  link.download = "restorantbooking-admin-report.pdf";
                  link.click();
                  URL.revokeObjectURL(objectUrl);
                } catch (downloadError) {
                  window.alert(downloadError.message || "Unable to download report");
                }
              }}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#22c1c3] to-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-sm"
            >
              <FaFilePdf />
              PDF
            </button>
          </div>

          {report ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <CompactCard title="Generated" value={new Date(report.generatedAt).toLocaleDateString()} note="Latest report" />
              <CompactCard title="Top Restaurants" value={report.topRestaurants.length} note="Included" />
              <CompactCard title="Bookings" value={report.recentBookings.length} note="Included" />
              <CompactCard title="Payments" value={report.recentPayments.length} note="Included" />
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
              <p className="text-sm font-semibold text-cyan-950">Revenue overview</p>
              <div className="mt-4 space-y-4">
                <TrendBar label="Revenue" value={overview.revenue} accent="bg-cyan-500" />
                <TrendBar label="Orders" value={overview.orders} accent="bg-sky-500" />
                <TrendBar label="Bookings" value={overview.bookings} accent="bg-blue-500" />
              </div>
            </div>
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
              <p className="text-sm font-semibold text-cyan-950">Booking overview</p>
              <div className="mt-4 grid h-full place-items-center rounded-2xl border border-cyan-100 bg-white px-4 py-8 text-center">
                <div>
                  <p className="text-4xl font-bold text-slate-900">{rangeBookings.length}</p>
                  <p className="mt-1 text-sm text-cyan-900/60">Total bookings in the selected range</p>
                  <div className="mt-4 flex items-center justify-center gap-3 text-sm">
                    <span className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-cyan-900/70">Confirmed {confirmedBookings}</span>
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="text-cyan-900/70">Pending {pendingBookings}</span>
                    <span className="h-3 w-3 rounded-full bg-rose-400" />
                    <span className="text-cyan-900/70">Cancelled {cancelledBookings}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-cyan-100 bg-white p-5 shadow-sm">
          <AdminSectionTitle kicker="Recent" title="Recent bookings" description="Latest reservations and their current state." />
          <div className="mt-4 space-y-3">
            {recentBookings.length ? (
              recentBookings.map((booking) => (
                <div key={booking._id} className="flex items-center gap-3 rounded-2xl border border-cyan-100 bg-cyan-50 p-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-white text-cyan-600 shadow-sm">
                    <FaCalendarAlt />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{booking.restaurantName}</p>
                    <p className="text-xs text-cyan-900/60">
                      {booking.customerName || "Guest"} • {booking.date} • {booking.time}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-cyan-700 shadow-sm">
                    {booking.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-cyan-100 bg-cyan-50 p-5 text-sm text-cyan-900/60">
                No recent bookings.
              </div>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
            <p className="text-sm font-semibold text-cyan-950">Top restaurants</p>
            <div className="mt-3 space-y-3">
              {topRestaurants.length ? (
                topRestaurants.map((restaurant, index) => (
                  <div key={restaurant._id} className="flex items-center justify-between text-sm">
                    <span className="text-cyan-900/80">
                      {index + 1}. {restaurant.name}
                    </span>
                    <span className="font-semibold text-cyan-700">{restaurant.isActive ? "Active" : "Inactive"}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-cyan-900/60">No restaurants available.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-cyan-100 bg-white p-5 shadow-sm">
        <AdminSectionTitle kicker="Modules" title="Management areas" description="Clean module grid aligned with the screenshot style." />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {modules.map(([label, Icon, note]) => (
            <button
              key={label}
              onClick={() => navigate(`/admin/modules/${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`)}
              className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-left transition hover:-translate-y-0.5 hover:bg-cyan-100/70"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-100 text-cyan-700">
                  <Icon />
                </div>
                <div>
                  <p className="text-sm font-semibold text-cyan-950">{label}</p>
                  <p className="mt-1 text-xs text-cyan-900/60">{note}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
