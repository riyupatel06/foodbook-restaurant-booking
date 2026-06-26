import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaClock,
  FaMapMarkerAlt,
  FaStar,
  FaUtensils,
  FaQrcode,
  FaRedo,
  FaBolt,
} from "react-icons/fa";
import heroGraphic from "../../assets/hero.png";
import AnimatedCounter from "../../components/AnimatedCounter";
import { apiGet } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const highlights = [
  {
    title: "Instant booking",
    text: "Reserve a table in seconds with clear availability and smooth checkout.",
  },
  {
    title: "Curated menus",
    text: "Browse beautiful food cards, daily specials, and chef picks before you go.",
  },
  {
    title: "Smart discovery",
    text: "Find the right restaurant by cuisine, rating, city, and vibe in one place.",
  },
];

const dishes = [
  {
    name: "Smoked Veg Platter",
    price: "Rs. 449",
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Golden Butter Biryani",
    price: "Rs. 399",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Charred Pepper Pizza",
    price: "Rs. 499",
    image:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80",
  },
];

const featureLinks = [
  {
    title: "QR Check-In",
    text: "Scan, check in, and open the digital menu instantly.",
    to: "/qr-checkin",
    icon: FaQrcode,
  },
  {
    title: "Last Minute Deals",
    text: "Grab same-day offers before they disappear.",
    to: "/last-minute-deals",
    icon: FaBolt,
  },
  {
    title: "Rebook Table",
    text: "Book your favorite table again in one tap.",
    to: "/rebook",
    icon: FaRedo,
  },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState({
    restaurants: 0,
    bookings: 0,
  });

  useEffect(() => {
    let active = true;

    async function loadStats() {
      try {
        const [restaurants, bookingStats] = await Promise.all([
          apiGet("/restaurants", ""),
          apiGet("/bookings/stats/public", ""),
        ]);

        if (!active) return;

        setStats({
          restaurants: Array.isArray(restaurants) ? restaurants.length : 0,
          bookings: Number(bookingStats?.bookings ?? 0),
        });
      } catch {
        if (active) {
          setStats({ restaurants: 0, bookings: 0 });
        }
      }
    }

    void loadStats();
    return () => {
      active = false;
    };
  }, []);

  const statCards = [
    { value: stats.restaurants, label: "Restaurants" },
    { value: stats.bookings, label: "Bookings", duration: 1800 },
    { value: 480, label: "Happy Guests", suffix: "+", duration: 1500 },
    { value: 4.9, label: "Average Rating", suffix: "/5", decimals: 1 },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <section className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-7">
          <span className="section-kicker fade-up">Premium dining platform</span>

          <div className="space-y-5">
            <h1 className="font-display text-5xl font-bold leading-[0.95] text-white sm:text-6xl lg:text-7xl fade-up-delay-1">
              Discover restaurants that feel
              <span className="gradient-text"> alive, modern, and effortless</span>
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg fade-up-delay-2">
              RestorantBooking brings together restaurant discovery, smooth table booking, and a
              polished menu experience with rich visuals, motion, and a luxury feel.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 fade-up-delay-2">
            <Link
              to="/restaurants"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ff9f43] to-[#ff6b8b] px-6 py-3 font-semibold text-slate-950 shadow-lg shadow-orange-500/20 transition hover:scale-[1.02]"
            >
              Explore Restaurants
              <FaArrowRight />
            </Link>
            <Link
              to="/booking"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Reserve a Table
            </Link>
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-full border border-orange-300/30 bg-orange-400/10 px-6 py-3 font-semibold text-orange-100 transition hover:bg-orange-400/20 hover:text-white"
                >
                  Register
                </Link>
              </>
            ) : null}
          </div>

          {!isAuthenticated ? (
            <div className="flex flex-wrap gap-3 fade-up-delay-3">
              <Link
                to="/login"
                className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
              >
                Already have an account? Login
              </Link>
              <Link
                to="/register"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                New here? Create account
              </Link>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 fade-up-delay-3">
            {["Ahmedabad only", "Fast booking", "Chef specials", "Family friendly"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200"
              >
                {item}
              </span>
            ))}
          </div>

          <div className="glass-panel rounded-[1.75rem] p-5 fade-up-delay-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="section-kicker">Live booking pulse</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  Peak dining activity is happening right now.
                </p>
              </div>
              <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200">
                Open now
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {highlights.map((item, index) => (
              <div
                key={item.title}
                className="glass-panel lift-card rounded-3xl p-5"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#ffbf7a]">
                  <FaUtensils />
                </div>
                <h2 className="mb-2 text-xl font-bold text-white">{item.title}</h2>
                <p className="text-sm leading-7 text-slate-400">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-6 top-10 h-28 w-28 rounded-full bg-[#ff9f43]/25 blur-3xl pulse-ring" />
          <div className="absolute right-4 top-16 h-36 w-36 rounded-full bg-[#58c7ff]/20 blur-3xl float-slow" />

          <div className="glass-panel-strong relative overflow-hidden rounded-[2rem] p-4 sm:p-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_38%)]" />

            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10">
              <img
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=80"
                alt="Elegant restaurant table"
                className="h-[520px] w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-[#050816]/25 to-transparent" />
            </div>

            <div className="absolute left-0 top-0 h-full w-full">
              <img
                src={heroGraphic}
                alt=""
                className="float-slower pointer-events-none absolute right-4 top-5 w-36 opacity-90 sm:right-7 sm:top-7 sm:w-44"
              />
            </div>

            <div className="absolute bottom-4 left-4 right-4 grid gap-4 sm:grid-cols-2">
              <div className="glass-panel rounded-3xl p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300">
                    <FaClock />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Open tonight</p>
                    <p className="font-semibold text-white">11:00 AM - 11:00 PM</p>
                  </div>
                </div>
              </div>
              <div className="glass-panel rounded-3xl p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-400/15 text-orange-300">
                    <FaMapMarkerAlt />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Featured city</p>
                    <p className="font-semibold text-white">Ahmedabad, Gujarat</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((item, index) => (
              <div
                key={item.label}
                className="glass-panel lift-card min-h-[8.5rem] rounded-[1.5rem] p-4 text-center"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <p className="font-display text-[clamp(1.7rem,2.6vw,2.35rem)] font-bold leading-tight text-white">
                  <AnimatedCounter
                    end={item.value}
                    suffix={item.suffix ?? ""}
                    decimals={item.decimals ?? 0}
                    duration={item.duration ?? 1200}
                  />
                </p>
                <p className="mt-3 text-[0.68rem] font-bold uppercase leading-5 tracking-[0.22em] text-slate-400">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-20">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="section-kicker">More features</span>
            <h2 className="font-display mt-2 text-4xl font-bold text-white sm:text-5xl">
              Everything built for faster, smarter restaurant bookings
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-400">
            These flows were already in the app. They’re now surfaced here so customers can actually
            find and use them from the homepage.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featureLinks.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.title}
                to={feature.to}
                className="glass-panel lift-card rounded-[1.75rem] p-5 transition hover:-translate-y-1 hover:bg-white/10"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#ffbf7a]">
                      <Icon />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{feature.title}</h3>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                    Open
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-400">{feature.text}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-20">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="section-kicker">Chef selection</span>
            <h2 className="font-display mt-2 text-4xl font-bold text-white sm:text-5xl">
              Popular dishes designed to make people stay longer
            </h2>
          </div>
          <Link to="/menu" className="text-sm font-semibold text-orange-200 transition hover:text-white">
            View full menu
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {dishes.map((dish, index) => (
            <article
              key={dish.name}
              className="glass-panel lift-card overflow-hidden rounded-[1.75rem]"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <div className="relative h-60 overflow-hidden">
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="h-full w-full object-cover transition duration-500 hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-transparent to-transparent" />
              </div>
              <div className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-2xl font-bold text-white">{dish.name}</h3>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-orange-200">
                    {dish.price}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <FaStar className="text-amber-300" />
                  4.8 rating
                  <span className="mx-2 h-1 w-1 rounded-full bg-slate-500" />
                  Served hot
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
