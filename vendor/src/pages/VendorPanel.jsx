import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaBell,
  FaBookOpen,
  FaCalendarAlt,
  FaCalendarCheck,
  FaChartLine,
  FaChair,
  FaClock,
  FaCommentDots,
  FaDollarSign,
  FaEdit,
  FaExchangeAlt,
  FaEye,
  FaGift,
  FaHotel,
  FaImage,
  FaMapMarkedAlt,
  FaMinusCircle,
  FaPlusCircle,
  FaSearch,
  FaStar,
  FaTrash,
  FaUpload,
  FaUtensils,
  FaUsers,
} from "react-icons/fa";
import { FaChevronDown } from "react-icons/fa6";
import { apiDelete, apiGet, apiPatch, apiPost } from "../lib/api";
import { getVendorToken, useVendorAuth } from "../context/VendorAuthContext";

const emptyDashboard = {
  summary: {
    totalRestaurants: 0,
    todaysBookings: 0,
    upcomingBookings: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    pendingBookings: 0,
    availableTables: 0,
    occupancyRate: 0,
  },
  restaurants: [],
  menuItems: [],
  tables: [],
  bookings: [],
  payments: [],
  feedback: [],
  offers: [],
  adminDeals: [],
  waitlist: [],
  notifications: [],
  charts: {
    period: "monthly",
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    revenue: [12000, 18000, 14200, 22100, 19800, 23600],
    bookings: [8, 12, 9, 18, 14, 20],
    popularDishes: [],
    peakHours: [],
    customerGrowth: [],
    restaurantPerformance: [],
    statusBreakdown: [],
  },
};

function normalizeDashboard(data = {}) {
  return {
    ...emptyDashboard,
    ...data,
    summary: {
      ...emptyDashboard.summary,
      ...(data.summary ?? {}),
    },
    charts: {
      ...emptyDashboard.charts,
      ...(data.charts ?? {}),
      labels: Array.isArray(data.charts?.labels) ? data.charts.labels : emptyDashboard.charts.labels,
      revenue: Array.isArray(data.charts?.revenue) ? data.charts.revenue : emptyDashboard.charts.revenue,
      bookings: Array.isArray(data.charts?.bookings) ? data.charts.bookings : emptyDashboard.charts.bookings,
      popularDishes: Array.isArray(data.charts?.popularDishes) ? data.charts.popularDishes : emptyDashboard.charts.popularDishes,
      peakHours: Array.isArray(data.charts?.peakHours) ? data.charts.peakHours : emptyDashboard.charts.peakHours,
      customerGrowth: Array.isArray(data.charts?.customerGrowth) ? data.charts.customerGrowth : emptyDashboard.charts.customerGrowth,
      restaurantPerformance: Array.isArray(data.charts?.restaurantPerformance)
        ? data.charts.restaurantPerformance
        : emptyDashboard.charts.restaurantPerformance,
      statusBreakdown: Array.isArray(data.charts?.statusBreakdown) ? data.charts.statusBreakdown : emptyDashboard.charts.statusBreakdown,
    },
    restaurants: Array.isArray(data.restaurants) ? data.restaurants : emptyDashboard.restaurants,
    menuItems: Array.isArray(data.menuItems) ? data.menuItems : emptyDashboard.menuItems,
    tables: Array.isArray(data.tables) ? data.tables : emptyDashboard.tables,
    bookings: Array.isArray(data.bookings) ? data.bookings : emptyDashboard.bookings,
    payments: Array.isArray(data.payments) ? data.payments : emptyDashboard.payments,
    feedback: Array.isArray(data.feedback) ? data.feedback : emptyDashboard.feedback,
    offers: Array.isArray(data.offers) ? data.offers : emptyDashboard.offers,
    adminDeals: Array.isArray(data.adminDeals) ? data.adminDeals : emptyDashboard.adminDeals,
    waitlist: Array.isArray(data.waitlist) ? data.waitlist : emptyDashboard.waitlist,
    notifications: Array.isArray(data.notifications) ? data.notifications : emptyDashboard.notifications,
  };
}

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@])[A-Za-z\d@#$%^&*()_+\-=[\]{};':"\\|,.<>/?!~`]{8,}$/;

function resizeImageFile(file, size = 320) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const scale = Math.min(1, size / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read image file."));
    };

    image.src = objectUrl;
  });
}

const navItems = [
  ["dashboard", "Dashboard", FaChartLine],
  ["restaurants", "Restaurant Management", FaHotel],
  ["menu", "Menu Management", FaUtensils],
  ["tables", "Table Management", FaChair],
  ["layout", "Table Layout Designer", FaMapMarkedAlt],
  ["bookings", "Booking Management", FaCalendarCheck],
  ["waitlist", "Waiting List", FaClock],
  ["orders", "Order Management", FaBookOpen],
  ["customers", "Customer Management", FaUsers],
  ["reviews", "Reviews & Ratings", FaStar],
  ["offers", "Offers & Coupons", FaGift],
  ["notifications", "Notifications", FaBell],
  ["analytics", "Reports & Analytics", FaChartLine],
];

function money(value) {
  return `₹${Number(value ?? 0).toLocaleString("en-IN")}`;
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function AdminCard({ title, value, hint, icon: Icon, tone = "orange", action = null }) {
  const toneClass =
    tone === "green"
      ? "text-emerald-300 bg-emerald-400/10"
      : tone === "blue"
        ? "text-cyan-300 bg-cyan-400/10"
        : tone === "rose"
          ? "text-rose-300 bg-rose-400/10"
          : "text-orange-200 bg-orange-400/10";

  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5 shadow-xl">
      <div className="flex items-center justify-between">
        <div className={`grid h-11 w-11 place-items-center rounded-full ${toneClass}`}>
          <Icon />
        </div>
        {action ?? <div className="h-10 w-24 rounded-full bg-[linear-gradient(90deg,transparent,rgba(255,107,53,0.25),transparent)] opacity-80" />}
      </div>
      <p className="mt-5 text-sm text-slate-400">{title}</p>
      <p className="mt-1 text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function PeriodSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const options = [
    ["daily", "Daily"],
    ["weekly", "Weekly"],
    ["monthly", "Monthly"],
  ];
  const label = options.find(([key]) => key === value)?.[1] ?? "Monthly";

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!ref.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-10 min-w-28 items-center justify-between gap-3 rounded-full border border-white/10 bg-[#211614] px-4 text-sm font-bold text-white shadow-lg shadow-black/20 transition hover:border-orange-300/40 hover:bg-[#2a1a16]"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {label}
        <FaChevronDown className={`text-xs text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-36 overflow-hidden rounded-2xl border border-white/10 bg-[#100b0a] p-1.5 shadow-2xl shadow-black/40">
          {options.map(([key, optionLabel]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                onChange(key);
                setOpen(false);
              }}
              className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                value === key
                  ? "bg-[#ff6b35] text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {optionLabel}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", options, placeholder }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      {options ? (
        <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0f0c0b] px-3 py-3 text-sm text-white outline-none">
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          value={value}
          type={type}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#0f0c0b] px-3 py-3 text-sm text-white outline-none"
        />
      )}
    </label>
  );
}

function PanelSection({ title, subtitle, children }) {
  return (
    <section className="space-y-5">
      <div>
        <p className="section-kicker">Vendor tools</p>
        <h2 className="mt-2 text-3xl font-black text-white">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function DataRows({ rows, columns, empty, actions }) {
  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#17100f]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-[0.16em] text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3">
                  {column}
                </th>
              ))}
              {actions ? <th className="px-4 py-3">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-5 text-slate-400" colSpan={columns.length + (actions ? 1 : 0)}>
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row._id ?? row.id ?? JSON.stringify(row)} className="border-t border-white/10">
                  {columns.map((column) => (
                    <td key={column} className="px-4 py-3 text-slate-300">
                      {typeof row[column] === "boolean" ? (row[column] ? "Yes" : "No") : String(row[column] ?? "-")}
                    </td>
                  ))}
                  {actions ? <td className="px-4 py-3">{actions(row)}</td> : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MiniBars({ values, labels = [] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-52 items-end gap-3 border-b border-white/10 px-2">
      {values.map((value, index) => (
        <div key={`${value}-${index}`} className="flex flex-1 flex-col items-center gap-2">
          <div
            className="w-full rounded-t-2xl bg-[linear-gradient(180deg,#ffd7bd_0%,#ff6b35_45%,rgba(255,107,53,0.12)_100%)] shadow-[0_0_30px_rgba(255,107,53,0.18)]"
            style={{ height: `${Math.max(18, (value / max) * 190)}px` }}
          />
          <span className="text-[10px] uppercase text-slate-500">{labels[index] ?? index + 1}</span>
        </div>
      ))}
    </div>
  );
}

export default function VendorPanel() {
  const navigate = useNavigate();
  const { vendor, isVendorAuthenticated, logoutVendor, updateVendor } = useVendorAuth();
  const [active, setActive] = useState("dashboard");
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState(null);
  const [token, setToken] = useState(getVendorToken());
  const [vendorMenuOpen, setVendorMenuOpen] = useState(false);
  const vendorMenuRef = useRef(null);

  const [restaurantForm, setRestaurantForm] = useState({
    name: "New Dining Room",
    location: "Ahmedabad",
    cuisine: "Indian",
    vibe: "Family Friendly",
    rating: "4.5",
    description: "A premium RestorantBooking partner restaurant.",
    image: "",
    images: "",
    timing: "Mon-Sun 10:00 AM - 11:00 PM",
    contact: "+91 98765 43210",
    facilities: "WiFi, Parking, Family Seating",
    branchCode: "BR-01",
    isActive: "true",
  });
  const [menuForm, setMenuForm] = useState({
    restaurantId: "",
    name: "Paneer Tikka",
    category: "Starter",
    price: "299",
    available: "true",
    isVeg: "true",
    isCombo: "false",
    isFestival: "false",
    isTodaySpecial: "true",
    image: "",
    addons: "Extra Cheese, Butter Naan",
    specialOffer: "Lunch Combo",
  });
  const [tableForm, setTableForm] = useState({
    restaurantId: "",
    tableId: "T1",
    type: "Family",
    seats: "4",
    floor: "Ground",
    price: "500",
    status: "available",
    x: "10",
    y: "15",
  });
  const [offerForm, setOfferForm] = useState({
    restaurantId: "",
    code: "SAVE20",
    discount: "20",
    minOrder: "1000",
    validUntil: "2026-06-30",
    isActive: "true",
  });
  const [waitlistForm, setWaitlistForm] = useState({
    restaurantId: "",
    name: "Amit",
    phone: "9876543210",
    email: "",
    guests: "3",
    date: todayInputValue(),
    time: "19:30",
    slot: "dinner",
    tableType: "Family",
    estimatedWait: "20 mins",
  });
  const [couponNotes, setCouponNotes] = useState("Festival offer: Holi special");
  const [bookingFilter, setBookingFilter] = useState("all");
  const [analyticsPeriod, setAnalyticsPeriod] = useState("monthly");
  const [layoutSection, setLayoutSection] = useState("All");
  const [vendorProfileForm, setVendorProfileForm] = useState({
    name: vendor?.name ?? "",
    businessName: vendor?.businessName ?? "",
    phone: vendor?.phone ?? "",
    logo: vendor?.logo ?? "",
  });
  const [vendorPasswordForm, setVendorPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const loadDashboard = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await apiGet(`/vendor/dashboard?period=${analyticsPeriod}`, getVendorToken());
      setDashboard(normalizeDashboard(response));
      setToken(getVendorToken());
      setStatus("ready");
    } catch (error) {
      setStatus(error.message || "Unable to load vendor dashboard");
    }
  }, [analyticsPeriod]);

  useEffect(() => {
    if (!isVendorAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isVendorAuthenticated, loadDashboard, navigate]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVendorProfileForm({
        name: vendor?.name ?? "",
        businessName: vendor?.businessName ?? "",
        phone: vendor?.phone ?? "",
        logo: vendor?.logo ?? "",
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [vendor]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!vendorMenuRef.current?.contains(event.target)) {
        setVendorMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const restaurantOptions = useMemo(
    () => dashboard.restaurants.map((restaurant) => ({ id: restaurant._id, label: `${restaurant.name} - ${restaurant.location}` })),
    [dashboard.restaurants],
  );
  const defaultRestaurantId = dashboard.restaurants[0]?._id ?? "";
  const primaryRestaurant = dashboard.restaurants[0] ?? null;
  const primaryRestaurantOnline = primaryRestaurant?.isActive !== false;
  const revenueTotal = dashboard.summary.totalRevenue || dashboard.charts.revenue.reduce((sum, item) => sum + item, 0);
  const selectedBooking = dashboard.bookings[0];
  const occupancyRate = dashboard.summary.occupancyRate || Math.min(100, Math.round((dashboard.summary.todaysBookings / Math.max(dashboard.summary.availableTables || 1, 1)) * 12));
  const pendingBookings = dashboard.bookings.filter((booking) => booking.status === "pending");
  const confirmedBookings = dashboard.bookings.filter((booking) => booking.status === "confirmed");
  const customerCards = Array.from(
    new Map(
      dashboard.bookings
        .filter((booking) => booking.customerEmail || booking.customerPhone || booking.customerName)
        .map((booking) => [booking.customerEmail || booking.customerPhone || booking._id, booking]),
    ).values(),
  );
  const filteredBookings =
    bookingFilter === "pending" ? pendingBookings : bookingFilter === "confirmed" ? confirmedBookings : dashboard.bookings;
  const vendorDisplayName = vendor?.name?.trim() || vendor?.email?.split("@")[0] || "Vendor";
  const vendorInitials = vendorDisplayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "V";
  const bestDish = dashboard.charts.popularDishes[0];
  const peakHour = dashboard.charts.peakHours[0];
  const customerGrowthTotal = dashboard.charts.customerGrowth.reduce((sum, item) => sum + Number(item.customers ?? 0), 0);

  const postAction = async (path, payload, success) => {
    setMessage(null);
    try {
      await apiPost(path, payload, token);
      setMessage({ type: "success", text: success });
      await loadDashboard();
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Action failed" });
    }
  };

  const patchAction = async (path, payload, success) => {
    setMessage(null);
    try {
      await apiPatch(path, payload, token);
      setMessage({ type: "success", text: success });
      await loadDashboard();
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Action failed" });
    }
  };

  const approveBooking = (booking) => {
    patchAction(`/vendor/bookings/${booking._id}/status`, { status: "confirmed", slot: booking.slot, time: booking.time }, "Booking approved");
  };

  const rejectBooking = (booking) => {
    patchAction(`/vendor/bookings/${booking._id}/status`, { status: "cancelled", slot: booking.slot, time: booking.time }, "Booking rejected");
  };

  const rescheduleBooking = (booking) => {
    const nextDate = window.prompt("Enter new booking date (YYYY-MM-DD)", booking.date ?? "");
    if (!nextDate) return;
    const nextTime = window.prompt("Enter new booking time (HH:mm)", booking.time ?? "");
    if (!nextTime) return;
    patchAction(
      `/vendor/bookings/${booking._id}`,
      { date: nextDate, time: nextTime, status: "pending" },
      "Booking rescheduled",
    );
  };

  const saveTableLayout = async (table, x, y) => {
    setMessage(null);
    try {
      await apiPatch(`/vendor/tables/${table._id}`, { layout: { x, y } }, token);
      setMessage({ type: "success", text: "Table layout saved" });
      await loadDashboard();
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Could not save table layout" });
    }
  };

  const saveVendorProfile = async (event) => {
    event.preventDefault();
    setMessage(null);

    const payload = {
      name: vendorProfileForm.name.trim(),
      businessName: vendorProfileForm.businessName.trim(),
      phone: vendorProfileForm.phone.trim(),
      logo: vendorProfileForm.logo,
    };

    try {
      const updatedVendor = await apiPatch("/vendor/me", payload, token);
      updateVendor(updatedVendor);
      setVendorProfileForm({
        name: updatedVendor.name ?? "",
        businessName: updatedVendor.businessName ?? "",
        phone: updatedVendor.phone ?? "",
        logo: updatedVendor.logo ?? "",
      });
      setMessage({ type: "success", text: "Vendor profile updated" });
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Could not save vendor profile" });
    }
  };

  const changeVendorPassword = async (event) => {
    event.preventDefault();
    setMessage(null);

    if (vendorPasswordForm.newPassword !== vendorPasswordForm.confirmPassword) {
      setMessage({ type: "error", text: "New password and confirm password must match" });
      return;
    }

    if (!passwordPattern.test(vendorPasswordForm.newPassword)) {
      setMessage({ type: "error", text: "New password must have uppercase, lowercase, number, and @" });
      return;
    }

    try {
      await apiPost("/vendor/change-password", vendorPasswordForm, token);
      setVendorPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setMessage({ type: "success", text: "Vendor password updated successfully" });
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Could not update password" });
    }
  };

  const togglePrimaryRestaurantStatus = async () => {
    if (!primaryRestaurant) return;
    await patchAction(
      `/vendor/restaurants/${primaryRestaurant._id}`,
      { isActive: !primaryRestaurantOnline },
      !primaryRestaurantOnline ? "Restaurant is online" : "Restaurant is offline",
    );
  };

  const handleVendorLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please choose an image file for the logo" });
      return;
    }

    try {
      const logo = await resizeImageFile(file);
      setVendorProfileForm((current) => ({ ...current, logo }));
      setMessage(null);
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Could not prepare logo image" });
    }
  };

  const deleteAction = async (path, success) => {
    setMessage(null);
    try {
      await apiDelete(path, token);
      setMessage({ type: "success", text: success });
      await loadDashboard();
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Action failed" });
    }
  };

  const dashboardCards = [
    ["Today's Bookings", dashboard.summary.todaysBookings, "Reservations for current date", FaCalendarCheck, "blue"],
    ["Upcoming Bookings", dashboard.summary.upcomingBookings, "Future reservations scheduled", FaCalendarAlt, "blue"],
    [
      "Total Revenue",
      money(revenueTotal),
      `${analyticsPeriod[0].toUpperCase()}${analyticsPeriod.slice(1)} revenue`,
      FaDollarSign,
      "green",
      <PeriodSelect value={analyticsPeriod} onChange={setAnalyticsPeriod} />,
    ],
    ["Total Customers", dashboard.summary.totalCustomers, "Returning and new diners", FaUsers, "blue"],
    ["Popular Dishes", dashboard.charts.popularDishes.length || dashboard.menuItems.length, "Top-selling items tracked", FaUtensils, "orange"],
    ["Occupancy Rate", `${occupancyRate}%`, "Live table utilization", FaChair, "rose"],
    ["Pending Bookings", dashboard.summary.pendingBookings, "Need approval or action", FaClock, "orange"],
  ];

  const quickLinks = [
    ["Add Restaurant", () => setActive("restaurants")],
    ["Add Food Item", () => setActive("menu")],
    ["Add Table", () => setActive("tables")],
    ["Create Coupon", () => setActive("offers")],
  ];

  return (
    <div className="min-h-screen bg-[#100b0a] text-white">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-white/10 bg-[#15100f] p-5 xl:block">
        <Link to="/" className="mb-8 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ff6b35] font-black">F</span>
          <div>
            <p className="text-2xl font-black">RestorantBooking</p>
          </div>
        </Link>
        <nav className="space-y-2">
          {navItems.map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition ${
                active === key ? "bg-[#ff6b35]/20 text-white shadow-[inset_4px_0_0_#ff6b35]" : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="xl:pl-72">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#100b0a]/90 px-4 py-4 backdrop-blur-xl sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-slate-400">Hello,</p>
              <h1 className="text-xl font-black">
                {vendor?.name ?? "Vendor"} - {vendor?.businessName ?? "RestorantBooking Admin"}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {primaryRestaurant ? (
                <button
                  type="button"
                  onClick={togglePrimaryRestaurantStatus}
                  className={`flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-bold transition ${
                    primaryRestaurantOnline
                      ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-100"
                      : "border-rose-400/30 bg-rose-400/15 text-rose-100"
                  }`}
                  title={`${primaryRestaurant.name} is ${primaryRestaurantOnline ? "online" : "offline"}`}
                >
                  <span className={`h-3 w-3 rounded-full ${primaryRestaurantOnline ? "bg-emerald-300" : "bg-rose-300"}`} />
                  {primaryRestaurantOnline ? "Online" : "Offline"}
                </button>
              ) : null}
              <label className="flex min-w-[240px] items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                <FaSearch />
                <input placeholder="Search restaurants, bookings..." className="min-w-0 flex-1 bg-transparent outline-none" />
              </label>
              <button
                type="button"
                onClick={() => setActive("notifications")}
                className="relative grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/5 text-orange-200 transition hover:border-white/20 hover:bg-white/10"
                aria-label="Notifications"
              >
                <FaBell />
                {dashboard.notifications.length > 0 ? (
                  <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#ff6b35] px-1.5 py-0.5 text-center text-[10px] font-black text-white">
                    {dashboard.notifications.length > 9 ? "9+" : dashboard.notifications.length}
                  </span>
                ) : null}
              </button>
              <div ref={vendorMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setVendorMenuOpen((value) => !value)}
                  className="flex h-12 items-center gap-3 rounded-full border border-white/10 bg-white/5 pl-1.5 pr-4 text-left text-slate-200 shadow-lg shadow-black/10 transition hover:border-white/20 hover:bg-white/10"
                  aria-expanded={vendorMenuOpen}
                  aria-haspopup="menu"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#ffbe7a] to-[#58c7ff] text-sm font-black text-slate-950">
                    {vendor?.logo ? <img src={vendor.logo} alt="" className="h-full w-full object-cover" /> : vendorInitials}
                  </span>
                  <span className="max-w-[8.5rem] truncate text-sm font-semibold">{vendorDisplayName}</span>
                  <FaChevronDown className={`text-xs text-slate-400 transition ${vendorMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {vendorMenuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#15100f]/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActive("profile");
                        setVendorMenuOpen(false);
                      }}
                      className="block w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
                    >
                      Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActive("notifications");
                        setVendorMenuOpen(false);
                      }}
                      className="block w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
                    >
                      Notifications
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        logoutVendor();
                        setVendorMenuOpen(false);
                        navigate("/login", { replace: true });
                      }}
                      className="block w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-rose-200 transition hover:bg-rose-400/10 hover:text-rose-100"
                    >
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 py-6 sm:px-6">
          <div className="mb-5 flex gap-2 overflow-x-auto xl:hidden">
            {navItems.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${active === key ? "bg-[#ff6b35] text-white" : "bg-white/5 text-slate-300"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {status !== "ready" ? <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">{status === "loading" ? "Loading vendor data..." : status}</div> : null}

          {message ? <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${message.type === "success" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-rose-400/30 bg-rose-400/10 text-rose-200"}`}>{message.text}</div> : null}

          {active === "dashboard" ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {dashboardCards.map(([title, value, hint, Icon, tone, action]) => (
                  <AdminCard key={title} title={title} value={value} hint={hint} icon={Icon} tone={tone} action={action} />
                ))}
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                <section className="rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-xl font-black">Revenue Trend</h2>
                  </div>
                  <MiniBars values={dashboard.charts.revenue} labels={dashboard.charts.labels} />
                </section>

                <section className="rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5">
                  <h2 className="text-xl font-black">Quick Actions</h2>
                  <div className="mt-4 grid gap-3">
                    {quickLinks.map(([label, action]) => (
                      <button key={label} onClick={action} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-bold text-slate-200">
                        <span>{label}</span>
                        <FaPlusCircle className="text-orange-300" />
                      </button>
                    ))}
                  </div>
                  <div className="mt-5 rounded-xl border border-white/10 bg-[#0f0c0b] p-4 text-sm text-slate-300">
                    <p className="font-bold text-white">Operational snapshot</p>
                    <p className="mt-2">Restaurants, bookings, tables, offers, and customer activity are surfaced here so the vendor team can monitor the full business at a glance.</p>
                  </div>
                </section>
              </div>

              <section className="rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5">
                <h2 className="mb-4 text-xl font-black">Popular Dishes</h2>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {(dashboard.charts.popularDishes.length ? dashboard.charts.popularDishes : dashboard.menuItems.slice(0, 6).map((item, index) => ({ name: item.name, orders: 60 - index * 7 }))).map((dish) => (
                    <div key={dish.name} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                      <span className="font-bold">{dish.name}</span>
                      <span className="text-orange-200">{dish.orders} orders</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : null}

          {active === "profile" ? (
            <PanelSection title="Vendor Profile" subtitle="Update owner details, business name, contact info, logo, and account password.">
              <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                <form
                  onSubmit={saveVendorProfile}
                  className="rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5"
                >
                  <div className="mb-5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-300">Profile details</p>
                      <h3 className="mt-2 text-2xl font-black text-white">Business account</h3>
                    </div>
                  </div>
                  <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Logo</p>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-[#0f0c0b]">
                        {vendorProfileForm.logo ? (
                          <img src={vendorProfileForm.logo} alt="Vendor logo" className="h-full w-full object-cover" />
                        ) : (
                          <FaImage className="text-2xl text-slate-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap gap-3">
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#ff6b35] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#ff7b49]">
                            <FaUpload />
                            Add logo
                            <input type="file" accept="image/*" onChange={handleVendorLogoUpload} className="sr-only" />
                          </label>
                          <button
                            type="button"
                            onClick={() => setVendorProfileForm((current) => ({ ...current, logo: "" }))}
                            className="rounded-full border border-white/10 px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-white/10"
                          >
                            Remove
                          </button>
                        </div>
                        <p className="mt-3 text-sm text-slate-400">Upload an image or paste a logo URL below. Save profile to keep the change.</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Owner name" value={vendorProfileForm.name} onChange={(value) => setVendorProfileForm((current) => ({ ...current, name: value }))} />
                    <Field label="Business name" value={vendorProfileForm.businessName} onChange={(value) => setVendorProfileForm((current) => ({ ...current, businessName: value }))} />
                    <Field label="Phone" value={vendorProfileForm.phone} onChange={(value) => setVendorProfileForm((current) => ({ ...current, phone: value }))} />
                    <Field label="Logo URL" value={vendorProfileForm.logo} onChange={(value) => setVendorProfileForm((current) => ({ ...current, logo: value }))} />
                  </div>
                  <button className="mt-5 rounded-full bg-[#ff6b35] px-5 py-3 font-black text-white transition hover:bg-[#ff7b49]">Save profile</button>
                </form>

                <form onSubmit={changeVendorPassword} className="rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5">
                  <div className="mb-5">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-300">Security</p>
                    <h3 className="mt-2 text-2xl font-black text-white">Change password</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">Use your current password before setting a new vendor password.</p>
                  </div>
                  <div className="grid gap-4">
                    <Field label="Old password" type="password" value={vendorPasswordForm.oldPassword} onChange={(value) => setVendorPasswordForm((current) => ({ ...current, oldPassword: value }))} />
                    <Field label="New password" type="password" value={vendorPasswordForm.newPassword} onChange={(value) => setVendorPasswordForm((current) => ({ ...current, newPassword: value }))} />
                    <Field label="Confirm password" type="password" value={vendorPasswordForm.confirmPassword} onChange={(value) => setVendorPasswordForm((current) => ({ ...current, confirmPassword: value }))} />
                  </div>
                  <p className="mt-4 text-xs leading-6 text-slate-500">Password must have 1 uppercase, 1 lowercase, 1 number, and 1 @.</p>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button className="rounded-full border border-white/10 px-5 py-3 font-black text-white transition hover:bg-white/10">Update password</button>
                    <a
                      href={`mailto:${vendor?.email ?? ""}?subject=RestorantBooking vendor password reset&body=Please help me reset my RestorantBooking vendor password for ${vendor?.email ?? ""}.`}
                      className="text-sm font-semibold text-orange-200 transition hover:text-white"
                    >
                      Forgot password?
                    </a>
                  </div>
                </form>
              </div>
            </PanelSection>
          ) : null}

          {active === "restaurants" ? (
            <PanelSection title="Multiple Restaurant Management" subtitle="Add, edit, delete, attach images, manage timing, contact details, location, and active status for every branch.">
              <div className="grid gap-5 xl:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)]">
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    postAction(
                      "/vendor/restaurants",
                      {
                        ...restaurantForm,
                        rating: Number(restaurantForm.rating),
                        facilities: restaurantForm.facilities.split(",").map((item) => item.trim()).filter(Boolean),
                        images: restaurantForm.images.split(",").map((item) => item.trim()).filter(Boolean).concat(restaurantForm.image ? [restaurantForm.image] : []),
                        isActive: restaurantForm.isActive === "true",
                      },
                      "Restaurant added",
                    );
                  }}
                  className="rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5"
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-300">Create branch</p>
                      <h3 className="mt-2 text-2xl font-black text-white">Restaurant details</h3>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300">New</span>
                  </div>

                  <div className="space-y-5">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Basics</p>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Restaurant Name" value={restaurantForm.name} onChange={(value) => setRestaurantForm((form) => ({ ...form, name: value }))} />
                        <Field label="Branch Code" value={restaurantForm.branchCode} onChange={(value) => setRestaurantForm((form) => ({ ...form, branchCode: value }))} />
                        <Field label="Location" value={restaurantForm.location} onChange={(value) => setRestaurantForm((form) => ({ ...form, location: value }))} />
                        <Field label="Cuisine" value={restaurantForm.cuisine} onChange={(value) => setRestaurantForm((form) => ({ ...form, cuisine: value }))} />
                        <Field label="Vibe" value={restaurantForm.vibe} onChange={(value) => setRestaurantForm((form) => ({ ...form, vibe: value }))} />
                        <Field label="Rating" value={restaurantForm.rating} onChange={(value) => setRestaurantForm((form) => ({ ...form, rating: value }))} />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Operations</p>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Timing" value={restaurantForm.timing} onChange={(value) => setRestaurantForm((form) => ({ ...form, timing: value }))} />
                        <Field label="Contact Details" value={restaurantForm.contact} onChange={(value) => setRestaurantForm((form) => ({ ...form, contact: value }))} />
                        <Field label="Status" value={restaurantForm.isActive} options={["true", "false"]} onChange={(value) => setRestaurantForm((form) => ({ ...form, isActive: value }))} />
                        <Field label="Facilities" value={restaurantForm.facilities} onChange={(value) => setRestaurantForm((form) => ({ ...form, facilities: value }))} />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Media & description</p>
                      <div className="grid gap-4">
                        <Field label="Primary Image URL" value={restaurantForm.image} onChange={(value) => setRestaurantForm((form) => ({ ...form, image: value }))} />
                        <Field label="Restaurant Gallery Images" value={restaurantForm.images} onChange={(value) => setRestaurantForm((form) => ({ ...form, images: value }))} placeholder="URL 1, URL 2" />
                        <Field label="Description" value={restaurantForm.description} onChange={(value) => setRestaurantForm((form) => ({ ...form, description: value }))} />
                      </div>
                    </div>
                  </div>

                  <button className="mt-5 w-full rounded-full bg-[#ff6b35] px-5 py-3 font-black text-white transition hover:bg-[#ff7b49]">Add Restaurant</button>
                </form>

                <div className="space-y-4">
                  <div className="rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-300">Branches</p>
                        <h3 className="mt-2 text-2xl font-black text-white">{dashboard.restaurants.length} restaurants</h3>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200">
                        {dashboard.restaurants.filter((restaurant) => restaurant.isActive !== false).length} active
                      </div>
                    </div>
                  </div>
                  <RestaurantGrid restaurants={dashboard.restaurants} token={token} reload={loadDashboard} setMessage={setMessage} />
                </div>
              </div>
            </PanelSection>
          ) : null}

          {active === "menu" ? (
            <PanelSection title="Menu Management" subtitle="Add categories, subcategories, food items, add-ons, combo meals, special offers, veg/non-veg tags, and live availability toggles.">
              <div className="grid gap-5 xl:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)]">
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const restaurantId = menuForm.restaurantId || defaultRestaurantId;
                    if (!restaurantId) return;
                    postAction(
                      "/vendor/menu",
                      {
                        ...menuForm,
                        restaurantId,
                        price: Number(menuForm.price),
                        available: menuForm.available === "true",
                        isVeg: menuForm.isVeg === "true",
                        isCombo: menuForm.isCombo === "true",
                        isFestival: menuForm.isFestival === "true",
                        isTodaySpecial: menuForm.isTodaySpecial === "true",
                        location: dashboard.restaurants.find((item) => item._id === restaurantId)?.location ?? "",
                      },
                      "Dish added",
                    );
                  }}
                  className="rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5"
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-300">Create dish</p>
                      <h3 className="mt-2 text-2xl font-black text-white">Menu item details</h3>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300">Food</span>
                  </div>

                  <div className="space-y-5">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Restaurant</p>
                      <label className="block">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Branch</span>
                        <div className="relative">
                          <select
                            required
                            disabled={restaurantOptions.length === 0}
                            value={menuForm.restaurantId || defaultRestaurantId}
                            onChange={(event) => setMenuForm((form) => ({ ...form, restaurantId: event.target.value }))}
                            className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-[#0f0c0b] px-4 pr-10 text-sm font-semibold text-white outline-none transition focus:border-orange-300/50 disabled:cursor-not-allowed disabled:text-slate-500"
                          >
                            {restaurantOptions.length === 0 ? <option value="">Add a restaurant first</option> : <option value="">Select restaurant</option>}
                            {restaurantOptions.map((option) => (
                              <option key={option.id} value={option.id} className="bg-[#0f0c0b] text-white">
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <FaChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                        </div>
                      </label>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Dish info</p>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Dish" value={menuForm.name} onChange={(value) => setMenuForm((form) => ({ ...form, name: value }))} />
                        <Field label="Category" value={menuForm.category} onChange={(value) => setMenuForm((form) => ({ ...form, category: value }))} />
                        <Field label="Price" value={menuForm.price} onChange={(value) => setMenuForm((form) => ({ ...form, price: value }))} />
                        <Field label="Available" value={menuForm.available} options={["true", "false"]} onChange={(value) => setMenuForm((form) => ({ ...form, available: value }))} />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Tags & offers</p>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Veg" value={menuForm.isVeg} options={["true", "false"]} onChange={(value) => setMenuForm((form) => ({ ...form, isVeg: value }))} />
                        <Field label="Combo" value={menuForm.isCombo} options={["true", "false"]} onChange={(value) => setMenuForm((form) => ({ ...form, isCombo: value }))} />
                        <Field label="Festival Menu" value={menuForm.isFestival} options={["true", "false"]} onChange={(value) => setMenuForm((form) => ({ ...form, isFestival: value }))} />
                        <Field label="Today Special" value={menuForm.isTodaySpecial} options={["true", "false"]} onChange={(value) => setMenuForm((form) => ({ ...form, isTodaySpecial: value }))} />
                        <Field label="Add-ons" value={menuForm.addons} onChange={(value) => setMenuForm((form) => ({ ...form, addons: value }))} />
                        <Field label="Special Offer" value={menuForm.specialOffer} onChange={(value) => setMenuForm((form) => ({ ...form, specialOffer: value }))} />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Media</p>
                      <Field label="Food Image URL" value={menuForm.image} onChange={(value) => setMenuForm((form) => ({ ...form, image: value }))} />
                    </div>
                  </div>

                  <button disabled={!(menuForm.restaurantId || defaultRestaurantId)} className="mt-5 w-full rounded-full bg-[#ff6b35] px-5 py-3 font-black text-white transition hover:bg-[#ff7b49] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500">Add Dish</button>
                </form>
                <div className="space-y-5">
                  <div className="rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-300">Menu catalog</p>
                        <h3 className="mt-2 text-2xl font-black text-white">{dashboard.menuItems.length} dishes</h3>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200">
                        {dashboard.menuItems.filter((item) => item.available !== false).length} available
                      </div>
                    </div>
                  </div>
                  <MenuGrid items={dashboard.menuItems} onToggle={(row) => patchAction(`/vendor/menu/${row._id}`, { available: !row.available }, "Dish availability updated")} onDelete={(row) => deleteAction(`/vendor/menu/${row._id}`, "Dish deleted")} />
                  <div className="grid gap-4 rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5 md:grid-cols-2">
                    <div>
                      <h3 className="text-lg font-black">Add-ons Management</h3>
                      <p className="mt-2 text-sm text-slate-400">Build extra toppings, sides, and modifiers for dishes.</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-black">Combo Meals</h3>
                      <p className="mt-2 text-sm text-slate-400">Bundle items into lunch, family, or festival combos.</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-black">Special Offers</h3>
                      <p className="mt-2 text-sm text-slate-400">Highlight today special and limited-time menu offers.</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-black">Availability</h3>
                      <p className="mt-2 text-sm text-slate-400">Flip dishes between available and out of stock instantly.</p>
                    </div>
                  </div>
                </div>
              </div>
            </PanelSection>
          ) : null}

          {active === "tables" ? (
            <PanelSection title="Table Management" subtitle="Add, edit, delete, and classify tables by number, capacity, type, and status.">
              <div className="grid gap-5 xl:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)]">
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const restaurantId = tableForm.restaurantId || defaultRestaurantId;
                    if (!restaurantId) return;
                    postAction(
                      "/vendor/tables",
                      {
                        ...tableForm,
                        restaurantId,
                        seats: Number(tableForm.seats),
                        price: Number(tableForm.price),
                        city: dashboard.restaurants.find((item) => item._id === restaurantId)?.location ?? "",
                        layout: { x: Number(tableForm.x), y: Number(tableForm.y) },
                      },
                      "Table added",
                    );
                  }}
                  className="rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5"
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-300">Create table</p>
                      <h3 className="mt-2 text-2xl font-black text-white">Table details</h3>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300">Floor plan</span>
                  </div>

                  <div className="space-y-5">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Restaurant</p>
                      <label className="block">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Branch</span>
                        <div className="relative">
                          <select
                            required
                            disabled={restaurantOptions.length === 0}
                            value={tableForm.restaurantId || defaultRestaurantId}
                            onChange={(event) => setTableForm((form) => ({ ...form, restaurantId: event.target.value }))}
                            className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-[#0f0c0b] px-4 pr-10 text-sm font-semibold text-white outline-none transition focus:border-orange-300/50 disabled:cursor-not-allowed disabled:text-slate-500"
                          >
                            {restaurantOptions.length === 0 ? <option value="">Add a restaurant first</option> : <option value="">Select restaurant</option>}
                            {restaurantOptions.map((option) => (
                              <option key={option.id} value={option.id} className="bg-[#0f0c0b] text-white">
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <FaChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                        </div>
                      </label>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Table info</p>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Table Number" value={tableForm.tableId} onChange={(value) => setTableForm((form) => ({ ...form, tableId: value }))} />
                        <Field label="Type" value={tableForm.type} options={["Couple", "Family", "VIP", "Outdoor", "Indoor", "Private", "Rooftop"]} onChange={(value) => setTableForm((form) => ({ ...form, type: value }))} />
                        <Field label="Seating Capacity" value={tableForm.seats} onChange={(value) => setTableForm((form) => ({ ...form, seats: value }))} />
                        <Field label="Floor" value={tableForm.floor} onChange={(value) => setTableForm((form) => ({ ...form, floor: value }))} />
                        <Field label="Reservation Fee" value={tableForm.price} onChange={(value) => setTableForm((form) => ({ ...form, price: value }))} />
                        <Field label="Status" value={tableForm.status} options={["available", "reserved", "occupied", "maintenance"]} onChange={(value) => setTableForm((form) => ({ ...form, status: value }))} />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Layout position</p>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Layout X" value={tableForm.x} onChange={(value) => setTableForm((form) => ({ ...form, x: value }))} />
                        <Field label="Layout Y" value={tableForm.y} onChange={(value) => setTableForm((form) => ({ ...form, y: value }))} />
                      </div>
                    </div>
                  </div>

                  <button disabled={!(tableForm.restaurantId || defaultRestaurantId)} className="mt-5 w-full rounded-full bg-[#ff6b35] px-5 py-3 font-black text-white transition hover:bg-[#ff7b49] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500">Add Table</button>
                </form>
                <div className="space-y-5">
                  <div className="rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-300">Table inventory</p>
                        <h3 className="mt-2 text-2xl font-black text-white">{dashboard.tables.length} tables</h3>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200">
                        {dashboard.tables.filter((table) => table.status === "available").length} available
                      </div>
                    </div>
                  </div>
                  <TableLayout tables={dashboard.tables} />
                  <TableGrid tables={dashboard.tables} onToggle={(row) => patchAction(`/vendor/tables/${row._id}`, { status: row.status === "available" ? "reserved" : "available" }, "Table updated")} onDelete={(row) => deleteAction(`/vendor/tables/${row._id}`, "Table deleted")} />
                </div>
              </div>
            </PanelSection>
          ) : null}

          {active === "layout" ? (
            <PanelSection title="Table Layout Designer" subtitle="Drag-and-drop floor plan mode for indoor, outdoor, and VIP table zones.">
              <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
                <div className="rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5">
                  <h3 className="text-xl font-black">Layout Controls</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">Select a zone, drag tables on the floor plan, and release to save the placement for live availability views.</p>
                  <div className="mt-5 grid gap-3">
                    {["All", "Indoor", "Outdoor", "VIP"].map((section) => {
                      const count = section === "All"
                        ? dashboard.tables.length
                        : dashboard.tables.filter((table) => String(table.type ?? "").toLowerCase() === section.toLowerCase()).length;
                      return (
                        <button
                          key={section}
                          type="button"
                          onClick={() => setLayoutSection(section)}
                          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-bold transition ${
                            layoutSection === section
                              ? "border-orange-300/50 bg-orange-400/15 text-orange-100"
                              : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                          }`}
                        >
                          <span>{section} Section</span>
                          <span className="rounded-full bg-black/20 px-2 py-1 text-xs text-slate-300">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                    <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-400" /> Available</div>
                    <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-orange-400" /> Reserved or booked</div>
                    <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-400" /> Occupied</div>
                  </div>
                </div>
                <TableLayout tables={dashboard.tables} section={layoutSection} onMove={saveTableLayout} />
              </div>
            </PanelSection>
          ) : null}

          {active === "bookings" ? (
            <PanelSection title="Booking Management" subtitle="View all bookings, approve, reject, reschedule, cancel, and review booking notes and customer details.">
              <div className="flex flex-wrap gap-2">
                {[
                  ["all", `Recent Bookings (${dashboard.bookings.length})`],
                  ["confirmed", `Confirmed (${confirmedBookings.length})`],
                  ["pending", `Pending (${pendingBookings.length})`],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setBookingFilter(value)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      bookingFilter === value
                        ? "bg-[#ff6b35] text-white"
                        : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <DataRows
                rows={filteredBookings}
                columns={["restaurantName", "customerName", "customerEmail", "customerPhone", "date", "time", "slot", "guests", "tableId", "status"]}
                empty={bookingFilter === "all" ? "No recent bookings yet" : `No ${bookingFilter} bookings yet`}
                actions={(booking) => (
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      disabled={booking.status === "confirmed"}
                      onClick={() => approveBooking(booking)}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-3 py-2 text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FaCheckIcon /> Approve
                    </button>
                    <button
                      type="button"
                      disabled={booking.status === "cancelled"}
                      onClick={() => rejectBooking(booking)}
                      className="inline-flex items-center gap-1 rounded-full bg-rose-400/10 px-3 py-2 text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FaMinusCircle /> Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => rescheduleBooking(booking)}
                      className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-2"
                    >
                      <FaExchangeAlt /> Reschedule
                    </button>
                  </div>
                )}
              />
              <div className="mt-5 rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5">
                <h3 className="text-xl font-black">Booking Notes</h3>
                <p className="mt-2 text-sm text-slate-400">Customer requests, special instructions, and reservation history are stored with each booking entry.</p>
                {selectedBooking ? (
                  <div className="mt-4 space-y-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                    <p>Latest booking: {selectedBooking.restaurantName} on {selectedBooking.date} at {selectedBooking.time}</p>
                    <p>Customer: {selectedBooking.customerName || "Unknown"} | {selectedBooking.customerEmail || "No email"} | {selectedBooking.customerPhone || "No phone"}</p>
                    <p>Status: {selectedBooking.status}</p>
                  </div>
                ) : null}
              </div>
            </PanelSection>
          ) : null}

          {active === "waitlist" ? (
            <PanelSection title="Waiting List Management" subtitle="Add customers to the queue, auto-assign tables, and notify guests when seating becomes available.">
              <div className="grid gap-5 xl:grid-cols-[minmax(340px,0.8fr)_minmax(0,1.2fr)]">
                <CatalogForm
                  type="waitlist"
                  restaurantOptions={restaurantOptions}
                  defaultRestaurantId={defaultRestaurantId}
                  form={waitlistForm}
                  setForm={setWaitlistForm}
                  onSubmit={() =>
                    postAction(
                      "/vendor/waitlist",
                      {
                        ...waitlistForm,
                        restaurantId: waitlistForm.restaurantId || defaultRestaurantId,
                        guests: Number(waitlistForm.guests),
                      },
                      "Waitlist guest added",
                    )
                  }
                />
                <div className="space-y-5">
                  <ModuleSummary eyebrow="Queue status" title={`${dashboard.waitlist.length} waiting guests`} badge={`${dashboard.waitlist.filter((item) => item.status === "waiting").length} active`} />
                  <WaitlistGrid
                    rows={dashboard.waitlist}
                    onNotify={(row) => patchAction(`/vendor/waitlist/${row._id}`, { status: "notified" }, "Guest notified")}
                    onSeat={(row) => patchAction(`/vendor/waitlist/${row._id}`, { status: "seated" }, "Guest seated")}
                    onCancel={(row) => patchAction(`/vendor/waitlist/${row._id}`, { status: "cancelled" }, "Waitlist guest cancelled")}
                    onDelete={(row) => deleteAction(`/vendor/waitlist/${row._id}`, "Waitlist guest deleted")}
                  />
                  <div className="rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5">
                    <h3 className="text-lg font-black">Auto Assignment</h3>
                    <p className="mt-2 text-sm text-slate-400">When a table becomes free, the next guest can be notified and moved to seated automatically.</p>
                  </div>
                </div>
              </div>
            </PanelSection>
          ) : null}

          {active === "orders" ? (
            <PanelSection title="Order Management" subtitle="Pre-orders, live order view, status changes, billing, and order history for every restaurant.">
              <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                  <MetricTile title="Pre-orders" value={dashboard.bookings.filter((booking) => booking.items?.length).length} text="Bookings with selected menu items." icon={FaUtensils} />
                  <MetricTile title="Open orders" value={dashboard.bookings.filter((booking) => ["pending", "confirmed", "checked_in"].includes(booking.status)).length} text="Need kitchen or service attention." icon={FaEye} />
                  <MetricTile title="Billing ready" value={dashboard.payments.length} text="Paid orders and invoice-ready records." icon={FaDollarSign} />
                </div>
                <div className="space-y-5">
                  <ModuleSummary eyebrow="Live orders" title={`${dashboard.bookings.length} order records`} badge="Booking linked" />
                  <OrderGrid rows={dashboard.bookings} />
                </div>
              </div>
            </PanelSection>
          ) : null}

          {active === "customers" ? (
            <PanelSection title="Customer Management" subtitle="Track customer list, visit history, favorite customers, reviews, and private notes.">
              <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                  <MetricTile title="Customers" value={customerCards.length} text="Unique diners from bookings." icon={FaUsers} />
                  <MetricTile title="Reviews" value={dashboard.feedback.length} text="Feedback linked to customers." icon={FaCommentDots} />
                  <MetricTile title="Repeat signals" value={Math.max(0, dashboard.bookings.length - customerCards.length)} text="Multiple visits and rebookings." icon={FaStar} />
                </div>
                <div className="space-y-5">
                  <ModuleSummary eyebrow="Customer details" title={`${customerCards.length} customer profiles`} badge="From bookings" />
                  <CustomerGrid rows={customerCards} />
                </div>
              </div>
            </PanelSection>
          ) : null}

          {active === "reviews" ? (
            <PanelSection title="Reviews & Ratings" subtitle="View reviews, reply to feedback, and report fake reviews when needed.">
              <DataRows
                rows={dashboard.feedback}
                columns={["restaurantName", "customerName", "date", "time", "foodRating", "serviceRating", "comment", "vendorReply", "reported"]}
                empty="No reviews yet"
                actions={() => (
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-2"><FaCommentDots /> Reply</button>
                    <button className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-2"><FaFlag /> Report</button>
                  </div>
                )}
              />
            </PanelSection>
          ) : null}

          {active === "offers" ? (
            <PanelSection title="Offers & Coupons" subtitle="Create coupons, manage discounts, and plan festival or happy-hour campaigns.">
              <div className="grid gap-5 xl:grid-cols-[minmax(340px,0.8fr)_minmax(0,1.2fr)]">
                <CatalogForm
                  type="offer"
                  restaurantOptions={restaurantOptions}
                  defaultRestaurantId={defaultRestaurantId}
                  form={offerForm}
                  setForm={setOfferForm}
                  onSubmit={() => postAction("/vendor/offers", { ...offerForm, restaurantId: offerForm.restaurantId || defaultRestaurantId, discount: Number(offerForm.discount), minOrder: Number(offerForm.minOrder), isActive: offerForm.isActive === "true", notes: couponNotes }, "Offer created")}
                />
                <div className="space-y-5">
                  <ModuleSummary eyebrow="Campaigns" title={`${dashboard.offers.length} offers`} badge={`${dashboard.offers.filter((offer) => offer.isActive !== false).length} active`} />
                  <OfferGrid rows={dashboard.offers} />
                  <ModuleSummary eyebrow="Admin deals" title={`${dashboard.adminDeals.length} vendor deals`} badge={`${dashboard.adminDeals.filter((deal) => deal.isActive !== false).length} active`} />
                  <AdminDealGrid rows={dashboard.adminDeals} />
                  <label className="block rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Festival / Happy Hours Notes</span>
                    <textarea value={couponNotes} onChange={(event) => setCouponNotes(event.target.value)} className="min-h-28 w-full rounded-xl border border-white/10 bg-[#0f0c0b] px-3 py-3 text-sm text-white outline-none" />
                  </label>
                </div>
              </div>
            </PanelSection>
          ) : null}

          {active === "notifications" ? (
            <PanelSection title="Notifications" subtitle="Send booking confirmations, cancellations, table reminders, offer alerts, and SMS/email notifications.">
              <div className="grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                  <NotifyTile title="Booking Confirmation" onClick={() => postAction("/vendor/notifications", { bookingId: selectedBooking?._id, channels: ["email", "text"], message: "Your booking is confirmed." }, "Notification queued")} />
                  <NotifyTile title="Booking Cancellation" onClick={() => postAction("/vendor/notifications", { bookingId: selectedBooking?._id, channels: ["email", "text"], message: "Your booking has been cancelled." }, "Notification queued")} />
                  <NotifyTile title="Table Reminder" onClick={() => postAction("/vendor/notifications", { bookingId: selectedBooking?._id, channels: ["text"], message: "Your table is ready shortly." }, "Notification queued")} />
                  <NotifyTile title="Offer Notifications" onClick={() => postAction("/vendor/notifications", { channels: ["email"], message: "New happy hours offers are now live." }, "Notification queued")} />
                </div>
                <div className="space-y-5">
                  <ModuleSummary eyebrow="Notification history" title={`${dashboard.notifications.length} notifications`} badge="Latest first" />
                  <DataRows
                    rows={dashboard.notifications}
                    columns={["restaurantName", "customerName", "date", "time", "channels", "status", "message"]}
                    empty="No notifications yet"
                  />
                </div>
              </div>
            </PanelSection>
          ) : null}

          {active === "analytics" ? (
            <PanelSection title="Reports & Analytics" subtitle="Daily, weekly, and monthly revenue reports with best-selling dishes, peak booking hours, and customer growth snapshots.">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-300">Report period</p>
                  <h3 className="mt-2 text-2xl font-black text-white">{analyticsPeriod[0].toUpperCase()}{analyticsPeriod.slice(1)} performance</h3>
                </div>
                <PeriodSelect value={analyticsPeriod} onChange={setAnalyticsPeriod} />
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <h3 className="text-xl font-black">Revenue</h3>
                    <span className="text-sm font-bold text-emerald-200">{money(revenueTotal)}</span>
                  </div>
                  <MiniBars values={dashboard.charts.revenue} labels={dashboard.charts.labels} />
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <h3 className="text-xl font-black">Bookings</h3>
                    <span className="text-sm font-bold text-cyan-200">{dashboard.bookings.length} total</span>
                  </div>
                  <MiniBars values={dashboard.charts.bookings} labels={dashboard.charts.labels} />
                </div>
              </div>
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div className="rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <h3 className="text-xl font-black">Customer Growth</h3>
                    <span className="text-sm font-bold text-orange-200">{customerGrowthTotal} new signals</span>
                  </div>
                  <MiniBars values={dashboard.charts.customerGrowth.map((item) => item.customers)} labels={dashboard.charts.customerGrowth.map((item) => item.label)} />
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5">
                  <h3 className="mb-5 text-xl font-black">Booking Status</h3>
                  <DataRows
                    rows={dashboard.charts.statusBreakdown.filter((item) => item.count > 0)}
                    columns={["status", "count"]}
                    empty="No booking status data yet"
                  />
                </div>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <InfoTile title="Best Selling Dish" text={bestDish ? `${bestDish.name}: ${bestDish.orders} orders, ${money(bestDish.revenue)}` : "No dish orders found yet."} icon={FaUtensils} />
                <InfoTile title="Peak Booking Hour" text={peakHour ? `${peakHour.hour}: ${peakHour.bookings} bookings` : "No booking hour data yet."} icon={FaClock} />
                <InfoTile title="Customer Growth" text={`${customerCards.length} unique customers, ${Math.max(0, dashboard.bookings.length - customerCards.length)} repeat signals.`} icon={FaUsers} />
              </div>
              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                <div className="rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5">
                  <h3 className="mb-5 text-xl font-black">Best Selling Dishes</h3>
                  <DataRows
                    rows={dashboard.charts.popularDishes.map((item) => ({ ...item, revenue: money(item.revenue) }))}
                    columns={["name", "orders", "revenue"]}
                    empty="No dish sales data yet"
                  />
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5">
                  <h3 className="mb-5 text-xl font-black">Peak Booking Hours</h3>
                  <DataRows
                    rows={dashboard.charts.peakHours}
                    columns={["hour", "bookings"]}
                    empty="No peak hour data yet"
                  />
                </div>
              </div>
              <div className="mt-5 rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5">
                <h3 className="mb-5 text-xl font-black">Restaurant Performance</h3>
                <DataRows
                  rows={dashboard.charts.restaurantPerformance.map((item) => ({ ...item, revenue: money(item.revenue) }))}
                  columns={["restaurantName", "location", "bookings", "revenue"]}
                  empty="No restaurant performance data yet"
                />
              </div>
            </PanelSection>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function RestaurantGrid({ restaurants, token, reload, setMessage }) {
  const toggle = async (restaurant) => {
    try {
      await apiPatch(`/vendor/restaurants/${restaurant._id}`, { isActive: !restaurant.isActive }, token);
      setMessage({ type: "success", text: "Restaurant status updated" });
      reload();
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Could not update restaurant" });
    }
  };

  const remove = async (restaurant) => {
    try {
      await apiDelete(`/vendor/restaurants/${restaurant._id}`, token);
      setMessage({ type: "success", text: "Restaurant deleted" });
      reload();
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Could not delete restaurant" });
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {restaurants.length === 0 ? (
        <div className="rounded-[1.25rem] border border-dashed border-white/10 bg-[#17100f] p-6 text-sm leading-7 text-slate-400 md:col-span-2">
          No restaurants added yet. Create your first branch from the form on the left.
        </div>
      ) : null}

      {restaurants.map((restaurant) => {
        const image = restaurant.image || restaurant.images?.[0] || "";
        const active = restaurant.isActive !== false;

        return (
          <article key={restaurant._id} className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#17100f] shadow-xl">
            <div className="relative h-36 bg-[#0f0c0b]">
              {image ? (
                <img src={image} alt={restaurant.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center bg-[linear-gradient(135deg,rgba(255,107,53,0.22),rgba(255,255,255,0.03))] text-sm font-bold text-slate-400">
                  No image
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#17100f] via-transparent to-transparent" />
              <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${active ? "bg-emerald-400/15 text-emerald-100" : "bg-rose-400/15 text-rose-100"}`}>
                {active ? "Active" : "Inactive"}
              </span>
              <span className="absolute bottom-3 left-3 rounded-full bg-black/40 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                {restaurant.branchCode || restaurant.cuisine || "Branch"}
              </span>
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-xl font-black text-white">{restaurant.name}</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {restaurant.location} - {restaurant.cuisine}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-orange-200">
                  {restaurant.rating ?? "4.5"} star
                </span>
              </div>

              <p className="mt-4 line-clamp-2 min-h-12 text-sm leading-6 text-slate-400">{restaurant.description || "No description added."}</p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                {(restaurant.facilities ?? []).slice(0, 3).map((facility) => (
                  <span key={facility} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    {facility}
                  </span>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button onClick={() => toggle(restaurant)} className="rounded-full bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10">
                  {active ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => remove(restaurant)} className="rounded-full bg-rose-400/10 px-4 py-2 text-sm font-bold text-rose-200 transition hover:bg-rose-400/20">
                  Delete
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function MenuGrid({ items, onToggle, onDelete }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.length === 0 ? (
        <div className="rounded-[1.25rem] border border-dashed border-white/10 bg-[#17100f] p-6 text-sm leading-7 text-slate-400 md:col-span-2">
          No dishes yet. Add your first menu item from the form on the left.
        </div>
      ) : null}

      {items.map((item) => {
        const available = item.available !== false;
        const image = item.image || "";

        return (
          <article key={item._id} className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#17100f] shadow-xl">
            <div className="relative h-32 bg-[#0f0c0b]">
              {image ? (
                <img src={image} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center bg-[linear-gradient(135deg,rgba(255,107,53,0.22),rgba(255,255,255,0.03))] text-sm font-bold text-slate-400">
                  No food image
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#17100f] via-transparent to-transparent" />
              <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${available ? "bg-emerald-400/15 text-emerald-100" : "bg-rose-400/15 text-rose-100"}`}>
                {available ? "Available" : "Hidden"}
              </span>
              <span className="absolute bottom-3 left-3 rounded-full bg-black/40 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                {item.category || "Menu item"}
              </span>
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-xl font-black text-white">{item.name}</h3>
                  <p className="mt-1 text-sm text-slate-400">{item.specialOffer || item.addons || "No add-ons configured"}</p>
                </div>
                <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-black text-orange-200">
                  Rs. {item.price}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  {item.isVeg ? "Veg" : "Non-veg"}
                </span>
                {item.isCombo ? <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Combo</span> : null}
                {item.isFestival ? <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Festival</span> : null}
                {item.isTodaySpecial ? <span className="rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1 text-orange-100">Today special</span> : null}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button onClick={() => onToggle(item)} className="inline-flex items-center justify-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10">
                  <FaEdit />
                  Toggle
                </button>
                <button onClick={() => onDelete(item)} className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-400/10 px-4 py-2 text-sm font-bold text-rose-200 transition hover:bg-rose-400/20">
                  <FaTrash />
                  Delete
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function TableGrid({ tables, onToggle, onDelete }) {
  const toneForStatus = (status) => {
    if (status === "available") return "bg-emerald-400/15 text-emerald-100";
    if (status === "occupied") return "bg-rose-400/15 text-rose-100";
    if (status === "maintenance") return "bg-slate-400/15 text-slate-100";
    return "bg-orange-400/15 text-orange-100";
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {tables.length === 0 ? (
        <div className="rounded-[1.25rem] border border-dashed border-white/10 bg-[#17100f] p-6 text-sm leading-7 text-slate-400 md:col-span-2">
          No tables yet. Add a table from the form on the left to build the floor plan.
        </div>
      ) : null}

      {tables.map((table) => (
        <article key={table._id} className="rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Table</p>
              <h3 className="mt-1 text-2xl font-black text-white">{table.tableId}</h3>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${toneForStatus(table.status)}`}>
              {table.status}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-slate-500">Type</p>
              <p className="mt-1 font-bold text-white">{table.type}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-slate-500">Seats</p>
              <p className="mt-1 font-bold text-white">{table.seats}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-slate-500">Floor</p>
              <p className="mt-1 font-bold text-white">{table.floor || "-"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-slate-500">Fee</p>
              <p className="mt-1 font-bold text-orange-200">Rs. {table.price}</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-[#0f0c0b] px-4 py-3 text-xs text-slate-400">
            Layout position: X {table.x ?? table.layout?.x ?? "-"} / Y {table.y ?? table.layout?.y ?? "-"}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button onClick={() => onToggle(table)} className="inline-flex items-center justify-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10">
              <FaEdit />
              Toggle
            </button>
            <button onClick={() => onDelete(table)} className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-400/10 px-4 py-2 text-sm font-bold text-rose-200 transition hover:bg-rose-400/20">
              <FaTrash />
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function ModuleSummary({ eyebrow, title, badge }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-300">{eyebrow}</p>
          <h3 className="mt-2 text-2xl font-black text-white">{title}</h3>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200">{badge}</div>
      </div>
    </div>
  );
}

function MetricTile({ title, value, text, icon: Icon }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5 shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-orange-400/10 text-orange-200">
          <Icon />
        </div>
        <span className="text-3xl font-black text-white">{value}</span>
      </div>
      <h3 className="mt-4 text-lg font-black text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}

function WaitlistGrid({ rows, onNotify, onSeat, onCancel, onDelete }) {
  const statusClass = {
    waiting: "bg-orange-400/10 text-orange-100",
    notified: "bg-cyan-400/10 text-cyan-100",
    seated: "bg-emerald-400/10 text-emerald-100",
    cancelled: "bg-rose-400/10 text-rose-100",
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {rows.length === 0 ? (
        <div className="rounded-[1.25rem] border border-dashed border-white/10 bg-[#17100f] p-6 text-sm leading-7 text-slate-400 md:col-span-2">
          No waitlist guests yet.
        </div>
      ) : null}
      {rows.map((row) => (
        <article key={row._id ?? `${row.name}-${row.position}`} className="rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Position #{row.position ?? "-"}</p>
              <h3 className="mt-1 text-xl font-black text-white">{row.name || "Guest"}</h3>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass[row.status] ?? statusClass.waiting}`}>
              {row.status || "waiting"}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-slate-500">Guests</p>
              <p className="mt-1 font-bold text-white">{row.guests ?? "-"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-slate-500">Wait</p>
              <p className="mt-1 font-bold text-white">{row.estimatedWait ?? "-"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-slate-500">Date</p>
              <p className="mt-1 font-bold text-white">{row.date || "-"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-slate-500">Time</p>
              <p className="mt-1 font-bold text-white">{row.time || "-"}{row.slot ? ` · ${row.slot}` : ""}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-400">{row.phone || "No phone number"}{row.email ? ` | ${row.email}` : ""}</p>
          <p className="mt-1 text-sm text-slate-500">{row.tableType ? `${row.tableType} table requested` : "Any table type"}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={() => onNotify?.(row)} disabled={row.status !== "waiting"} className="rounded-full bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40">
              Notify
            </button>
            <button onClick={() => onSeat?.(row)} disabled={row.status === "seated" || row.status === "cancelled"} className="rounded-full bg-emerald-400/10 px-4 py-2 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-40">
              Seat
            </button>
            <button onClick={() => onCancel?.(row)} disabled={row.status === "cancelled" || row.status === "seated"} className="rounded-full bg-orange-400/10 px-4 py-2 text-xs font-bold text-orange-100 transition hover:bg-orange-400/20 disabled:cursor-not-allowed disabled:opacity-40">
              Cancel
            </button>
            <button onClick={() => onDelete?.(row)} className="rounded-full bg-rose-400/10 px-4 py-2 text-xs font-bold text-rose-100 transition hover:bg-rose-400/20">
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function OrderGrid({ rows }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {rows.length === 0 ? (
        <div className="rounded-[1.25rem] border border-dashed border-white/10 bg-[#17100f] p-6 text-sm leading-7 text-slate-400 md:col-span-2">
          No orders yet.
        </div>
      ) : null}
      {rows.map((row) => (
        <article key={row._id} className="rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-xl font-black text-white">{row.restaurantName || "Restaurant"}</h3>
              <p className="mt-1 text-sm text-slate-400">{row.customerName || "Guest"} · {row.tableId || "No table"}</p>
            </div>
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold text-slate-200">{row.status}</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-slate-500">Date</p>
              <p className="mt-1 font-bold text-white">{row.date || "-"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-slate-500">Time</p>
              <p className="mt-1 font-bold text-white">{row.time || "-"}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-400">{row.items?.length ? `${row.items.length} selected items` : "No pre-order items"}</p>
        </article>
      ))}
    </div>
  );
}

function CustomerGrid({ rows }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {rows.length === 0 ? (
        <div className="rounded-[1.25rem] border border-dashed border-white/10 bg-[#17100f] p-6 text-sm leading-7 text-slate-400 md:col-span-2">
          No customers yet.
        </div>
      ) : null}
      {rows.map((booking) => (
        <article key={booking._id} className="rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-xl font-black text-white">{booking.customerName || "Unknown customer"}</h3>
              <p className="mt-1 truncate text-sm text-slate-400">{booking.customerEmail || "No email"}</p>
            </div>
            <span className="rounded-full bg-[#ff6b35]/15 px-3 py-1 text-xs font-semibold text-orange-200">{booking.status}</span>
          </div>
          <p className="mt-4 text-sm text-slate-300">{booking.customerPhone || "No phone"}</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">Latest visit: {booking.restaurantName} on {booking.date} at {booking.time}</p>
        </article>
      ))}
    </div>
  );
}

function OfferGrid({ rows }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {rows.length === 0 ? (
        <div className="rounded-[1.25rem] border border-dashed border-white/10 bg-[#17100f] p-6 text-sm leading-7 text-slate-400 md:col-span-2">
          No offers yet.
        </div>
      ) : null}
      {rows.map((row) => (
        <article key={row._id ?? row.code} className="rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Coupon</p>
              <h3 className="mt-1 text-2xl font-black text-white">{row.code}</h3>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${row.isActive !== false ? "bg-emerald-400/15 text-emerald-100" : "bg-rose-400/15 text-rose-100"}`}>
              {row.isActive !== false ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-slate-500">Discount</p>
              <p className="mt-1 font-bold text-white">{row.discount}%</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-slate-500">Min order</p>
              <p className="mt-1 font-bold text-white">Rs. {row.minOrder}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-400">Valid until {row.validUntil || "not set"}</p>
        </article>
      ))}
    </div>
  );
}

function AdminDealGrid({ rows }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {rows.length === 0 ? (
        <div className="rounded-[1.25rem] border border-dashed border-white/10 bg-[#17100f] p-6 text-sm leading-7 text-slate-400 md:col-span-2">
          No admin vendor deals yet.
        </div>
      ) : null}
      {rows.map((row) => (
        <article key={row._id} className="rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Admin deal</p>
              <h3 className="mt-1 text-2xl font-black text-white">{row.title}</h3>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${row.isActive !== false ? "bg-emerald-400/15 text-emerald-100" : "bg-rose-400/15 text-rose-100"}`}>
              {row.isActive !== false ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="mt-4 text-sm text-slate-400">{row.description || "Special admin deal for vendors."}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-slate-500">Discount</p>
              <p className="mt-1 font-bold text-white">{row.discount}%</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-slate-500">Min order</p>
              <p className="mt-1 font-bold text-white">Rs. {row.minOrder || 0}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-400">{row.code ? `Code ${row.code}` : "No code required"}{row.validUntil ? ` | Valid until ${row.validUntil}` : ""}</p>
        </article>
      ))}
    </div>
  );
}

function CatalogForm({ type, restaurantOptions, defaultRestaurantId = "", form, setForm, onSubmit }) {
  const selectedRestaurantId = form.restaurantId || defaultRestaurantId;
  const hasRestaurants = restaurantOptions.length > 0;
  const restaurantSelect = (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Restaurant</span>
      <div className="relative">
        <select
          required
          disabled={!hasRestaurants}
          value={selectedRestaurantId}
          onChange={(event) => setForm((value) => ({ ...value, restaurantId: event.target.value }))}
          className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-[#0f0c0b] px-4 pr-10 text-sm font-semibold text-white outline-none transition focus:border-orange-300/50 disabled:cursor-not-allowed disabled:text-slate-500"
        >
          {!hasRestaurants ? (
            <option value="">Add a restaurant first</option>
          ) : (
            <option value="">Select restaurant</option>
          )}
          {restaurantOptions.map((option) => (
            <option key={option.id} value={option.id} className="bg-[#0f0c0b] text-white">
              {option.label}
            </option>
          ))}
        </select>
        <FaChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
      </div>
      {!hasRestaurants ? (
        <p className="mt-2 rounded-xl border border-orange-300/20 bg-orange-400/10 px-3 py-2 text-xs font-semibold text-orange-100">
          Add at least one restaurant before creating {type === "menu" ? "dishes" : type === "table" ? "tables" : "offers"}.
        </p>
      ) : null}
    </label>
  );

  const fieldsByType = {
    menu: [
      ["name", "Dish"],
      ["category", "Category"],
      ["price", "Price"],
      ["available", "Available", ["true", "false"]],
      ["isVeg", "Veg", ["true", "false"]],
      ["isCombo", "Combo", ["true", "false"]],
      ["isFestival", "Festival Menu", ["true", "false"]],
      ["isTodaySpecial", "Today Special", ["true", "false"]],
      ["image", "Food Image URL"],
      ["addons", "Add-ons"],
      ["specialOffer", "Special Offer"],
    ],
    table: [
      ["tableId", "Table Number"],
      ["type", "Type", ["Couple", "Family", "VIP", "Outdoor", "Indoor", "Private", "Rooftop"]],
      ["seats", "Seating Capacity"],
      ["floor", "Floor"],
      ["price", "Reservation Fee"],
      ["status", "Status", ["available", "reserved", "occupied", "maintenance"]],
      ["x", "Layout X"],
      ["y", "Layout Y"],
    ],
    offer: [
      ["code", "Coupon Code"],
      ["discount", "Discount %"],
      ["minOrder", "Min Order"],
      ["validUntil", "Valid Until"],
      ["isActive", "Status", ["true", "false"]],
    ],
    waitlist: [
      ["name", "Customer"],
      ["phone", "Phone"],
      ["email", "Email"],
      ["guests", "Guests"],
      ["date", "Date", null, "date"],
      ["time", "Time", null, "time"],
      ["slot", "Slot", ["morning", "lunch", "dinner"]],
      ["tableType", "Table Type", ["Couple", "Family", "VIP", "Outdoor", "Indoor", "Private", "Rooftop"]],
      ["estimatedWait", "Estimated Wait"],
    ],
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!selectedRestaurantId) return;
        onSubmit();
      }}
      className="grid gap-4 rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5"
    >
      {restaurantSelect}
      {fieldsByType[type].map(([field, label, options, inputType]) => (
        <Field key={field} label={label} value={form[field]} type={inputType} options={options} onChange={(value) => setForm((current) => ({ ...current, [field]: value }))} />
      ))}
      <button disabled={!selectedRestaurantId} className="rounded-full bg-[#ff6b35] px-5 py-3 font-black transition disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500">Save {type}</button>
    </form>
  );
}

function TableLayout({ tables, section = "All", onMove }) {
  const floorRef = useRef(null);
  const lastPositionRef = useRef({});
  const [draggingId, setDraggingId] = useState(null);
  const [positions, setPositions] = useState({});

  const visibleTables = useMemo(
    () => section === "All" ? tables : tables.filter((table) => String(table.type ?? "").toLowerCase() === section.toLowerCase()),
    [section, tables],
  );

  const basePositions = useMemo(() => {
    const nextPositions = {};
    tables.forEach((table, index) => {
      nextPositions[table._id] = {
        x: Number(table.layout?.x ?? table.x ?? 8 + (index % 5) * 18),
        y: Number(table.layout?.y ?? table.y ?? 12 + Math.floor(index / 5) * 28),
      };
    });
    return nextPositions;
  }, [tables]);

  const calculatePosition = (event) => {
    const rect = floorRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: Math.min(88, Math.max(2, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.min(82, Math.max(2, ((event.clientY - rect.top) / rect.height) * 100)),
    };
  };

  const moveTable = (event, table) => {
    const next = calculatePosition(event);
    if (!next) return;
    lastPositionRef.current = { ...lastPositionRef.current, [table._id]: next };
    setPositions((current) => ({ ...current, [table._id]: next }));
  };

  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black">Restaurant Floor Plan</h3>
          <p className="mt-1 text-xs text-slate-500">{section} view - drag a table to save its x/y position</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-400">{visibleTables.length} tables</span>
      </div>
      <div ref={floorRef} className="relative min-h-[460px] overflow-hidden rounded-2xl border border-dashed border-white/10 bg-[#0f0c0b] bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px] p-4">
        {visibleTables.length === 0 ? (
          <div className="absolute inset-0 grid place-items-center px-6 text-center text-sm leading-6 text-slate-500">
            No {section === "All" ? "" : section.toLowerCase()} tables yet. Add tables from Table Management to place them here.
          </div>
        ) : null}
        {visibleTables.map((table) => {
          const position = positions[table._id] ?? basePositions[table._id] ?? { x: 8, y: 12 };
          return (
            <button
              key={table._id}
              type="button"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                setDraggingId(table._id);
                moveTable(event, table);
              }}
              onPointerMove={(event) => {
                if (draggingId === table._id) moveTable(event, table);
              }}
              onPointerUp={(event) => {
                if (draggingId !== table._id) return;
                event.currentTarget.releasePointerCapture(event.pointerId);
                setDraggingId(null);
                const next = lastPositionRef.current[table._id];
                if (next) onMove?.(table, Math.round(next.x), Math.round(next.y));
              }}
              onPointerCancel={() => setDraggingId(null)}
              className={`absolute grid h-20 w-28 touch-none select-none place-items-center rounded-2xl border text-center text-xs font-bold shadow-xl transition ${
                draggingId === table._id ? "z-20 scale-105 cursor-grabbing shadow-orange-500/20" : "cursor-grab hover:scale-105"
              } ${
                table.status === "available"
                  ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-100"
                  : table.status === "occupied"
                    ? "border-red-400/40 bg-red-400/15 text-red-100"
                    : "border-orange-400/40 bg-orange-400/15 text-orange-100"
              }`}
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
              title={`Move ${table.tableId}`}
            >
              <span className="text-sm">{table.tableId}</span>
              <span className="text-[11px] text-slate-300">{table.type}</span>
              <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{table.seats} seats</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InfoTile({ title, text, icon: Icon }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-orange-200">
          <Icon />
        </div>
        <h3 className="text-lg font-black">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}

function NotifyTile({ title, onClick }) {
  return (
    <button onClick={onClick} className="rounded-[1.25rem] border border-white/10 bg-[#17100f] p-5 text-left transition hover:border-orange-400/40 hover:bg-white/5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-black">{title}</h3>
        <FaBell className="text-orange-200" />
      </div>
      <p className="mt-2 text-sm text-slate-400">Trigger notification template</p>
    </button>
  );
}

function FaCheckIcon() {
  return <span className="text-[10px]">✓</span>;
}

function FaFlag() {
  return <span className="text-[10px]">!</span>;
}
