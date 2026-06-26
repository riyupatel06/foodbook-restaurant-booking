import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { FaMapMarkerAlt, FaParking, FaStar, FaWifi, FaUtensils } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { apiGet } from "../../lib/api";
import { normalizeMenuItem, normalizeRestaurant, normalizeTable } from "../../lib/catalog";

export default function RestaurantDetails() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [restaurantMenu, setRestaurantMenu] = useState([]);
  const [tables, setTables] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    Promise.all([
      apiGet(`/restaurants/${id}`, ""),
      apiGet(`/menu?restaurantId=${encodeURIComponent(id)}`, ""),
      apiGet(`/tables?restaurantId=${encodeURIComponent(id)}`, ""),
    ])
      .then(([restaurantResponse, menuResponse, tableResponse]) => {
        setRestaurant(normalizeRestaurant(restaurantResponse));
        setRestaurantMenu(menuResponse.map(normalizeMenuItem));
        setTables(tableResponse.map(normalizeTable));
        setStatus("ready");
      })
      .catch((error) => {
        setStatus(error.message || "Unable to load restaurant details");
      });
  }, [id]);

  const defaultTableType = tables[0]?.type ?? (restaurant?.cuisine === "Fast Food" ? "Indoor" : "Family");
  const restaurantOnline = restaurant?.isActive !== false;
  const bookingParams = useMemo(() => {
    if (!restaurant) return new URLSearchParams();

    return new URLSearchParams({
      restaurantId: restaurant.id,
      restaurant: restaurant.name,
      city: restaurant.location,
      tableType: defaultTableType,
    });
  }, [defaultTableType, restaurant]);
  const menuParams = useMemo(() => {
    if (!restaurant) return new URLSearchParams();

    return new URLSearchParams({
      restaurant: restaurant.name,
      city: restaurant.location,
    });
  }, [restaurant]);
  const tableParams = bookingParams;

  if (!restaurant) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 text-slate-300 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-[1.5rem] p-6">
          {status === "loading" ? "Loading restaurant from backend..." : status}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="glass-panel-strong overflow-hidden rounded-[2rem]">
        <div className="relative h-[420px]">
          <img src={restaurant.image} alt={restaurant.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-[#050816]/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
            <div className="max-w-3xl space-y-4">
              <span className="section-kicker">Restaurant profile</span>
              <h1 className="font-display text-5xl font-bold text-white sm:text-6xl">
                {restaurant.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-200">
                <span className="inline-flex items-center gap-2 rounded-full bg-black/30 px-4 py-2 backdrop-blur">
                  <FaStar className="text-amber-300" />
                  {restaurant.rating}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-black/30 px-4 py-2 backdrop-blur">
                  <FaMapMarkerAlt className="text-orange-300" />
                  Ahmedabad, {restaurant.location}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-black/30 px-4 py-2 backdrop-blur">
                  {restaurant.cuisine}
                </span>
                <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur ${restaurantOnline ? "bg-emerald-500/20 text-emerald-100" : "bg-rose-500/20 text-rose-100"}`}>
                  {restaurantOnline ? "Online" : "Restaurant is offline"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          <section className="glass-panel rounded-[1.75rem] p-6 sm:p-8">
            <span className="section-kicker">About</span>
            <h2 className="font-display mt-2 text-4xl font-bold text-white">Why people come back</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
              {restaurant.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to={`/menu?${menuParams.toString()}`}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#ff9f43] to-[#ff6b8b] px-5 py-3 font-semibold text-slate-950"
              >
                Open Menu
              </Link>
              <button
                type="button"
                disabled={!restaurantOnline}
                onClick={() => {
                  if (!restaurantOnline) return;
                  const target = `/booking?${tableParams.toString()}`;
                  if (!isAuthenticated) {
                    navigate(`/login?next=${encodeURIComponent(target)}`);
                    return;
                  }
                  navigate(target);
                }}
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {restaurantOnline ? "Book Table" : "Offline"}
              </button>
            </div>
            {!restaurantOnline ? (
              <p className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                This restaurant is offline right now. Booking will open when the restaurant comes online.
              </p>
            ) : null}
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: <FaWifi />, label: "Free WiFi" },
              { icon: <FaParking />, label: "Parking Available" },
              { icon: <FaUtensils />, label: "Fine Dining" },
            ].map((item) => (
              <div key={item.label} className="glass-panel lift-card rounded-[1.5rem] p-6">
                <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-orange-200">
                  {item.icon}
                </div>
                <p className="text-lg font-semibold text-white">{item.label}</p>
              </div>
            ))}
          </section>

          <section>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <span className="section-kicker">Menu</span>
                <h2 className="font-display mt-2 text-4xl font-bold text-white">All dishes in this restaurant</h2>
              </div>
              <Link
                to={`/menu?${menuParams.toString()}`}
                className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 sm:inline-flex"
              >
                Open full menu
              </Link>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {restaurantMenu.map((dish) => (
                <article key={dish.id} className="glass-panel lift-card overflow-hidden rounded-[1.5rem]">
                  <div className="h-44 overflow-hidden">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="h-full w-full object-cover transition duration-500 hover:scale-110"
                    />
                  </div>
                  <div className="space-y-2 p-4">
                    <h3 className="text-lg font-bold text-white">{dish.name}</h3>
                    <p className="text-sm text-slate-400">{dish.category}</p>
                    <p className="text-sm font-semibold text-orange-200">Rs. {dish.price}</p>
                    <p className="text-xs text-slate-500">Best with {dish.tableType} tables</p>
                    <Link
                      to={`/menu?${new URLSearchParams({
                        restaurant: restaurant.name,
                        city: restaurant.location,
                        dish: dish.name,
                      }).toString()}`}
                      className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Add from menu
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-5 sm:hidden">
              <Link
                to={`/menu?${menuParams.toString()}`}
                className="inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Open full menu
              </Link>
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          <section className="glass-panel rounded-[1.75rem] p-6 sm:p-8">
            <span className="section-kicker">Availability</span>
            <h2 className="font-display mt-2 text-3xl font-bold text-white">Tables ready now</h2>

            <div className="mt-5 grid grid-cols-2 gap-4">
              {tables.map((table) => (
                <div
                  key={table.mongoId ?? table.id}
                  className="rounded-3xl border border-white/10 bg-white/5 p-4 text-center text-white"
                >
                  <p className="text-xl font-bold">{table.id}</p>
                  <p className="mt-1 text-xs text-slate-400">{table.type}</p>
                  <p className="mt-2 text-sm text-emerald-300">{table.status}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel rounded-[1.75rem] p-6 sm:p-8">
            <span className="section-kicker">Book now</span>
            <h2 className="font-display mt-2 text-3xl font-bold text-white">Choose your time</h2>

            <div className="mt-5 space-y-4">
              <input
                type="date"
                className="w-full rounded-2xl border border-white/10 bg-[#0b1222] px-4 py-3 text-slate-200 outline-none"
              />
              <input
                type="time"
                className="w-full rounded-2xl border border-white/10 bg-[#0b1222] px-4 py-3 text-slate-200 outline-none"
              />
              <select className="w-full rounded-2xl border border-white/10 bg-[#0b1222] px-4 py-3 text-slate-200 outline-none">
                <option>2 Guests</option>
                <option>4 Guests</option>
                <option>6 Guests</option>
                <option>8 Guests</option>
              </select>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={!restaurantOnline}
                  onClick={() => {
                    if (!restaurantOnline) return;
                    const target = `/booking?${bookingParams.toString()}`;
                    if (!isAuthenticated) {
                      navigate(`/login?next=${encodeURIComponent(target)}`);
                      return;
                    }
                    navigate(target);
                  }}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#ff9f43] to-[#ff6b8b] px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {restaurantOnline ? "Confirm Booking" : "Restaurant Offline"}
                </button>
                <Link
                  to={`/menu?${menuParams.toString()}`}
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white"
                >
                  View Menu
                </Link>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
