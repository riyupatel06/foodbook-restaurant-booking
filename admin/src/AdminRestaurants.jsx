import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaBan, FaCheckCircle, FaPlus, FaTrash } from "react-icons/fa";
import AdminSectionTitle from "./components/AdminSectionTitle";
import {
  createRestaurant,
  deleteRestaurant,
  fetchAdminDashboard,
  updateRestaurant,
} from "./services/adminApi";

function StatusPill({ active }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

const initialForm = {
  name: "",
  location: "",
  cuisine: "",
  vibe: "",
  branchCode: "",
  description: "",
  rating: 0,
  isActive: true,
};

export default function AdminRestaurants() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setData(await fetchAdminDashboard());
  };

  useEffect(() => {
    load();
  }, []);

  const restaurants = data?.restaurants ?? [];

  const toggle = async (id, isActive) => {
    await updateRestaurant(id, { isActive: !isActive });
    await load();
  };

  const create = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createRestaurant(form);
      setForm(initialForm);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    await deleteRestaurant(id);
    await load();
  };

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-cyan-100 bg-white p-5 shadow-sm">
        <AdminSectionTitle
          kicker="Restaurant Control"
          title="Restaurant Management"
          description="Add, update, activate, deactivate, open details, and remove restaurants."
        />
      </section>

      <section className="rounded-[28px] border border-cyan-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-cyan-700">
          <FaPlus />
          <p className="text-sm font-semibold">Add restaurant</p>
        </div>
        <form onSubmit={create} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input className="rounded-xl border border-cyan-100 px-4 py-3" placeholder="Restaurant name" value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} required />
          <input className="rounded-xl border border-cyan-100 px-4 py-3" placeholder="Location" value={form.location} onChange={(e) => setForm((v) => ({ ...v, location: e.target.value }))} required />
          <input className="rounded-xl border border-cyan-100 px-4 py-3" placeholder="Cuisine" value={form.cuisine} onChange={(e) => setForm((v) => ({ ...v, cuisine: e.target.value }))} required />
          <input className="rounded-xl border border-cyan-100 px-4 py-3" placeholder="Vibe" value={form.vibe} onChange={(e) => setForm((v) => ({ ...v, vibe: e.target.value }))} />
          <input className="rounded-xl border border-cyan-100 px-4 py-3" placeholder="Branch code" value={form.branchCode} onChange={(e) => setForm((v) => ({ ...v, branchCode: e.target.value }))} />
          <input className="rounded-xl border border-cyan-100 px-4 py-3" type="number" min="0" max="5" step="0.1" placeholder="Rating" value={form.rating} onChange={(e) => setForm((v) => ({ ...v, rating: Number(e.target.value) }))} />
          <select className="rounded-xl border border-cyan-100 px-4 py-3" value={form.isActive ? "true" : "false"} onChange={(e) => setForm((v) => ({ ...v, isActive: e.target.value === "true" }))}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <textarea className="rounded-xl border border-cyan-100 px-4 py-3 md:col-span-2 xl:col-span-4" rows="3" placeholder="Description" value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} />
          <button disabled={saving} className="rounded-full bg-gradient-to-r from-[#22c1c3] to-[#2563eb] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70 md:col-span-2 xl:col-span-4">
            {saving ? "Adding..." : "Add Restaurant"}
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-cyan-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-cyan-100">
            <thead className="bg-cyan-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
                <th className="px-5 py-4">Restaurant</th>
                <th className="px-5 py-4">Location</th>
                <th className="px-5 py-4">Cuisine</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-50">
              {restaurants.length ? (
                restaurants.map((restaurant) => (
                  <tr key={restaurant._id} className="bg-white align-top">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{restaurant.name}</p>
                      <p className="text-sm text-cyan-900/60">{restaurant.branchCode || "No branch code"}</p>
                      <Link to={`/admin/restaurants/${restaurant._id}`} className="text-xs font-semibold text-cyan-700">
                        Manage restaurant
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-sm text-cyan-900/75">{restaurant.location}</td>
                    <td className="px-5 py-4 text-sm text-cyan-900/75">{restaurant.cuisine}</td>
                    <td className="px-5 py-4">
                      <StatusPill active={restaurant.isActive} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => toggle(restaurant._id, restaurant.isActive)}
                          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white ${
                            restaurant.isActive ? "bg-rose-500" : "bg-cyan-600"
                          }`}
                        >
                          {restaurant.isActive ? <FaBan /> : <FaCheckCircle />}
                          {restaurant.isActive ? "Deactivate" : "Approve"}
                        </button>
                        <button
                          onClick={() => remove(restaurant._id)}
                          className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600"
                        >
                          <FaTrash />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-5 py-8 text-sm text-cyan-900/60" colSpan={5}>
                    No restaurants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
