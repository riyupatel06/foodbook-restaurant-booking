import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBirthdayCake, FaBriefcase, FaGlassCheers, FaUsers } from "react-icons/fa";
import { apiGet, apiPost, getToken } from "../../lib/api";

const eventTypes = [
  { id: "birthday", label: "Birthday", icon: FaBirthdayCake },
  { id: "party", label: "Party", icon: FaGlassCheers },
  { id: "corporate", label: "Corporate Meeting", icon: FaBriefcase },
];

export default function EventBooking() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ restaurantId: "", eventType: "birthday", eventName: "", guests: "10", date: "", time: "20:00", combineTables: true, tables: "", recurringFrequency: "none", recurringEndsOn: "", notes: "" });

  useEffect(() => {
    apiGet("/restaurants").then(setRestaurants).catch(() => setRestaurants([]));
    apiGet("/customer/events").then(setEvents).catch(() => setEvents([]));
  }, []);

  const preview = useMemo(() => restaurants.find((r) => r._id === form.restaurantId), [form.restaurantId, restaurants]);

  const submit = async () => {
    const payload = {
      restaurantId: form.restaurantId || restaurants[0]?._id,
      eventType: form.eventType,
      eventName: form.eventName || `${eventTypes.find((t) => t.id === form.eventType)?.label ?? "Event"} Celebration`,
      guests: Number(form.guests),
      date: form.date,
      time: form.time,
      combineTables: form.combineTables,
      tables: form.tables.split(",").map((item) => item.trim()).filter(Boolean),
      recurring: {
        frequency: form.recurringFrequency,
        endsOn: form.recurringEndsOn || undefined,
      },
      notes: form.notes,
    };
    await apiPost("/customer/events", payload, getToken());
    const next = new URLSearchParams({
      restaurant: preview?.name ?? "Event restaurant",
      city: preview?.location ?? "Selected city",
      tableType: form.combineTables ? "Combined Tables" : "VIP",
      guests: String(form.guests),
      date: form.date,
      time: form.time,
      slot: "dinner",
      items: form.eventName || "Event booking",
    });
    navigate(`/booking-success?${next.toString()}`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="glass-panel-strong rounded-[2rem] p-6 sm:p-8">
        <span className="section-kicker">Event booking</span>
        <h1 className="font-display mt-2 text-4xl font-bold text-white sm:text-5xl">Birthday, party, and corporate reservations</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">Reserve tables for special occasions, combine tables for large groups, and attach recurring schedules for repeat corporate meetups.</p>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <div className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Restaurant</span>
              <select className="w-full rounded-xl bg-slate-950 px-4 py-3 text-white" value={form.restaurantId} onChange={(e) => setForm((s) => ({ ...s, restaurantId: e.target.value }))}>
                <option value="">Choose restaurant</option>
                {restaurants.map((restaurant) => <option key={restaurant._id} value={restaurant._id}>{restaurant.name}</option>)}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              {eventTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button key={type.id} type="button" onClick={() => setForm((s) => ({ ...s, eventType: type.id }))} className={`rounded-2xl border px-4 py-4 text-left ${form.eventType === type.id ? "border-orange-300/50 bg-orange-400/15 text-white" : "border-white/10 bg-slate-950 text-slate-300"}`}>
                    <Icon className="mb-2 text-orange-200" />
                    <div className="font-semibold">{type.label}</div>
                  </button>
                );
              })}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input className="rounded-xl bg-slate-950 px-4 py-3 text-white" placeholder="Event name" value={form.eventName} onChange={(e) => setForm((s) => ({ ...s, eventName: e.target.value }))} />
              <input className="rounded-xl bg-slate-950 px-4 py-3 text-white" placeholder="Guests" value={form.guests} onChange={(e) => setForm((s) => ({ ...s, guests: e.target.value }))} />
              <input type="date" className="rounded-xl bg-slate-950 px-4 py-3 text-white" value={form.date} onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))} />
              <input type="time" className="rounded-xl bg-slate-950 px-4 py-3 text-white" value={form.time} onChange={(e) => setForm((s) => ({ ...s, time: e.target.value }))} />
            </div>
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-200">
              <input type="checkbox" checked={form.combineTables} onChange={(e) => setForm((s) => ({ ...s, combineTables: e.target.checked }))} />
              Combine tables for a larger group
            </label>
            <input className="rounded-xl bg-slate-950 px-4 py-3 text-white" placeholder="Table numbers, comma separated" value={form.tables} onChange={(e) => setForm((s) => ({ ...s, tables: e.target.value }))} />
            <div className="grid gap-4 sm:grid-cols-2">
              <select className="rounded-xl bg-slate-950 px-4 py-3 text-white" value={form.recurringFrequency} onChange={(e) => setForm((s) => ({ ...s, recurringFrequency: e.target.value }))}>
                <option value="none">No recurring booking</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <input type="date" className="rounded-xl bg-slate-950 px-4 py-3 text-white" value={form.recurringEndsOn} onChange={(e) => setForm((s) => ({ ...s, recurringEndsOn: e.target.value }))} />
            </div>
            <textarea className="min-h-28 rounded-xl bg-slate-950 px-4 py-3 text-white" placeholder="Booking notes" value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} />
            <button onClick={submit} className="rounded-full bg-gradient-to-r from-[#ff9f43] to-[#ff6b8b] px-5 py-3 font-semibold text-slate-950">Create Event Booking</button>
          </div>

          <div className="space-y-4 rounded-[1.5rem] border border-white/10 bg-[#07101f] p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-400/15 text-cyan-200"><FaUsers /></div>
              <div>
                <p className="text-sm text-slate-400">Large group support</p>
                <h2 className="text-2xl font-bold text-white">Combine tables, recurring, and notes</h2>
              </div>
            </div>
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event._id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                  <p className="font-semibold text-white">{event.eventName}</p>
                  <p>{event.eventType} • {event.date} • {event.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
