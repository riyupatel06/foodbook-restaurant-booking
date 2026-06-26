import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaEdit,
  FaMapMarkerAlt,
  FaPlus,
  FaStore,
  FaTable,
  FaTrash,
  FaUsers,
  FaUtensils,
} from "react-icons/fa";
import {
  createAdminBooking,
  createAdminMenuItem,
  createAdminTable,
  deleteAdminBooking,
  deleteAdminMenuItem,
  deleteAdminTable,
  deleteRestaurant,
  fetchAdminRestaurantDetail,
  updateAdminBooking,
  updateAdminBookingStatus,
  updateAdminMenuItem,
  updateAdminTable,
  updateRestaurant,
} from "./services/adminApi";

const initialRestaurantForm = {
  name: "",
  location: "",
  cuisine: "",
  vibe: "",
  branchCode: "",
  description: "",
  rating: 0,
  isActive: true,
};

const initialMenuForm = {
  name: "",
  category: "",
  location: "",
  price: 0,
  tableType: "Indoor",
  available: true,
  isVeg: true,
  isCombo: false,
  isFestival: false,
  isTodaySpecial: false,
};

const initialTableForm = {
  tableId: "",
  type: "",
  city: "",
  seats: 4,
  floor: "Ground",
  price: 0,
  status: "available",
};

const initialBookingForm = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  userId: "admin-created",
  tableId: "",
  tableType: "",
  guests: "2",
  date: "",
  time: "",
  slot: "dinner",
  status: "pending",
  checkInStatus: "pending",
};

const bookingStatuses = ["pending", "confirmed", "cancelled"];
const checkInStatuses = ["pending", "verified", "assigned"];
const bookingSlots = ["morning", "lunch", "dinner"];
const tableStatuses = ["available", "reserved", "maintenance"];

function Input({ className = "", ...props }) {
  return <input className={`rounded-xl border border-cyan-100 px-4 py-3 ${className}`} {...props} />;
}

function Select({ className = "", children, ...props }) {
  return <select className={`rounded-xl border border-cyan-100 px-4 py-3 ${className}`} {...props}>{children}</select>;
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-900/75">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function FieldBadge({ label, value }) {
  return (
    <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">{label}</p>
      <p className="mt-2 break-all text-sm text-slate-900">{value || "-"}</p>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div>
      <div className="flex items-center gap-2 font-semibold text-cyan-700">
        <Icon />
        {title}
      </div>
      {subtitle ? <p className="mt-1 text-sm text-cyan-900/60">{subtitle}</p> : null}
    </div>
  );
}

export default function AdminRestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingRestaurant, setSavingRestaurant] = useState(false);
  const [savingMenu, setSavingMenu] = useState(false);
  const [savingTable, setSavingTable] = useState(false);
  const [savingBooking, setSavingBooking] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState("");
  const [editingTableId, setEditingTableId] = useState("");
  const [editingBookingId, setEditingBookingId] = useState("");
  const [restaurantForm, setRestaurantForm] = useState(initialRestaurantForm);
  const [menuForm, setMenuForm] = useState(initialMenuForm);
  const [tableForm, setTableForm] = useState(initialTableForm);
  const [bookingForm, setBookingForm] = useState(initialBookingForm);

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetchAdminRestaurantDetail(id);
      setData(response);
      setRestaurantForm({
        name: response.restaurant?.name ?? "",
        location: response.restaurant?.location ?? "",
        cuisine: response.restaurant?.cuisine ?? "",
        vibe: response.restaurant?.vibe ?? "",
        branchCode: response.restaurant?.branchCode ?? "",
        description: response.restaurant?.description ?? "",
        rating: response.restaurant?.rating ?? 0,
        isActive: Boolean(response.restaurant?.isActive),
      });
      setMenuForm((current) => ({ ...current, location: response.restaurant?.location ?? "" }));
      setTableForm((current) => ({ ...current, city: response.restaurant?.location ?? "" }));
      setBookingForm((current) => ({
        ...current,
        tableId: response.tables?.[0]?.tableId ?? "",
        tableType: response.tables?.[0]?.type ?? "",
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const restaurant = data?.restaurant;
  const bookings = useMemo(() => data?.bookings ?? [], [data]);
  const tables = useMemo(() => data?.tables ?? [], [data]);
  const menuItems = useMemo(() => data?.menuItems ?? [], [data]);
  const payments = useMemo(() => data?.payments ?? [], [data]);
  const totalRevenue = useMemo(() => payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0), [payments]);

  const updateData = (key, value) => {
    setData((current) => ({ ...current, [key]: value }));
  };

  const resetMenuForm = () => {
    setEditingMenuId("");
    setMenuForm({
      ...initialMenuForm,
      location: restaurant?.location ?? "",
    });
  };

  const resetTableForm = () => {
    setEditingTableId("");
    setTableForm({
      ...initialTableForm,
      city: restaurant?.location ?? "",
    });
  };

  const resetBookingForm = () => {
    setEditingBookingId("");
    setBookingForm({
      ...initialBookingForm,
      tableId: tables[0]?.tableId ?? "",
      tableType: tables[0]?.type ?? "",
    });
  };

  const saveRestaurant = async (event) => {
    event.preventDefault();
    setSavingRestaurant(true);
    try {
      const updated = await updateRestaurant(id, restaurantForm);
      setData((current) => ({ ...current, restaurant: updated }));
    } finally {
      setSavingRestaurant(false);
    }
  };

  const removeRestaurant = async () => {
    await deleteRestaurant(id);
    navigate("/admin/restaurants");
  };

  const submitMenu = async (event) => {
    event.preventDefault();
    setSavingMenu(true);
    try {
      if (editingMenuId) {
        const updated = await updateAdminMenuItem(editingMenuId, { ...menuForm, restaurantId: id });
        updateData("menuItems", menuItems.map((item) => (item._id === editingMenuId ? updated : item)));
      } else {
        const created = await createAdminMenuItem({ ...menuForm, restaurantId: id });
        updateData("menuItems", [created, ...menuItems]);
      }
      resetMenuForm();
    } finally {
      setSavingMenu(false);
    }
  };

  const editMenu = (item) => {
    setEditingMenuId(item._id);
    setMenuForm({
      name: item.name ?? "",
      category: item.category ?? "",
      location: item.location ?? restaurant?.location ?? "",
      price: Number(item.price || 0),
      tableType: item.tableType ?? "Indoor",
      available: Boolean(item.available),
      isVeg: Boolean(item.isVeg),
      isCombo: Boolean(item.isCombo),
      isFestival: Boolean(item.isFestival),
      isTodaySpecial: Boolean(item.isTodaySpecial),
    });
  };

  const toggleMenuAvailability = async (item) => {
    const updated = await updateAdminMenuItem(item._id, { available: !item.available });
    updateData("menuItems", menuItems.map((menuItem) => (menuItem._id === item._id ? updated : menuItem)));
  };

  const removeMenu = async (itemId) => {
    await deleteAdminMenuItem(itemId);
    updateData("menuItems", menuItems.filter((item) => item._id !== itemId));
    if (editingMenuId === itemId) resetMenuForm();
  };

  const submitTable = async (event) => {
    event.preventDefault();
    setSavingTable(true);
    try {
      if (editingTableId) {
        const updated = await updateAdminTable(editingTableId, { ...tableForm, restaurantId: id });
        updateData("tables", tables.map((table) => (table._id === editingTableId ? updated : table)));
      } else {
        const created = await createAdminTable({ ...tableForm, restaurantId: id });
        updateData("tables", [created, ...tables]);
      }
      resetTableForm();
    } finally {
      setSavingTable(false);
    }
  };

  const editTable = (table) => {
    setEditingTableId(table._id);
    setTableForm({
      tableId: table.tableId ?? "",
      type: table.type ?? "",
      city: table.city ?? restaurant?.location ?? "",
      seats: Number(table.seats || 0),
      floor: table.floor ?? "Ground",
      price: Number(table.price || 0),
      status: table.status ?? "available",
    });
  };

  const setTableStatus = async (tableId, status) => {
    const updated = await updateAdminTable(tableId, { status });
    updateData("tables", tables.map((table) => (table._id === tableId ? updated : table)));
  };

  const removeTable = async (tableId) => {
    await deleteAdminTable(tableId);
    updateData("tables", tables.filter((table) => table._id !== tableId));
    if (editingTableId === tableId) resetTableForm();
  };

  const submitBooking = async (event) => {
    event.preventDefault();
    setSavingBooking(true);
    try {
      if (editingBookingId) {
        const updated = await updateAdminBooking(editingBookingId, { ...bookingForm, restaurantId: id });
        updateData("bookings", bookings.map((booking) => (booking._id === editingBookingId ? updated : booking)));
      } else {
        const created = await createAdminBooking({ ...bookingForm, restaurantId: id });
        updateData("bookings", [created, ...bookings]);
      }
      resetBookingForm();
    } finally {
      setSavingBooking(false);
    }
  };

  const editBooking = (booking) => {
    setEditingBookingId(booking._id);
    setBookingForm({
      customerName: booking.customerName ?? "",
      customerEmail: booking.customerEmail ?? "",
      customerPhone: booking.customerPhone ?? "",
      userId: booking.userId ?? "admin-created",
      tableId: booking.tableId ?? "",
      tableType: booking.tableType ?? "",
      guests: booking.guests ?? "2",
      date: booking.date ?? "",
      time: booking.time ?? "",
      slot: booking.slot ?? "dinner",
      status: booking.status ?? "pending",
      checkInStatus: booking.checkInStatus ?? "pending",
    });
  };

  const setBookingStatus = async (bookingId, status) => {
    const updated = await updateAdminBookingStatus(bookingId, status);
    updateData("bookings", bookings.map((booking) => (booking._id === bookingId ? updated : booking)));
  };

  const removeBooking = async (bookingId) => {
    await deleteAdminBooking(bookingId);
    updateData("bookings", bookings.filter((booking) => booking._id !== bookingId));
    if (editingBookingId === bookingId) resetBookingForm();
  };

  if (loading) {
    return <div className="rounded-3xl border border-cyan-100 bg-white p-6 shadow-sm">Loading restaurant...</div>;
  }

  if (!restaurant) {
    return <div className="rounded-3xl border border-cyan-100 bg-white p-6 shadow-sm">Restaurant not found.</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-cyan-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link to="/admin/restaurants" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700">
              <FaArrowLeft /> Back to restaurants
            </Link>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900">{restaurant.name}</h2>
            <p className="mt-2 text-sm text-cyan-900/70">Full restaurant control with restaurant info, menu, tables, bookings, and payments in one place.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-2xl bg-cyan-50 px-4 py-3 text-sm text-cyan-900/70">
              <p className="font-semibold text-slate-900">Status</p>
              <p>{restaurant.isActive ? "Active" : "Inactive"}</p>
            </div>
            <button onClick={removeRestaurant} className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
              <FaTrash />
              Delete restaurant
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        <div className="rounded-2xl border border-cyan-100 bg-white p-5 shadow-sm"><p className="text-xs uppercase tracking-[0.2em] text-cyan-600">Bookings</p><p className="mt-2 text-2xl font-semibold text-slate-900">{bookings.length}</p></div>
        <div className="rounded-2xl border border-cyan-100 bg-white p-5 shadow-sm"><p className="text-xs uppercase tracking-[0.2em] text-cyan-600">Tables</p><p className="mt-2 text-2xl font-semibold text-slate-900">{tables.length}</p></div>
        <div className="rounded-2xl border border-cyan-100 bg-white p-5 shadow-sm"><p className="text-xs uppercase tracking-[0.2em] text-cyan-600">Menu Items</p><p className="mt-2 text-2xl font-semibold text-slate-900">{menuItems.length}</p></div>
        <div className="rounded-2xl border border-cyan-100 bg-white p-5 shadow-sm"><p className="text-xs uppercase tracking-[0.2em] text-cyan-600">Payments</p><p className="mt-2 text-2xl font-semibold text-slate-900">{payments.length}</p></div>
        <div className="rounded-2xl border border-cyan-100 bg-white p-5 shadow-sm"><p className="text-xs uppercase tracking-[0.2em] text-cyan-600">Revenue</p><p className="mt-2 text-2xl font-semibold text-slate-900">Rs {totalRevenue.toLocaleString("en-IN")}</p></div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <form onSubmit={saveRestaurant} className="space-y-4 rounded-[28px] border border-cyan-100 bg-white p-6 shadow-sm">
          <SectionHeader icon={FaEdit} title="Edit Restaurant" subtitle="Update the main restaurant profile." />
          <div className="grid gap-3 md:grid-cols-2">
            <Input value={restaurantForm.name} onChange={(e) => setRestaurantForm((v) => ({ ...v, name: e.target.value }))} placeholder="Restaurant name" />
            <Input value={restaurantForm.location} onChange={(e) => setRestaurantForm((v) => ({ ...v, location: e.target.value }))} placeholder="Location" />
            <Input value={restaurantForm.cuisine} onChange={(e) => setRestaurantForm((v) => ({ ...v, cuisine: e.target.value }))} placeholder="Cuisine" />
            <Input value={restaurantForm.vibe} onChange={(e) => setRestaurantForm((v) => ({ ...v, vibe: e.target.value }))} placeholder="Vibe" />
            <Input value={restaurantForm.branchCode} onChange={(e) => setRestaurantForm((v) => ({ ...v, branchCode: e.target.value }))} placeholder="Branch code" />
            <Input type="number" min="0" max="5" step="0.1" value={restaurantForm.rating} onChange={(e) => setRestaurantForm((v) => ({ ...v, rating: Number(e.target.value) }))} placeholder="Rating" />
            <Select value={restaurantForm.isActive ? "true" : "false"} onChange={(e) => setRestaurantForm((v) => ({ ...v, isActive: e.target.value === "true" }))}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
            <textarea className="rounded-xl border border-cyan-100 px-4 py-3 md:col-span-2" rows="4" value={restaurantForm.description} onChange={(e) => setRestaurantForm((v) => ({ ...v, description: e.target.value }))} placeholder="Description" />
          </div>
          <button disabled={savingRestaurant} className="rounded-full bg-gradient-to-r from-[#22c1c3] to-[#2563eb] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70">{savingRestaurant ? "Saving..." : "Save Changes"}</button>
        </form>

        <section className="space-y-4 rounded-[28px] border border-cyan-100 bg-white p-6 shadow-sm">
          <SectionHeader icon={FaMapMarkerAlt} title="Restaurant Data" subtitle="All primary restaurant fields visible for quick review." />
          <div className="grid gap-3 md:grid-cols-2">
            <FieldBadge label="Restaurant ID" value={restaurant._id} />
            <FieldBadge label="Branch Code" value={restaurant.branchCode} />
            <FieldBadge label="Location" value={restaurant.location} />
            <FieldBadge label="Cuisine" value={restaurant.cuisine} />
            <FieldBadge label="Vibe" value={restaurant.vibe} />
            <FieldBadge label="Rating" value={restaurant.rating} />
            <FieldBadge label="Images" value={restaurant.images?.length ? restaurant.images.length : restaurant.image || "No image"} />
            <FieldBadge label="Facilities" value={restaurant.facilities?.length ? restaurant.facilities.join(", ") : "No facilities"} />
            <FieldBadge label="Created" value={restaurant.createdAt ? new Date(restaurant.createdAt).toLocaleString() : "-"} />
            <FieldBadge label="Updated" value={restaurant.updatedAt ? new Date(restaurant.updatedAt).toLocaleString() : "-"} />
          </div>
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-900/70">
            {restaurant.description || "No description added."}
          </div>
        </section>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-cyan-100 bg-white p-6 shadow-sm">
          <SectionHeader icon={FaUtensils} title="Menu Management" subtitle="Add, edit, toggle, and delete menu items." />
          <form onSubmit={submitMenu} className="mt-4 grid gap-3 md:grid-cols-2">
            <Input placeholder="Item name" value={menuForm.name} onChange={(e) => setMenuForm((v) => ({ ...v, name: e.target.value }))} required />
            <Input placeholder="Category" value={menuForm.category} onChange={(e) => setMenuForm((v) => ({ ...v, category: e.target.value }))} required />
            <Input placeholder="Location" value={menuForm.location} onChange={(e) => setMenuForm((v) => ({ ...v, location: e.target.value }))} required />
            <Input type="number" placeholder="Price" value={menuForm.price} onChange={(e) => setMenuForm((v) => ({ ...v, price: Number(e.target.value) }))} required />
            <Input placeholder="Table type" value={menuForm.tableType} onChange={(e) => setMenuForm((v) => ({ ...v, tableType: e.target.value }))} />
            <Toggle label="Available" checked={menuForm.available} onChange={(checked) => setMenuForm((v) => ({ ...v, available: checked }))} />
            <Toggle label="Veg" checked={menuForm.isVeg} onChange={(checked) => setMenuForm((v) => ({ ...v, isVeg: checked }))} />
            <Toggle label="Combo" checked={menuForm.isCombo} onChange={(checked) => setMenuForm((v) => ({ ...v, isCombo: checked }))} />
            <Toggle label="Festival" checked={menuForm.isFestival} onChange={(checked) => setMenuForm((v) => ({ ...v, isFestival: checked }))} />
            <Toggle label="Today Special" checked={menuForm.isTodaySpecial} onChange={(checked) => setMenuForm((v) => ({ ...v, isTodaySpecial: checked }))} />
            <div className="flex gap-3 md:col-span-2">
              <button disabled={savingMenu} className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#22c1c3] to-[#2563eb] px-4 py-3 text-sm font-semibold text-white">
                <FaPlus />
                {savingMenu ? "Saving item..." : editingMenuId ? "Update Menu Item" : "Add Menu Item"}
              </button>
              {editingMenuId ? <button type="button" onClick={resetMenuForm} className="rounded-full border border-cyan-100 px-4 py-3 text-sm font-semibold text-cyan-700">Cancel Edit</button> : null}
            </div>
          </form>

          <div className="mt-4 space-y-3">
            {menuItems.length ? menuItems.map((item) => (
              <div key={item._id} className="rounded-2xl bg-cyan-50 p-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-cyan-900/65">{item.category} - Rs {Number(item.price || 0).toLocaleString("en-IN")} - {item.tableType}</p>
                    <p className="mt-1 text-cyan-900/60">{item.available ? "Available" : "Unavailable"} | {item.isVeg ? "Veg" : "Non-veg"} | {item.isCombo ? "Combo" : "Single"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => editMenu(item)} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-cyan-700">Edit</button>
                    <button type="button" onClick={() => toggleMenuAvailability(item)} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-cyan-700">
                      {item.available ? "Mark unavailable" : "Mark available"}
                    </button>
                    <button type="button" onClick={() => removeMenu(item._id)} className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )) : <p className="text-sm text-cyan-900/60">No menu items added yet.</p>}
          </div>
        </div>

        <div className="rounded-[28px] border border-cyan-100 bg-white p-6 shadow-sm">
          <SectionHeader icon={FaTable} title="Table Management" subtitle="Add, edit, update status, and delete tables." />
          <form onSubmit={submitTable} className="mt-4 grid gap-3 md:grid-cols-2">
            <Input placeholder="Table ID" value={tableForm.tableId} onChange={(e) => setTableForm((v) => ({ ...v, tableId: e.target.value }))} required />
            <Input placeholder="Type" value={tableForm.type} onChange={(e) => setTableForm((v) => ({ ...v, type: e.target.value }))} required />
            <Input placeholder="City" value={tableForm.city} onChange={(e) => setTableForm((v) => ({ ...v, city: e.target.value }))} required />
            <Input type="number" placeholder="Seats" value={tableForm.seats} onChange={(e) => setTableForm((v) => ({ ...v, seats: Number(e.target.value) }))} required />
            <Input placeholder="Floor" value={tableForm.floor} onChange={(e) => setTableForm((v) => ({ ...v, floor: e.target.value }))} />
            <Input type="number" placeholder="Price" value={tableForm.price} onChange={(e) => setTableForm((v) => ({ ...v, price: Number(e.target.value) }))} required />
            <Select className="md:col-span-2" value={tableForm.status} onChange={(e) => setTableForm((v) => ({ ...v, status: e.target.value }))}>
              {tableStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </Select>
            <div className="flex gap-3 md:col-span-2">
              <button disabled={savingTable} className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#22c1c3] to-[#2563eb] px-4 py-3 text-sm font-semibold text-white">
                <FaPlus />
                {savingTable ? "Saving table..." : editingTableId ? "Update Table" : "Add Table"}
              </button>
              {editingTableId ? <button type="button" onClick={resetTableForm} className="rounded-full border border-cyan-100 px-4 py-3 text-sm font-semibold text-cyan-700">Cancel Edit</button> : null}
            </div>
          </form>

          <div className="mt-4 space-y-3">
            {tables.length ? tables.map((table) => (
              <div key={table._id} className="rounded-2xl bg-cyan-50 p-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{table.tableId}</p>
                    <p className="text-cyan-900/65">{table.type} - {table.seats} seats - Floor {table.floor}</p>
                    <p className="mt-1 text-cyan-900/60">{table.city} | Rs {Number(table.price || 0).toLocaleString("en-IN")} | {table.status}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => editTable(table)} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-cyan-700">Edit</button>
                    {tableStatuses.map((status) => (
                      <button type="button" key={status} onClick={() => setTableStatus(table._id, status)} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-cyan-700">
                        {status}
                      </button>
                    ))}
                    <button type="button" onClick={() => removeTable(table._id)} className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )) : <p className="text-sm text-cyan-900/60">No tables linked to this restaurant.</p>}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-cyan-100 bg-white p-6 shadow-sm">
          <SectionHeader icon={FaUsers} title="Booking Management" subtitle="Add, edit, update status, and delete table bookings." />
          <form onSubmit={submitBooking} className="mt-4 grid gap-3 md:grid-cols-2">
            <Input placeholder="Customer name" value={bookingForm.customerName} onChange={(e) => setBookingForm((v) => ({ ...v, customerName: e.target.value }))} />
            <Input placeholder="Customer email" value={bookingForm.customerEmail} onChange={(e) => setBookingForm((v) => ({ ...v, customerEmail: e.target.value }))} />
            <Input placeholder="Customer phone" value={bookingForm.customerPhone} onChange={(e) => setBookingForm((v) => ({ ...v, customerPhone: e.target.value }))} />
            <Input placeholder="User ID" value={bookingForm.userId} onChange={(e) => setBookingForm((v) => ({ ...v, userId: e.target.value }))} />
            <Select value={bookingForm.tableId} onChange={(e) => {
              const selectedTable = tables.find((table) => table.tableId === e.target.value);
              setBookingForm((v) => ({ ...v, tableId: e.target.value, tableType: selectedTable?.type || v.tableType }));
            }}>
              <option value="">Select table</option>
              {tables.map((table) => <option key={table._id} value={table.tableId}>{table.tableId}</option>)}
            </Select>
            <Input placeholder="Table type" value={bookingForm.tableType} onChange={(e) => setBookingForm((v) => ({ ...v, tableType: e.target.value }))} required />
            <Input placeholder="Guests" value={bookingForm.guests} onChange={(e) => setBookingForm((v) => ({ ...v, guests: e.target.value }))} required />
            <Input type="date" value={bookingForm.date} onChange={(e) => setBookingForm((v) => ({ ...v, date: e.target.value }))} required />
            <Input type="time" value={bookingForm.time} onChange={(e) => setBookingForm((v) => ({ ...v, time: e.target.value }))} required />
            <Select value={bookingForm.slot} onChange={(e) => setBookingForm((v) => ({ ...v, slot: e.target.value }))}>
              {bookingSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
            </Select>
            <Select value={bookingForm.status} onChange={(e) => setBookingForm((v) => ({ ...v, status: e.target.value }))}>
              {bookingStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </Select>
            <Select value={bookingForm.checkInStatus} onChange={(e) => setBookingForm((v) => ({ ...v, checkInStatus: e.target.value }))}>
              {checkInStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </Select>
            <div className="flex gap-3 md:col-span-2">
              <button disabled={savingBooking} className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#22c1c3] to-[#2563eb] px-4 py-3 text-sm font-semibold text-white">
                <FaPlus />
                {savingBooking ? "Saving booking..." : editingBookingId ? "Update Booking" : "Add Booking"}
              </button>
              {editingBookingId ? <button type="button" onClick={resetBookingForm} className="rounded-full border border-cyan-100 px-4 py-3 text-sm font-semibold text-cyan-700">Cancel Edit</button> : null}
            </div>
          </form>

          <div className="mt-4 space-y-3">
            {bookings.length ? bookings.map((booking) => (
              <div key={booking._id} className="rounded-2xl bg-cyan-50 p-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{booking.customerName || "Guest"} ({booking.guests || "-"} guests)</p>
                    <p className="text-cyan-900/60">{booking.customerEmail || "No email"} | {booking.customerPhone || "No phone"}</p>
                    <p className="mt-1 text-cyan-900/60">{booking.date} | {booking.time} | {booking.slot}</p>
                    <p className="mt-1 text-cyan-900/60">Table {booking.tableId} | {booking.tableType} | {booking.status} | Check-in {booking.checkInStatus}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => editBooking(booking)} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-cyan-700">Edit</button>
                    {bookingStatuses.map((status) => (
                      <button type="button" key={status} onClick={() => setBookingStatus(booking._id, status)} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-cyan-700">
                        {status}
                      </button>
                    ))}
                    <button type="button" onClick={() => removeBooking(booking._id)} className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )) : <p className="text-sm text-cyan-900/60">No bookings found.</p>}
          </div>
        </div>

        <div className="rounded-[28px] border border-cyan-100 bg-white p-6 shadow-sm">
          <SectionHeader icon={FaStore} title="Payments" subtitle="All payments linked to this restaurant's bookings." />
          <div className="mt-4 space-y-3">
            {payments.length ? payments.map((payment) => (
              <div key={payment._id} className="rounded-2xl bg-cyan-50 px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{payment.provider || "Payment"}</p>
                    <p className="text-cyan-900/60">{payment.status} | {payment.method || "Method not set"}</p>
                    <p className="mt-1 break-all text-cyan-900/60">{payment.transactionId || "No transaction ID"}</p>
                  </div>
                  <span>Rs {Number(payment.amount || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>
            )) : <p className="text-sm text-cyan-900/60">No payments linked to this restaurant.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
