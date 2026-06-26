import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaMapMarkerAlt, FaStar } from "react-icons/fa";
import { apiGet } from "../../lib/api";
import { normalizeRestaurant } from "../../lib/catalog";

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    apiGet("/restaurants", "")
      .then((response) => {
        setRestaurants(response.map(normalizeRestaurant));
        setStatus("ready");
      })
      .catch((error) => {
        setStatus(error.message || "Unable to load restaurants");
      });
  }, []);

  const buildMenuLink = (restaurant) =>
    `/menu?${new URLSearchParams({
      restaurant: restaurant.name,
      city: restaurant.location,
      tableType: restaurant.cuisine === "Fast Food" ? "Indoor" : "Family",
    }).toString()}`;

  const buildBookingLink = (restaurant) =>
    `/booking?${new URLSearchParams({
      restaurantId: restaurant.id,
      restaurant: restaurant.name,
      city: restaurant.location,
      tableType: restaurant.cuisine === "Fast Food" ? "Indoor" : "Family",
    }).toString()}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="mt-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <span className="section-kicker">Restaurants</span>
            <h1 className="font-display mt-2 text-4xl font-bold text-white sm:text-5xl">
              All restaurant locations
            </h1>
          </div>
          <p className="text-sm uppercase tracking-[0.24em] text-orange-200">{restaurants.length} total</p>
        </div>

        {status !== "ready" ? (
          <div className="glass-panel rounded-[1.5rem] p-5 text-slate-300">
            {status === "loading" ? "Loading restaurants from backend..." : status}
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {restaurants.map((restaurant, index) => (
            <article
              key={restaurant.id}
              className="glass-panel lift-card overflow-hidden rounded-[1.75rem]"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="h-full w-full object-cover transition duration-500 hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-transparent to-transparent" />
                <div className="absolute left-4 top-4 rounded-full bg-black/30 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                  {restaurant.vibe}
                </div>
                <div className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur ${restaurant.isActive ? "bg-emerald-500/20 text-emerald-100" : "bg-rose-500/20 text-rose-100"}`}>
                  {restaurant.isActive ? "Online" : "Offline"}
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{restaurant.name}</h2>
                    <p className="mt-1 text-sm text-slate-400">{restaurant.cuisine}</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-amber-400/10 px-3 py-1 text-sm text-amber-200">
                    <FaStar className="text-amber-300" />
                    {restaurant.rating}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <FaMapMarkerAlt className="text-orange-300" />
                  {restaurant.location}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <Link
                    to={`/restaurant/${restaurant.id}`}
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#ff9f43] to-[#ff6b8b] px-4 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
                  >
                    View Details
                  </Link>
                  <Link
                    to={buildMenuLink(restaurant)}
                    className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Open Menu
                  </Link>
                  {restaurant.isActive ? (
                    <Link
                      to={buildBookingLink(restaurant)}
                      className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Book Table
                    </Link>
                  ) : (
                    <span className="inline-flex items-center justify-center rounded-full border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100">
                      Offline
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
