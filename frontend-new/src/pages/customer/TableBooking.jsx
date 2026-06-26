import { useEffect, useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaChair,
  FaClock,
  FaMapMarkerAlt,
  FaRegCheckCircle,
  FaStar,
  FaMap,
} from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiGet } from "../../lib/api";
import { normalizeTable, uniqueValues } from "../../lib/catalog";

export default function TableBooking() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const restaurantParam = searchParams.get("restaurant") ?? "";
  const restaurantIdParam = searchParams.get("restaurantId") ?? "";
  const cityParam = searchParams.get("city") ?? "";
  const tableTypeParam = searchParams.get("tableType") ?? "";
  const dishParam = searchParams.get("dish") ?? "";
  const itemsParam = searchParams.get("items") ?? "";

  const [selectedCity, setSelectedCity] = useState(cityParam || "Thaltej");
  const [selectedType, setSelectedType] = useState(tableTypeParam || "All");
  const [selectedTable, setSelectedTable] = useState(null);
  const [tables, setTables] = useState([]);
  const [status, setStatus] = useState("loading");
  const [guests, setGuests] = useState("4 Guests");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("dinner");
  const [time, setTime] = useState("20:00");
  const [dateBounds] = useState(() => {
    const today = new Date();
    const maxDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    return {
      min: today.toISOString().slice(0, 10),
      max: maxDate.toISOString().slice(0, 10),
    };
  });

  const branches = useMemo(() => uniqueValues(tables, (table) => table.city, ["Thaltej"]), [tables]);
  const tableTypes = useMemo(() => ["All", ...uniqueValues(tables, (table) => table.type, ["Indoor"])], [tables]);

  useEffect(() => {
    apiGet("/tables", "")
      .then((response) => {
        const normalizedTables = response
          .map(normalizeTable)
          .filter((table) => {
            if (restaurantIdParam) return String(table.restaurantId) === String(restaurantIdParam);
            if (restaurantParam) return table.restaurant === restaurantParam;
            return true;
          });
        setTables(normalizedTables);
        setStatus("ready");

        const initialCity = normalizedTables.some((table) => table.city === cityParam)
          ? cityParam
          : normalizedTables[0]?.city ?? "Thaltej";
        const initialType = normalizedTables.some((table) => table.type === tableTypeParam)
          ? tableTypeParam
          : "All";
        const firstTable =
          normalizedTables.find(
            (table) => table.city === initialCity && (initialType === "All" || table.type === initialType),
          ) ?? normalizedTables[0] ?? null;

        setSelectedCity(initialCity);
        setSelectedType(initialType);
        setSelectedTable(firstTable);
      })
      .catch((error) => {
        setStatus(error.message || "Unable to load tables from backend");
      });
  }, [cityParam, restaurantIdParam, restaurantParam, tableTypeParam]);

  const visibleTables = useMemo(() => {
    return tables.filter((table) => {
      const matchesCity = table.city === selectedCity;
      const matchesType = selectedType === "All" || table.type === selectedType;
      return matchesCity && matchesType;
    });
  }, [selectedCity, selectedType, tables]);

  const mapTables = useMemo(() => {
    return visibleTables.map((table, index) => {
      const row = Math.floor(index / 4);
      const column = index % 4;

      return {
        ...table,
        row,
        column,
        selected: selectedTable?.id === table.id,
      };
    });
  }, [selectedTable?.id, visibleTables]);

  const total = selectedTable?.price ?? 0;
  const selectedRestaurantOnline = selectedTable?.restaurantProfile?.isActive !== false;
  const bookingContext = [restaurantParam, cityParam, tableTypeParam, dishParam].filter(Boolean);
  const slots = [
    { id: "morning", label: "Morning", time: "10:00", note: "10:00 AM - 12:00 PM" },
    { id: "lunch", label: "Lunch", time: "13:00", note: "12:30 PM - 3:30 PM" },
    { id: "dinner", label: "Dinner", time: "20:00", note: "7:00 PM - 11:00 PM" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="glass-panel-strong rounded-[2rem] p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="space-y-4">
            <span className="section-kicker">Table booking</span>
            <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              Choose your locality, table type, and reservation slot
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
              The booking experience now supports multiple table styles like couple, family, rooftop,
              private, VIP, and outdoor, all tuned for Ahmedabad localities.
            </p>
            {bookingContext.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {restaurantParam ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                    Restaurant: {restaurantParam}
                  </span>
                ) : null}
                {dishParam ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                    Dish: {dishParam}
                  </span>
                ) : null}
                {tableTypeParam ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                    Table: {tableTypeParam}
                  </span>
                ) : null}
              </div>
            ) : null}
            {itemsParam ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                <p className="mb-2 font-semibold text-white">Selected menu items</p>
                <p className="leading-7">{itemsParam}</p>
              </div>
            ) : null}
            {!selectedRestaurantOnline ? (
              <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {restaurantParam || selectedTable?.restaurant || "This restaurant"} is offline right now. Booking is disabled until the restaurant comes online.
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {restaurantParam || selectedTable?.restaurant || "Restaurant"} is online and accepting bookings.
              </div>
            )}
          </div>

          <div className="glass-panel rounded-[1.5rem] p-5">
            <div className="flex items-center gap-3 text-slate-200">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-200">
                <FaRegCheckCircle />
              </div>
              <div>
                <p className="text-sm text-slate-400">Quick confirmation</p>
                <p className="font-semibold text-white">Booking layout is ready</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <div className="mb-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[1.75rem] border border-white/10 bg-[#08101f] p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-400/15 text-cyan-200">
                  <FaMap />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Smart table view</p>
                  <h3 className="text-2xl font-bold text-white">2D restaurant map</h3>
                </div>
              </div>

              <div className="relative mt-5 h-[420px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,159,67,0.14),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(88,199,255,0.12),transparent_28%),linear-gradient(180deg,#0b1222_0%,#050816_100%)]">
                <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-slate-200 backdrop-blur">
                  Entrance
                </div>
                <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-slate-200 backdrop-blur">
                  Kitchen
                </div>
                <div className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-slate-200 backdrop-blur">
                  Bar
                </div>

                <div className="absolute inset-0 p-4">
                  <div className="relative h-full w-full rounded-[1.25rem] border border-dashed border-white/10">
                    {mapTables.map((table) => (
                      <button
                        key={table.id}
                        type="button"
                        onClick={() => setSelectedTable(table)}
                        className={`absolute w-[20%] min-w-[92px] rounded-2xl border px-3 py-3 text-left shadow-lg transition duration-300 ${
                          table.selected
                            ? "border-orange-300/60 bg-orange-400/20 shadow-[0_0_0_1px_rgba(255,159,67,0.35)] scale-[1.03]"
                            : table.status === "available"
                              ? "border-emerald-400/30 bg-emerald-400/10 hover:bg-white/10"
                              : "border-white/10 bg-white/5 hover:bg-white/10"
                        }`}
                        style={{
                          left: `${6 + table.column * 22}%`,
                          top: `${18 + table.row * 22}%`,
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-white">{table.id}</span>
                          <span className={`h-2.5 w-2.5 rounded-full ${table.selected ? "bg-orange-300" : table.status === "available" ? "bg-emerald-300" : "bg-rose-300"}`} />
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{table.type}</p>
                        <p className="mt-2 text-xs text-slate-300">{table.seats} seats</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
                <span>Selected table</span>
                <span className="font-semibold text-white">{selectedTable?.id}</span>
              </div>
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="section-kicker">Locality</span>
                <h2 className="font-display mt-2 text-3xl font-bold text-white sm:text-4xl">
                  Select your area
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {branches.map((branch) => (
                  <button
                    key={branch}
                    onClick={() => {
                      setSelectedCity(branch);
                      const nextTable = tables.find(
                        (table) => table.city === branch && (selectedType === "All" || table.type === selectedType),
                      );
                      setSelectedTable(nextTable ?? tables.find((table) => table.city === branch) ?? tables[0]);
                    }}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                      selectedCity === branch
                        ? "bg-white text-slate-950"
                        : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    <FaMapMarkerAlt className={selectedCity === branch ? "text-slate-950" : "text-orange-200"} />
                    {branch}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {tableTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedType(type);
                    const nextTable = tables.find(
                      (table) => table.city === selectedCity && (type === "All" || table.type === type),
                    );
                    setSelectedTable(nextTable ?? tables.find((table) => table.city === selectedCity) ?? tables[0]);
                  }}
                  className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                    selectedType === type
                      ? "bg-gradient-to-r from-[#ff9f43] to-[#ff6b8b] text-slate-950"
                      : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
            <FaChair className="text-orange-200" />
            {visibleTables.length} tables in {selectedCity}
          </div>

          {status !== "ready" ? (
            <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              {status === "loading" ? "Loading tables from backend..." : status}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleTables.map((table) => {
              const active = selectedTable?.id === table.id;

              return (
                <button
                  key={table.id}
                  onClick={() => setSelectedTable(table)}
                  className={`lift-card rounded-[1.5rem] border p-4 text-left transition ${
                    active
                      ? "border-orange-300/50 bg-orange-400/15 shadow-[0_0_0_1px_rgba(255,159,67,0.35)]"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-white">{table.id}</h3>
                    <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                      {table.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{table.type}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {table.city} · {table.seats} seats
                  </p>
                  <p className="mt-3 text-base font-bold text-orange-200">Rs. {table.price}</p>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="space-y-8">
          <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <span className="section-kicker">Summary</span>
            <h2 className="font-display mt-2 text-3xl font-bold text-white sm:text-4xl">
              Booking details
            </h2>

            <div className="mt-6 space-y-4 text-sm text-slate-300">
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span>City</span>
                <span className="font-semibold text-white">{selectedCity}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span>Table</span>
                <span className="font-semibold text-white">{selectedTable?.id}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span>Type</span>
                <span className="font-semibold text-white">{selectedTable?.type}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span>Seats</span>
                <span className="font-semibold text-white">{selectedTable?.seats}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span>Reservation fee</span>
                <span className="font-semibold text-white">Rs. {selectedTable?.price}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-lg font-bold text-white">
                <span>Total</span>
                <span>Rs. {total}</span>
              </div>
            </div>
          </section>

          <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <span className="section-kicker">Reserve</span>
            <h2 className="font-display mt-2 text-3xl font-bold text-white">Choose your slot</h2>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm text-slate-400">
                  <FaCalendarAlt className="text-orange-200" />
                  Date
                </span>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  min={dateBounds.min}
                  max={dateBounds.max}
                  className="w-full rounded-2xl border border-white/10 bg-[#0b1222] px-4 py-3 text-slate-200 outline-none"
                />
                <p className="mt-2 text-xs text-slate-500">Bookings are allowed only up to 30 days in advance.</p>
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm text-slate-400">
                  <FaClock className="text-orange-200" />
                  Time Slot
                </span>
                <div className="grid gap-2">
                  {slots.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSlot(item.id);
                        setTime(item.time);
                      }}
                      className={`rounded-2xl border px-4 py-3 text-left transition ${
                        slot === item.id
                          ? "border-orange-300/50 bg-orange-400/15 text-white"
                          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      <span className="block font-semibold">{item.label}</span>
                      <span className="text-xs text-slate-400">{item.note}</span>
                    </button>
                  ))}
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-400">Guests</span>
                <select
                  value={guests}
                  onChange={(event) => setGuests(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#0b1222] px-4 py-3 text-slate-200 outline-none"
                >
                  <option>2 Guests</option>
                  <option>4 Guests</option>
                  <option>6 Guests</option>
                  <option>8 Guests</option>
                  <option>10 Guests</option>
                  <option>12 Guests</option>
                </select>
              </label>

                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                  <FaStar className="text-amber-300" />
                  Perfect for birthdays, family dinners, and business meals
                </div>

              <button
                type="button"
                disabled={!selectedRestaurantOnline}
                onClick={() => {
                  if (!selectedRestaurantOnline) {
                    window.alert("This restaurant is offline right now. Please try again when it is online.");
                    return;
                  }
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const selectedDate = date ? new Date(`${date}T00:00:00`) : null;
                  const maxDate = new Date(today);
                  maxDate.setDate(maxDate.getDate() + 30);
                  if (!selectedDate || Number.isNaN(selectedDate.getTime()) || selectedDate < today || selectedDate > maxDate) {
                    window.alert("Please choose a valid booking date within the next 30 days.");
                    return;
                  }
                  const paymentParams = new URLSearchParams(searchParams);
                  paymentParams.set("tableId", selectedTable?.id ?? "");
                  paymentParams.set("restaurantId", selectedTable?.restaurantId ?? searchParams.get("restaurantId") ?? "");
                  paymentParams.set("restaurant", restaurantParam || selectedTable?.restaurant || "");
                  paymentParams.set("city", selectedCity);
                  paymentParams.set("tableType", selectedTable?.type ?? selectedType);
                  paymentParams.set("total", String(total));
                  paymentParams.set("guests", guests);
                  paymentParams.set("date", date);
                  paymentParams.set("time", time);
                  paymentParams.set("slot", slot);
                  paymentParams.set("bookingMode", "standard");
                  const target = `/payment?${paymentParams.toString()}`;
                  if (!isAuthenticated) {
                    navigate(`/login?next=${encodeURIComponent(target)}`);
                    return;
                  }
                  navigate(target);
                }}
                className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#ff9f43] to-[#ff6b8b] px-5 py-3 font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {selectedRestaurantOnline ? "Proceed to payment" : "Restaurant Offline"}
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
