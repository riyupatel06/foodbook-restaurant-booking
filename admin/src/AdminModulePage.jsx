import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaArrowRight, FaCheckCircle, FaCreditCard, FaFilePdf, FaPrint, FaQrcode, FaTable, FaTicketAlt, FaTimes, FaTrash } from "react-icons/fa";
import { useAdminDashboard } from "./hooks/useAdminDashboard";
import {
  createAdminDeal,
  createAdminTable,
  deleteAdminBooking,
  deleteAdminCoupon,
  deleteAdminDeal,
  deleteAdminMenuItem,
  deleteAdminNotification,
  deleteAdminReview,
  deleteAdminTable,
  deleteAdminWaitlistEntry,
  deleteRestaurant,
  deleteUser,
  deleteVendor,
  downloadAdminReport,
  fetchAdminBookings,
  fetchAdminCoupons,
  fetchAdminDeals,
  fetchAdminMenuItems,
  fetchAdminNotifications,
  fetchAdminOrders,
  fetchAdminPayments,
  fetchAdminReports,
  fetchAdminReviews,
  fetchAdminTables,
  fetchAdminWaitlist,
  updateAdminBookingStatus,
  updateAdminDeal,
  updateAdminTable,
  updateAdminWaitlistEntry,
  updateRestaurant,
  updateUser,
  updateVendor,
} from "./services/adminApi";

const labels = {
  dashboard: "Dashboard",
  restaurants: "Restaurants",
  vendors: "Vendors",
  customers: "Customers",
  menus: "Menus",
  tables: "Tables",
  bookings: "Bookings",
  orders: "Orders",
  payments: "Payments",
  loyalty: "Loyalty",
  "spin-win": "Spin & Win",
  coupons: "Coupons",
  offers: "Offers",
  "qr-check-in": "QR Check-In",
  recurring: "Recurring",
  deals: "Deals",
  waitlist: "Waitlist",
  reviews: "Reviews",
  notifications: "Notifications",
  ai: "AI",
  reports: "Reports",
  revenue: "Revenue",
  banners: "Banners",
  settings: "Settings",
};

const statusOptions = ["pending", "confirmed", "cancelled"];
const tableStatusOptions = ["available", "reserved", "maintenance"];
const restaurantScopedModules = ["menus", "tables", "bookings", "orders", "payments", "qr-check-in"];

function getRecordId(value) {
  if (!value) return "";
  if (typeof value === "object") return String(value._id || value.id || "");
  return String(value);
}

function matchesRestaurant(item, restaurant) {
  if (!restaurant) return false;
  const itemRestaurantId = getRecordId(item.restaurantId);
  if (itemRestaurantId && itemRestaurantId === String(restaurant._id)) return true;
  if (itemRestaurantId) return false;
  return String(item.restaurantName || "").trim().toLowerCase() === String(restaurant.name || "").trim().toLowerCase();
}

function isMenuAvailable(row) {
  const value = row?.available;
  return !(value === false || value === 0 || String(value).toLowerCase() === "false");
}

function getRowStatus(row, moduleSlug) {
  if (moduleSlug === "menus") return isMenuAvailable(row) ? "Available" : "Unavailable";
  if (row.status) return row.status;
  if (row.checkInStatus) return row.checkInStatus;
  if (typeof row.isBlocked === "boolean") return row.isBlocked ? "blocked" : "active";
  if (typeof row.available === "boolean") return row.available ? "available" : "unavailable";
  return row.isActive ? "active" : "inactive";
}

function getStatusClass(status) {
  const normalized = String(status).toLowerCase();
  if (["available", "active", "confirmed", "paid", "verified", "seated"].includes(normalized)) return "bg-emerald-50 text-emerald-700";
  if (["unavailable", "inactive", "blocked", "cancelled", "failed"].includes(normalized)) return "bg-rose-50 text-rose-700";
  if (["waiting", "notified"].includes(normalized)) return "bg-amber-50 text-amber-700";
  return "bg-cyan-50 text-cyan-700";
}

function formatCurrency(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function buildReportRows(report) {
  if (!report?.summary) return [];
  return Object.entries(report.summary).map(([key, value]) => ({
    _id: `report-${key}`,
    name: key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase()),
    details: "Platform report metric",
    status: "ready",
    amount: key === "revenue" ? Number(value || 0) : "",
    value,
  }));
}

function buildRevenueSummary(payments = []) {
  const paidPayments = payments.filter((payment) => payment.status !== "failed");
  const totalRevenue = paidPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const paidOut = paidPayments
    .filter((payment) => payment.payoutStatus === "paid")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const pendingPayout = Math.max(0, totalRevenue - paidOut);
  const failedPayments = payments.filter((payment) => payment.status === "failed");
  const byRestaurant = Array.from(
    paidPayments.reduce((map, payment) => {
      const key = payment.restaurantName || "Unknown restaurant";
      const current = map.get(key) ?? {
        restaurantName: key,
        location: payment.restaurantLocation || payment.location || "",
        revenue: 0,
        payments: 0,
        pendingPayout: 0,
      };
      const amount = Number(payment.amount || 0);
      current.revenue += amount;
      current.payments += 1;
      if (payment.payoutStatus !== "paid") current.pendingPayout += amount;
      map.set(key, current);
      return map;
    }, new Map()).values(),
  ).sort((a, b) => b.revenue - a.revenue);

  const byMethod = Array.from(
    paidPayments.reduce((map, payment) => {
      const key = payment.method || payment.provider || "Unknown";
      const current = map.get(key) ?? { method: key, amount: 0, count: 0 };
      current.amount += Number(payment.amount || 0);
      current.count += 1;
      map.set(key, current);
      return map;
    }, new Map()).values(),
  ).sort((a, b) => b.amount - a.amount);

  return {
    totalRevenue,
    paidOut,
    pendingPayout,
    failedAmount: failedPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    successfulCount: paidPayments.length,
    failedCount: failedPayments.length,
    byRestaurant,
    byMethod,
  };
}

function ReceiptField({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-700">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">{value || "-"}</p>
    </div>
  );
}

function getRowDetails(row, moduleSlug) {
  if (moduleSlug === "orders") return `${row.customerName || "Guest"} | Qty ${row.quantity || 1}`;
  if (moduleSlug === "payments") return [row.restaurantLocation, row.date].filter(Boolean).join(" | ") || row.provider || "Details";
  if (moduleSlug === "revenue") return [row.restaurantName, row.customerName, row.payoutStatus === "paid" ? "Paid out" : "Pending payout"].filter(Boolean).join(" | ") || "Revenue transaction";
  if (moduleSlug === "deals") return [String(row.audience || "").toUpperCase(), row.code || row.validUntil || row.description || "Deal"].filter(Boolean).join(" | ");
  if (moduleSlug === "waitlist") return [row.restaurantName, row.date, row.time, row.phone].filter(Boolean).join(" | ") || "Waitlist guest";
  if (moduleSlug === "reviews") return [row.restaurantName, row.details].filter(Boolean).join(" | ") || "Review";
  if (moduleSlug === "notifications") return [row.restaurantName, row.details].filter(Boolean).join(" | ") || "Notification";
  return row.email || row.location || row.category || row.date || row.city || row.expiresAt || row.provider || row.eventType || row.tableType || "Details";
}

function getRestaurantPayoutPath(row) {
  const restaurantId = getRecordId(row.restaurantId);
  return restaurantId ? `/admin/pay-restaurant/restaurant/${restaurantId}` : `/admin/pay-restaurant/${row._id}`;
}

export default function AdminModulePage() {
  const { moduleSlug = "dashboard" } = useParams();
  const navigate = useNavigate();
  const title = labels[moduleSlug] ?? moduleSlug.replace(/-/g, " ");
  const { data } = useAdminDashboard();
  const summary = data?.summary ?? {};
  const [moduleData, setModuleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tableForm, setTableForm] = useState({ restaurantId: "", tableId: "", type: "", city: "", seats: 4, floor: "Ground", price: 0, status: "available" });
  const [dealForms, setDealForms] = useState({
    user: { title: "", description: "", code: "", discount: 10, minOrder: 0, validUntil: "", isActive: true },
    vendor: { title: "", description: "", code: "", discount: 10, minOrder: 0, validUntil: "", isActive: true },
  });
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        let result = [];
        if (moduleSlug === "bookings" || moduleSlug === "qr-check-in") result = await fetchAdminBookings();
        else if (moduleSlug === "orders") result = await fetchAdminOrders();
        else if (moduleSlug === "payments") result = await fetchAdminPayments();
        else if (moduleSlug === "revenue") result = await fetchAdminPayments();
        else if (moduleSlug === "deals") result = await fetchAdminDeals();
        else if (moduleSlug === "reviews") result = await fetchAdminReviews();
        else if (moduleSlug === "notifications") result = await fetchAdminNotifications();
        else if (moduleSlug === "waitlist") result = await fetchAdminWaitlist();
        else if (moduleSlug === "reports") result = await fetchAdminReports();
        else if (moduleSlug === "tables") result = await fetchAdminTables();
        else if (moduleSlug === "menus") result = await fetchAdminMenuItems();
        else if (moduleSlug === "restaurants") result = data?.restaurants ?? [];
        else if (moduleSlug === "vendors") result = data?.vendors ?? [];
        else if (moduleSlug === "customers") result = data?.users ?? [];
        else if (moduleSlug === "coupons" || moduleSlug === "spin-win") result = await fetchAdminCoupons();
        if (mounted) setModuleData(moduleSlug === "reports" ? result : Array.isArray(result) ? result : []);
      } catch (fetchError) {
        if (mounted) setError(fetchError.message || "Failed to load module data");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [data?.restaurants, moduleSlug]);

  useEffect(() => {
    if (moduleSlug !== "menus") return undefined;

    const refreshMenuItems = async () => {
      try {
        const result = await fetchAdminMenuItems();
        setModuleData(Array.isArray(result) ? result : []);
      } catch {
        // Keep the current table visible if a background refresh fails.
      }
    };

    const intervalId = window.setInterval(refreshMenuItems, 5000);
    return () => window.clearInterval(intervalId);
  }, [moduleSlug]);

  const restaurants = data?.restaurants ?? [];
  const moduleRows = Array.isArray(moduleData) ? moduleData : [];
  const isRestaurantScopedModule = restaurantScopedModules.includes(moduleSlug);
  const selectedRestaurant = restaurants.find((restaurant) => String(restaurant._id) === String(selectedRestaurantId));
  const showingAllPayments = moduleSlug === "payments" && selectedRestaurantId === "all-payments";
  const selectedRestaurantRows = showingAllPayments ? moduleRows : moduleRows.filter((item) => matchesRestaurant(item, selectedRestaurant));
  const rows = moduleSlug === "reports" ? buildReportRows(moduleData) : isRestaurantScopedModule ? selectedRestaurantRows : moduleData;
  const scopedItemLabel = moduleSlug === "menus" ? "menu items" : moduleSlug === "tables" ? "tables" : moduleSlug === "orders" ? "orders" : moduleSlug === "payments" ? "payments" : "bookings";

  useEffect(() => {
    if (!isRestaurantScopedModule) return;
    if (moduleSlug === "payments") {
      if (!selectedRestaurantId) setSelectedRestaurantId("all-payments");
      return;
    }
    if (!restaurants.length) {
      setSelectedRestaurantId("");
      return;
    }

    const currentExists = restaurants.some((restaurant) => String(restaurant._id) === String(selectedRestaurantId));
    if (!selectedRestaurantId || !currentExists) {
      setSelectedRestaurantId(String(restaurants[0]._id));
    }
  }, [isRestaurantScopedModule, moduleSlug, restaurants, selectedRestaurantId]);

  const info = useMemo(() => {
    const dataSet = isRestaurantScopedModule ? selectedRestaurantRows : moduleData;
    if (moduleSlug === "reports") {
      const summaryData = moduleData?.summary ?? {};
      return {
        subtitle: "View live platform totals, recent activity, and export the admin PDF report.",
        stats: [
          ["Revenue", `Rs ${Number(summaryData.revenue || 0).toLocaleString("en-IN")}`],
          ["Bookings", summaryData.bookings ?? 0],
          ["Restaurants", summaryData.restaurants ?? 0],
        ],
        accent: moduleData?.generatedAt ? `Latest report generated ${formatDateTime(moduleData.generatedAt)}.` : "Generate report data from live database records.",
      };
    }
    if (moduleSlug === "bookings" || moduleSlug === "qr-check-in") {
      return { subtitle: "Select a restaurant first, then approve or cancel only that restaurant's bookings.", stats: [["Restaurants", restaurants.length], ["Bookings", dataSet.length], ["Confirmed", dataSet.filter((item) => item.status === "confirmed").length]], accent: selectedRestaurant ? `Showing bookings for ${selectedRestaurant.name}.` : "Choose a restaurant to view its bookings." };
    }
    if (moduleSlug === "payments") {
      const restaurantSales = dataSet.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      const pendingPayout = dataSet.filter((item) => item.payoutStatus !== "paid").reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      return { subtitle: "View all payments or select a restaurant for restaurant-wise sales and payouts.", stats: [["Payments", dataSet.length], [showingAllPayments ? "Total sales" : "Restaurant sales", `Rs ${restaurantSales.toLocaleString("en-IN")}`], ["Payable", `Rs ${pendingPayout.toLocaleString("en-IN")}`]], accent: showingAllPayments ? "Showing all payments from every restaurant." : selectedRestaurant ? `Showing payment sales for ${selectedRestaurant.name}.` : "Choose all payments or a restaurant to view payouts." };
    }
    if (moduleSlug === "revenue") {
      const revenue = buildRevenueSummary(dataSet);
      return {
        subtitle: "Track platform earnings, payment health, restaurant revenue, and pending payouts.",
        stats: [
          ["Total earnings", formatCurrency(revenue.totalRevenue)],
          ["Pending payout", formatCurrency(revenue.pendingPayout)],
          ["Transactions", dataSet.length],
        ],
        accent: "Revenue is calculated from live payment records across all restaurants.",
      };
    }
    if (moduleSlug === "orders") {
      return { subtitle: "Select a restaurant first, then review order items created from booking carts.", stats: [["Restaurants", restaurants.length], ["Orders", dataSet.length], ["Paid", dataSet.filter((item) => item.paymentStatus === "paid").length]], accent: selectedRestaurant ? `Showing orders for ${selectedRestaurant.name}.` : "Choose a restaurant to view its orders." };
    }
    if (moduleSlug === "tables") {
      return { subtitle: "Select a restaurant first, then manage only that restaurant's tables.", stats: [["Restaurants", restaurants.length], ["Tables", dataSet.length], ["Available", dataSet.filter((item) => item.status === "available").length]], accent: selectedRestaurant ? `Showing tables for ${selectedRestaurant.name}.` : "Choose a restaurant to view its tables." };
    }
    if (moduleSlug === "menus") {
      return { subtitle: "Select a restaurant first, then view the menu status set by the vendor.", stats: [["Menu items", dataSet.length], ["Available", dataSet.filter((item) => isMenuAvailable(item)).length], ["Unavailable", dataSet.filter((item) => !isMenuAvailable(item)).length]], accent: selectedRestaurant ? `Showing menu for ${selectedRestaurant.name}.` : "Choose a restaurant to view its menu items." };
    }
    if (moduleSlug === "restaurants") {
      return { subtitle: "Open restaurant details, activate or deactivate listings, and remove them.", stats: [["Total", summary.restaurants ?? dataSet.length], ["Active", dataSet.filter((item) => item.isActive).length], ["Inactive", dataSet.filter((item) => !item.isActive).length]], accent: "Restaurant records and profile access." };
    }
    if (moduleSlug === "vendors") {
      return { subtitle: "Review vendors, block/unblock access, and remove accounts.", stats: [["Total", summary.vendors ?? dataSet.length], ["Active", dataSet.filter((item) => !item.isBlocked).length], ["Blocked", dataSet.filter((item) => item.isBlocked).length]], accent: "Vendor records are loaded from the database." };
    }
    if (moduleSlug === "customers") {
      return { subtitle: "Review customers, block/unblock access, and remove accounts.", stats: [["Total", summary.users ?? dataSet.length], ["Active", dataSet.filter((item) => !item.isBlocked).length], ["Blocked", dataSet.filter((item) => item.isBlocked).length]], accent: "Customer records are loaded from the database." };
    }
    if (moduleSlug === "deals") {
      return { subtitle: "Create separate deals for users and vendors, then manage their visibility from one place.", stats: [["Total deals", dataSet.length], ["User deals", dataSet.filter((item) => item.audience === "user").length], ["Vendor deals", dataSet.filter((item) => item.audience === "vendor").length]], accent: "User deals are shown in the customer app, while vendor deals are shown inside the vendor panel." };
    }
    if (moduleSlug === "reviews") {
      return { subtitle: "Review customer feedback from bookings across all restaurants.", stats: [["Reviews", dataSet.length], ["Reported", dataSet.filter((item) => item.reported).length], ["With comments", dataSet.filter((item) => item.comment).length]], accent: "Review records are loaded with booking, customer, and restaurant context." };
    }
    if (moduleSlug === "notifications") {
      return { subtitle: "Track notification delivery records and system messages.", stats: [["Notifications", dataSet.length], ["Sent", dataSet.filter((item) => item.status === "sent").length], ["Failed", dataSet.filter((item) => item.status === "failed").length]], accent: "Notification history shows booking-linked delivery activity across the platform." };
    }
    if (moduleSlug === "waitlist") {
      return { subtitle: "Monitor waitlist guests across all restaurants and update queue status.", stats: [["Guests", dataSet.length], ["Waiting", dataSet.filter((item) => item.status === "waiting").length], ["Notified", dataSet.filter((item) => item.status === "notified").length]], accent: "Waitlist records are loaded from the restaurant database." };
    }
    if (moduleSlug === "coupons" || moduleSlug === "spin-win") {
      return { subtitle: "Review rewards and coupon lifecycle.", stats: [["Total", dataSet.length], ["Redeemed", dataSet.filter((item) => item.status === "redeemed").length], ["Expired", dataSet.filter((item) => item.status === "expired").length]], accent: "Spin, reward, and coupon management hub." };
    }
    return { subtitle: "Feature workspace connected to the admin shell.", stats: [["Status", "Ready"], ["API", "Connected"], ["Mode", "Expandable"]], accent: "This module is prepared for the next backend integration step." };
  }, [isRestaurantScopedModule, moduleData, moduleSlug, restaurants.length, selectedRestaurantRows, selectedRestaurant, showingAllPayments, summary]);

  const handleBookingStatus = async (id, status) => {
    const updated = await updateAdminBookingStatus(id, status);
    setModuleData((current) => current.map((item) => (item._id === id ? updated : item)));
  };

  const handleTableStatus = async (id, status) => {
    const updated = await updateAdminTable(id, { status });
    setModuleData((current) => current.map((item) => (item._id === id ? updated : item)));
  };

  const handleWaitlistStatus = async (id, status) => {
    const updated = await updateAdminWaitlistEntry(id, { status });
    setModuleData((current) => current.map((item) => (item._id === id ? updated : item)));
  };

  const handleRestaurantStatus = async (id, isActive) => {
    const updated = await updateRestaurant(id, { isActive: !isActive });
    setModuleData((current) => current.map((item) => (item._id === id ? updated : item)));
  };

  const handleAccountBlock = async (row) => {
    const updated = moduleSlug === "vendors"
      ? await updateVendor(row._id, { isBlocked: !row.isBlocked })
      : await updateUser(row._id, { isBlocked: !row.isBlocked });
    setModuleData((current) => current.map((item) => (item._id === row._id ? updated : item)));
  };

  const handleCreateDeal = async (audience) => {
    const form = dealForms[audience];
    const created = await createAdminDeal({
      audience,
      title: form.title,
      description: form.description,
      code: form.code,
      discount: Number(form.discount || 0),
      minOrder: Number(form.minOrder || 0),
      validUntil: form.validUntil,
      isActive: Boolean(form.isActive),
    });
    setModuleData((current) => [created, ...current]);
    setDealForms((current) => ({
      ...current,
      [audience]: { title: "", description: "", code: "", discount: 10, minOrder: 0, validUntil: "", isActive: true },
    }));
  };

  const handleToggleDeal = async (row) => {
    const updated = await updateAdminDeal(row._id, { isActive: !row.isActive });
    setModuleData((current) => current.map((item) => (item._id === row._id ? updated : item)));
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleDownloadReport = async () => {
    const blob = await downloadAdminReport();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = "restorantbooking-admin-report.pdf";
    link.click();
    URL.revokeObjectURL(objectUrl);
  };

  const handleDelete = async (id) => {
    if (moduleSlug === "bookings" || moduleSlug === "qr-check-in") await deleteAdminBooking(id);
    else if (moduleSlug === "tables") await deleteAdminTable(id);
    else if (moduleSlug === "menus") await deleteAdminMenuItem(id);
    else if (moduleSlug === "restaurants") await deleteRestaurant(id);
    else if (moduleSlug === "vendors") await deleteVendor(id);
    else if (moduleSlug === "customers") await deleteUser(id);
    else if (moduleSlug === "coupons" || moduleSlug === "spin-win") await deleteAdminCoupon(id);
    else if (moduleSlug === "deals") await deleteAdminDeal(id);
    else if (moduleSlug === "reviews") await deleteAdminReview(id);
    else if (moduleSlug === "notifications") await deleteAdminNotification(id);
    else if (moduleSlug === "waitlist") await deleteAdminWaitlistEntry(id);
    setModuleData((current) => current.filter((item) => item._id !== id));
  };

  const handleCreateTable = async (event) => {
    event.preventDefault();
    const created = await createAdminTable({ ...tableForm, restaurantId: selectedRestaurantId });
    setModuleData((current) => [created, ...current]);
    setTableForm({ restaurantId: "", tableId: "", type: "", city: "", seats: 4, floor: "Ground", price: 0, status: "available" });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-cyan-100 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-600">Module</p>
        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-cyan-900/70">{info.subtitle}</p>
          </div>
          <Link to="/admin" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#22c1c3] to-[#2563eb] px-4 py-2 text-sm font-semibold text-white">
            Back to dashboard <FaArrowRight />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {info.stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-cyan-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">{label}</p>
            <p className="mt-2 flex items-center gap-2 text-sm text-cyan-700"><FaCheckCircle />{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[28px] border border-cyan-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-600">Workspace</p>
            <h3 className="mt-1 text-2xl font-semibold text-slate-900">{title} management</h3>
          </div>
          {moduleSlug === "payments" ? <FaCreditCard className="text-2xl text-cyan-600" /> : moduleSlug === "qr-check-in" ? <FaQrcode className="text-2xl text-cyan-600" /> : moduleSlug === "coupons" || moduleSlug === "spin-win" ? <FaTicketAlt className="text-2xl text-cyan-600" /> : <FaTable className="text-2xl text-cyan-600" />}
        </div>

        {loading ? (
          <div className="mt-6 rounded-2xl border border-dashed border-cyan-100 bg-cyan-50 p-8 text-sm text-cyan-900/70">Loading module data...</div>
        ) : error ? (
          <div className="mt-6 rounded-2xl border border-dashed border-rose-200 bg-rose-50 p-8 text-sm text-rose-700">{error}</div>
        ) : (
          <>
            <div className="mt-6 rounded-2xl border border-dashed border-cyan-100 bg-cyan-50 p-6 text-sm text-cyan-900/70">{info.accent}</div>

            {isRestaurantScopedModule ? (
              <div className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">{moduleSlug === "payments" ? "Payment view" : "Select restaurant"}</p>
                    <h4 className="mt-1 text-lg font-semibold text-slate-900">{showingAllPayments ? "All payments" : selectedRestaurant?.name || "No restaurant selected"}</h4>
                  </div>
                  <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-cyan-700 shadow-sm">{selectedRestaurantRows.length} {scopedItemLabel}</span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {moduleSlug === "payments" ? (
                    <button
                      type="button"
                      onClick={() => setSelectedRestaurantId("all-payments")}
                      className={`rounded-2xl border p-4 text-left transition ${showingAllPayments ? "border-cyan-400 bg-white shadow-md" : "border-cyan-100 bg-white/70 hover:border-cyan-300 hover:bg-white"}`}
                    >
                      <span className="block text-sm font-semibold text-slate-900">All payments</span>
                      <span className="mt-1 block text-xs text-cyan-900/60">Every restaurant</span>
                      <span className="mt-3 inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">{moduleData.length} payments</span>
                    </button>
                  ) : null}
                  {restaurants.map((restaurant) => {
                    const restaurantId = String(restaurant._id);
                    const itemCount = moduleData.filter((item) => matchesRestaurant(item, restaurant)).length;
                    const active = restaurantId === String(selectedRestaurantId);
                    return (
                      <button
                        key={restaurant._id}
                        type="button"
                        onClick={() => {
                          if (moduleSlug === "payments") {
                            navigate(`/admin/pay-restaurant/restaurant/${restaurantId}`);
                            return;
                          }
                          setSelectedRestaurantId(restaurantId);
                        }}
                        className={`rounded-2xl border p-4 text-left transition ${active ? "border-cyan-400 bg-white shadow-md" : "border-cyan-100 bg-white/70 hover:border-cyan-300 hover:bg-white"}`}
                      >
                        <span className="block text-sm font-semibold text-slate-900">{restaurant.name}</span>
                        <span className="mt-1 block text-xs text-cyan-900/60">{restaurant.location || restaurant.city || "Restaurant"}</span>
                        <span className="mt-3 inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">{itemCount} {scopedItemLabel}</span>
                      </button>
                    );
                  })}
                  {!restaurants.length ? <p className="rounded-2xl bg-white p-4 text-sm text-cyan-900/60">No restaurants found. Add restaurants first to manage this page.</p> : null}
                </div>
              </div>
            ) : null}

            {moduleSlug === "tables" ? (
              <form onSubmit={handleCreateTable} className="mt-6 grid gap-3 rounded-2xl border border-cyan-100 bg-cyan-50 p-4 md:grid-cols-3 xl:grid-cols-6">
                <input className="rounded-xl border border-cyan-100 bg-white px-3 py-2 text-sm" placeholder="Table ID" value={tableForm.tableId} onChange={(e) => setTableForm((v) => ({ ...v, tableId: e.target.value }))} required />
                <input className="rounded-xl border border-cyan-100 bg-white px-3 py-2 text-sm" placeholder="Type" value={tableForm.type} onChange={(e) => setTableForm((v) => ({ ...v, type: e.target.value }))} required />
                <input className="rounded-xl border border-cyan-100 bg-white px-3 py-2 text-sm" placeholder="City" value={tableForm.city} onChange={(e) => setTableForm((v) => ({ ...v, city: e.target.value }))} required />
                <input className="rounded-xl border border-cyan-100 bg-white px-3 py-2 text-sm" type="number" placeholder="Seats" value={tableForm.seats} onChange={(e) => setTableForm((v) => ({ ...v, seats: Number(e.target.value) }))} required />
                <input className="rounded-xl border border-cyan-100 bg-white px-3 py-2 text-sm" type="number" placeholder="Price" value={tableForm.price} onChange={(e) => setTableForm((v) => ({ ...v, price: Number(e.target.value) }))} required />
                <select className="rounded-xl border border-cyan-100 bg-white px-3 py-2 text-sm" value={tableForm.status} onChange={(e) => setTableForm((v) => ({ ...v, status: e.target.value }))}>
                  {tableStatusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <button disabled={!selectedRestaurantId} className="rounded-full bg-gradient-to-r from-[#22c1c3] to-[#2563eb] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 md:col-span-3 xl:col-span-6">Create Table for {selectedRestaurant?.name || "selected restaurant"}</button>
              </form>
            ) : null}

            {moduleSlug === "deals" ? (
              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                {(["user", "vendor"]).map((audience) => {
                  const form = dealForms[audience];
                  return (
                    <form
                      key={audience}
                      onSubmit={async (event) => {
                        event.preventDefault();
                        await handleCreateDeal(audience);
                      }}
                      className="grid gap-3 rounded-2xl border border-cyan-100 bg-cyan-50 p-4"
                    >
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">{audience === "user" ? "User deals" : "Vendor deals"}</p>
                        <h4 className="mt-1 text-lg font-semibold text-slate-900">{audience === "user" ? "Create deal for users" : "Create deal for vendors"}</h4>
                      </div>
                      <input className="rounded-xl border border-cyan-100 bg-white px-3 py-2 text-sm" placeholder="Deal title" value={form.title} onChange={(e) => setDealForms((current) => ({ ...current, [audience]: { ...current[audience], title: e.target.value } }))} required />
                      <input className="rounded-xl border border-cyan-100 bg-white px-3 py-2 text-sm" placeholder="Code" value={form.code} onChange={(e) => setDealForms((current) => ({ ...current, [audience]: { ...current[audience], code: e.target.value } }))} />
                      <textarea className="min-h-24 rounded-xl border border-cyan-100 bg-white px-3 py-2 text-sm" placeholder="Description" value={form.description} onChange={(e) => setDealForms((current) => ({ ...current, [audience]: { ...current[audience], description: e.target.value } }))} />
                      <div className="grid gap-3 md:grid-cols-3">
                        <input className="rounded-xl border border-cyan-100 bg-white px-3 py-2 text-sm" type="number" min="0" placeholder="Discount %" value={form.discount} onChange={(e) => setDealForms((current) => ({ ...current, [audience]: { ...current[audience], discount: Number(e.target.value) } }))} required />
                        <input className="rounded-xl border border-cyan-100 bg-white px-3 py-2 text-sm" type="number" min="0" placeholder="Min order" value={form.minOrder} onChange={(e) => setDealForms((current) => ({ ...current, [audience]: { ...current[audience], minOrder: Number(e.target.value) } }))} />
                        <input className="rounded-xl border border-cyan-100 bg-white px-3 py-2 text-sm" type="date" value={form.validUntil} onChange={(e) => setDealForms((current) => ({ ...current, [audience]: { ...current[audience], validUntil: e.target.value } }))} />
                      </div>
                      <label className="inline-flex items-center gap-2 text-sm font-medium text-cyan-900/80">
                        <input type="checkbox" checked={form.isActive} onChange={(e) => setDealForms((current) => ({ ...current, [audience]: { ...current[audience], isActive: e.target.checked } }))} />
                        Active deal
                      </label>
                      <button className="rounded-full bg-gradient-to-r from-[#22c1c3] to-[#2563eb] px-4 py-2 text-sm font-semibold text-white">
                        Add {audience === "user" ? "user" : "vendor"} deal
                      </button>
                    </form>
                  );
                })}
              </div>
            ) : null}

            {moduleSlug === "reports" ? (
              <div className="mt-6 grid gap-4 xl:grid-cols-3">
                <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4 xl:col-span-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">Export</p>
                      <h4 className="mt-1 text-lg font-semibold text-slate-900">Admin PDF report</h4>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadReport}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#22c1c3] to-[#2563eb] px-4 py-2 text-sm font-semibold text-white"
                    >
                      <FaFilePdf /> Download PDF
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-cyan-100 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">Top restaurants</p>
                  <div className="mt-3 space-y-3">
                    {(moduleData?.topRestaurants ?? []).map((restaurant) => (
                      <div key={`${restaurant.name}-${restaurant.location}`} className="rounded-xl bg-cyan-50 px-3 py-2 text-sm">
                        <p className="font-semibold text-slate-900">{restaurant.name}</p>
                        <p className="text-xs text-cyan-900/60">{restaurant.location || "-"} | {restaurant.isActive ? "Active" : "Inactive"}</p>
                      </div>
                    ))}
                    {!(moduleData?.topRestaurants ?? []).length ? <p className="text-sm text-cyan-900/60">No restaurants yet.</p> : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-cyan-100 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">Recent bookings</p>
                  <div className="mt-3 space-y-3">
                    {(moduleData?.recentBookings ?? []).slice(0, 5).map((booking, index) => (
                      <div key={`${booking.restaurantName}-${booking.date}-${booking.time}-${index}`} className="rounded-xl bg-cyan-50 px-3 py-2 text-sm">
                        <p className="font-semibold text-slate-900">{booking.restaurantName || "Restaurant"}</p>
                        <p className="text-xs text-cyan-900/60">{booking.customerName || "Guest"} | {booking.date || "-"} {booking.time || ""} | {booking.status}</p>
                      </div>
                    ))}
                    {!(moduleData?.recentBookings ?? []).length ? <p className="text-sm text-cyan-900/60">No bookings yet.</p> : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-cyan-100 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">Recent payments</p>
                  <div className="mt-3 space-y-3">
                    {(moduleData?.recentPayments ?? []).slice(0, 5).map((payment, index) => (
                      <div key={`${payment.provider}-${payment.amount}-${index}`} className="rounded-xl bg-cyan-50 px-3 py-2 text-sm">
                        <p className="font-semibold text-slate-900">{formatCurrency(payment.amount)}</p>
                        <p className="text-xs text-cyan-900/60">{payment.provider || "Provider"} | {payment.status || "-"}</p>
                      </div>
                    ))}
                    {!(moduleData?.recentPayments ?? []).length ? <p className="text-sm text-cyan-900/60">No payments yet.</p> : null}
                  </div>
                </div>
              </div>
            ) : null}

            {moduleSlug === "revenue" ? (
              <div className="mt-6 space-y-5">
                {(() => {
                  const revenue = buildRevenueSummary(moduleRows);
                  return (
                    <>
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">Gross earnings</p>
                          <p className="mt-2 text-3xl font-semibold text-slate-900">{formatCurrency(revenue.totalRevenue)}</p>
                          <p className="mt-1 text-sm text-cyan-900/60">{revenue.successfulCount} successful payments</p>
                        </div>
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Paid to restaurants</p>
                          <p className="mt-2 text-3xl font-semibold text-slate-900">{formatCurrency(revenue.paidOut)}</p>
                          <p className="mt-1 text-sm text-emerald-900/60">Completed payouts</p>
                        </div>
                        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Pending payouts</p>
                          <p className="mt-2 text-3xl font-semibold text-slate-900">{formatCurrency(revenue.pendingPayout)}</p>
                          <p className="mt-1 text-sm text-amber-900/60">Still payable</p>
                        </div>
                        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">Failed amount</p>
                          <p className="mt-2 text-3xl font-semibold text-slate-900">{formatCurrency(revenue.failedAmount)}</p>
                          <p className="mt-1 text-sm text-rose-900/60">{revenue.failedCount} failed payments</p>
                        </div>
                      </div>

                      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                        <div className="rounded-2xl border border-cyan-100 bg-white p-5">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">Restaurant earnings</p>
                              <h4 className="mt-1 text-xl font-semibold text-slate-900">Revenue by restaurant</h4>
                            </div>
                            <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">{revenue.byRestaurant.length} restaurants</span>
                          </div>
                          <div className="mt-4 space-y-3">
                            {revenue.byRestaurant.slice(0, 8).map((restaurant) => (
                              <div key={restaurant.restaurantName} className="grid gap-3 rounded-2xl border border-cyan-100 bg-cyan-50 p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                                <div>
                                  <p className="font-semibold text-slate-900">{restaurant.restaurantName}</p>
                                  <p className="mt-1 text-xs text-cyan-900/60">{restaurant.location || "Location not set"} | {restaurant.payments} payments</p>
                                </div>
                                <div className="text-sm font-semibold text-slate-900">{formatCurrency(restaurant.revenue)}</div>
                                <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-700">
                                  Pending {formatCurrency(restaurant.pendingPayout)}
                                </div>
                              </div>
                            ))}
                            {!revenue.byRestaurant.length ? <p className="rounded-2xl bg-cyan-50 p-4 text-sm text-cyan-900/60">No restaurant revenue yet.</p> : null}
                          </div>
                        </div>

                        <div className="space-y-5">
                          <div className="rounded-2xl border border-cyan-100 bg-white p-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">Payment methods</p>
                            <div className="mt-4 space-y-3">
                              {revenue.byMethod.map((method) => {
                                const width = revenue.totalRevenue ? Math.max(8, Math.round((method.amount / revenue.totalRevenue) * 100)) : 0;
                                return (
                                  <div key={method.method}>
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="font-semibold text-slate-900">{method.method}</span>
                                      <span className="text-cyan-900/70">{formatCurrency(method.amount)}</span>
                                    </div>
                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-cyan-50">
                                      <div className="h-full rounded-full bg-gradient-to-r from-[#22c1c3] to-[#2563eb]" style={{ width: `${width}%` }} />
                                    </div>
                                  </div>
                                );
                              })}
                              {!revenue.byMethod.length ? <p className="text-sm text-cyan-900/60">No payment methods yet.</p> : null}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-cyan-100 bg-white p-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">Recent earnings</p>
                            <div className="mt-4 space-y-3">
                              {moduleRows.slice(0, 5).map((payment) => (
                                <button
                                  key={payment._id}
                                  type="button"
                                  onClick={() => setSelectedPayment(payment)}
                                  className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50 p-3 text-left transition hover:border-cyan-300"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm font-semibold text-slate-900">{payment.restaurantName || "Restaurant"}</span>
                                    <span className="text-sm font-semibold text-cyan-700">{formatCurrency(payment.amount)}</span>
                                  </div>
                                  <p className="mt-1 text-xs text-cyan-900/60">{payment.customerName || "Guest"} | {payment.status || "status"} | {payment.payoutStatus === "paid" ? "Paid out" : "Pending payout"}</p>
                                </button>
                              ))}
                              {!moduleRows.length ? <p className="text-sm text-cyan-900/60">No payment records yet.</p> : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : null}

            {moduleSlug !== "payments" ? <div className="mt-6 overflow-hidden rounded-2xl border border-cyan-100">
              <div className="grid grid-cols-5 bg-cyan-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
                <span>Item</span><span>Details</span><span>{moduleSlug === "menus" ? "Vendor Status" : "Status"}</span><span>Amount</span><span>Action</span>
              </div>
              <div className="divide-y divide-cyan-100 bg-white">
                {rows.map((row) => {
                  const rowStatus = getRowStatus(row, moduleSlug);
                  return (
                    <div key={row._id} className="grid grid-cols-5 items-center gap-3 px-4 py-4 text-sm">
                      <span className="font-semibold text-slate-900">{moduleSlug === "payments" ? row.restaurantName : moduleSlug === "waitlist" ? `${row.name || "Guest"} #${row.position ?? "-"}` : moduleSlug === "reviews" ? row.customerName || row.title || "Review" : moduleSlug === "notifications" ? row.title || row.restaurantName || "Notification" : row.title || row.name || row.restaurantName || row.tableId || row.code || row.eventName || row.provider || "Item"}</span>
                      <span className="text-cyan-900/70">{getRowDetails(row, moduleSlug)}</span>
                      <span><span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(rowStatus)}`}>{rowStatus}</span></span>
                      <span className="text-cyan-900/70">{moduleSlug === "reports" ? (row.amount !== "" ? formatCurrency(row.amount) : row.value) : moduleSlug === "waitlist" ? `${row.guests ?? "-"} guests` : row.amount ? `Rs ${Number(row.amount).toLocaleString("en-IN")}` : row.price ? `Rs ${Number(row.price).toLocaleString("en-IN")}` : row.discount ? `${row.discount}%` : "-"}</span>
                      <div className="flex flex-wrap gap-2 justify-self-start">
                        {moduleSlug === "restaurants" && <Link to={`/admin/restaurants/${row._id}`} className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">Manage</Link>}
                        {moduleSlug === "restaurants" && <button onClick={() => handleRestaurantStatus(row._id, row.isActive)} className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">{row.isActive ? "Deactivate" : "Activate"}</button>}
                        {(moduleSlug === "bookings" || moduleSlug === "qr-check-in") && statusOptions.map((status) => <button key={status} onClick={() => handleBookingStatus(row._id, status)} className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">{status}</button>)}
                        {moduleSlug === "tables" && tableStatusOptions.map((status) => <button key={status} onClick={() => handleTableStatus(row._id, status)} className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">{status}</button>)}
                        {moduleSlug === "waitlist" && ["notified", "seated", "cancelled"].map((status) => <button key={status} onClick={() => handleWaitlistStatus(row._id, status)} className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">{status}</button>)}
                        {(moduleSlug === "vendors" || moduleSlug === "customers") && <button onClick={() => handleAccountBlock(row)} className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">{row.isBlocked ? "Unblock" : "Block"}</button>}
                        {moduleSlug === "deals" && <button onClick={() => handleToggleDeal(row)} className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">{row.isActive ? "Deactivate" : "Activate"}</button>}
                        {moduleSlug === "payments" && row.payoutStatus !== "paid" && <Link to={getRestaurantPayoutPath(row)} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Pay restaurant</Link>}
                        {moduleSlug === "payments" && row.payoutStatus === "paid" && <Link to={getRestaurantPayoutPath(row)} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Paid to restaurant</Link>}
                        {(moduleSlug === "orders" || moduleSlug === "revenue" || (moduleSlug === "payments" && row.payoutStatus === "paid") || moduleSlug === "coupons" || moduleSlug === "spin-win") && (
                          <button
                            type="button"
                            onClick={() => {
                              if (moduleSlug === "payments") setSelectedPayment(row);
                              if (moduleSlug === "revenue") setSelectedPayment(row);
                              if (moduleSlug === "orders") setSelectedOrder(row);
                            }}
                            className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700"
                          >
                            View
                          </button>
                        )}
                        {moduleSlug !== "orders" && moduleSlug !== "payments" && moduleSlug !== "revenue" && moduleSlug !== "reports" && <button onClick={() => handleDelete(row._id)} className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600"><FaTrash />Delete</button>}
                      </div>
                    </div>
                  );
                })}
                {!rows.length ? <div className="px-4 py-6 text-sm text-cyan-900/60">{showingAllPayments ? "No payments found yet." : isRestaurantScopedModule ? `No ${scopedItemLabel} found for the selected restaurant.` : "No records available for this module yet."}</div> : null}
              </div>
            </div> : null}
          </>
        )}
      </section>

      {selectedPayment ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-100 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 bg-cyan-50 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-600">Receipt</p>
                <h3 className="mt-1 text-2xl font-semibold text-slate-900">{selectedPayment.restaurantName || "Payment receipt"}</h3>
                <p className="mt-1 text-sm text-cyan-900/70">{selectedPayment.restaurantLocation ? `${selectedPayment.restaurantLocation} | ` : ""}Transaction {selectedPayment.transactionId || selectedPayment._id}</p>
              </div>
              <button
                type="button"
                aria-label="Close receipt"
                onClick={() => setSelectedPayment(null)}
                className="rounded-full bg-white p-3 text-cyan-700 shadow-sm"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="grid gap-4 rounded-2xl border border-cyan-100 p-4 md:grid-cols-2">
                <ReceiptField label="Customer" value={selectedPayment.customerName || "Guest"} />
                <ReceiptField label="Email" value={selectedPayment.customerEmail} />
                <ReceiptField label="Phone" value={selectedPayment.customerPhone} />
                <ReceiptField label="Booking date" value={[selectedPayment.date, selectedPayment.time].filter(Boolean).join(" at ")} />
                <ReceiptField label="Branch" value={selectedPayment.restaurantLocation} />
                <ReceiptField label="Payment method" value={selectedPayment.method || selectedPayment.provider} />
                <ReceiptField label="Created" value={formatDateTime(selectedPayment.createdAt)} />
              </div>

              <div className="rounded-2xl border border-cyan-100">
                <div className="flex items-center justify-between border-b border-cyan-100 px-4 py-3 text-sm">
                  <span className="font-semibold text-slate-900">Payment amount</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(selectedPayment.amount)}</span>
                </div>
                <div className="grid gap-3 px-4 py-4 md:grid-cols-3">
                  <ReceiptField label="Status" value={selectedPayment.status} />
                  <ReceiptField label="Payout" value={selectedPayment.payoutStatus === "paid" ? "Paid to restaurant" : "Pending"} />
                  <ReceiptField label="Payout date" value={formatDateTime(selectedPayment.payoutAt)} />
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-cyan-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700"
                >
                  <FaPrint /> Print
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  className="rounded-full bg-gradient-to-r from-[#22c1c3] to-[#2563eb] px-4 py-2 text-sm font-semibold text-white"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {selectedOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-100 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 bg-cyan-50 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-600">Order</p>
                <h3 className="mt-1 text-2xl font-semibold text-slate-900">{selectedOrder.name || "Order item"}</h3>
                <p className="mt-1 text-sm text-cyan-900/70">{selectedOrder.restaurantName || "Restaurant"} | {selectedOrder.date || "Booking date"}</p>
              </div>
              <button
                type="button"
                aria-label="Close order"
                onClick={() => setSelectedOrder(null)}
                className="rounded-full bg-white p-3 text-cyan-700 shadow-sm"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="grid gap-4 rounded-2xl border border-cyan-100 p-4 md:grid-cols-2">
                <ReceiptField label="Customer" value={selectedOrder.customerName || "Guest"} />
                <ReceiptField label="Email" value={selectedOrder.customerEmail} />
                <ReceiptField label="Phone" value={selectedOrder.customerPhone} />
                <ReceiptField label="Booking time" value={[selectedOrder.date, selectedOrder.time].filter(Boolean).join(" at ")} />
                <ReceiptField label="Order status" value={selectedOrder.status} />
                <ReceiptField label="Payment status" value={selectedOrder.paymentStatus} />
              </div>

              <div className="rounded-2xl border border-cyan-100">
                <div className="grid grid-cols-4 border-b border-cyan-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">
                  <span>Item</span>
                  <span>Qty</span>
                  <span>Price</span>
                  <span>Total</span>
                </div>
                <div className="grid grid-cols-4 px-4 py-4 text-sm font-semibold text-slate-900">
                  <span>{selectedOrder.name || "Order item"}</span>
                  <span>{selectedOrder.quantity || 1}</span>
                  <span>{formatCurrency(selectedOrder.price)}</span>
                  <span>{formatCurrency(selectedOrder.amount)}</span>
                </div>
              </div>

              <div className="grid gap-4 rounded-2xl border border-cyan-100 p-4 md:grid-cols-3">
                <ReceiptField label="Booking ID" value={selectedOrder.bookingId} />
                <ReceiptField label="Transaction" value={selectedOrder.transactionId} />
                <ReceiptField label="Payment method" value={selectedOrder.paymentMethod} />
              </div>

              <div className="flex justify-end border-t border-cyan-100 pt-5">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
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
