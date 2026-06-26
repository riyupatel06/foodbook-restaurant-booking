import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { FaArrowUp, FaBars, FaChevronDown, FaXmark } from "react-icons/fa6";
import { FaBell } from "react-icons/fa";
import AssistantChat from "./AssistantChat";
import { useAuth } from "../context/AuthContext";
import { apiGet, getToken } from "../lib/api";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Restaurants", to: "/restaurants" },
  { label: "Menu", to: "/menu" },
  { label: "Book Table", to: "/booking" },
  { label: "Events", to: "/events" },
  { label: "Rewards", to: "/loyalty" },
];

const featureItems = [
  { label: "QR Check-In", to: "/qr-checkin", description: "Scan and check in fast." },
  { label: "Last Minute Deals", to: "/last-minute-deals", description: "Grab same-day offers." },
  { label: "Rebook Table", to: "/rebook", description: "Book your favourite table again." },
];

function navLinkClass({ isActive }) {
  return [
    "rounded-full px-4 py-2 text-sm font-semibold transition",
    isActive
      ? "bg-white/10 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.14)]"
      : "text-slate-300 hover:bg-white/10 hover:text-white",
  ].join(" ");
}

export default function SiteShell() {
  const [open, setOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const accountRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [menuPath, setMenuPath] = useState(location.pathname);
  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "Guest";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "G";

  const closeMenus = () => {
    setOpen(false);
    setFeaturesOpen(false);
    setAccountOpen(false);
  };

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const height =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = height > 0 ? (scrollTop / height) * 100 : 0;

      setScrollProgress(progress);
      setShowBackToTop(scrollTop > 560);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [location.pathname]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!accountRef.current?.contains(event.target)) {
        setAccountOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      const timer = window.setTimeout(() => setNotificationCount(0), 0);
      return () => window.clearTimeout(timer);
    }

    apiGet("/notifications", getToken())
      .then((items) => setNotificationCount(Array.isArray(items) ? items.length : 0))
      .catch(() => setNotificationCount(0));
  }, [isAuthenticated, location.pathname]);

  const menuOpen = open && menuPath === location.pathname;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgba(255,159,67,0.2),transparent_28%),radial-gradient(circle_at_top_right,rgba(88,199,255,0.16),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(255,107,139,0.14),transparent_25%),linear-gradient(180deg,#09111f_0%,#050816_100%)]" />
      <div className="bg-orb left-[-80px] top-24 h-56 w-56 bg-[#ff9f43]/30 blur-3xl" />
      <div className="bg-orb right-[-80px] top-64 h-72 w-72 bg-[#58c7ff]/20 blur-3xl" />
      <div className="bg-orb bottom-[-110px] left-1/3 h-72 w-72 bg-[#ff6b8b]/16 blur-3xl" />

      <div className="fixed left-0 top-0 z-[60] h-1 w-full bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-[#ff9f43] via-[#ffbe7a] to-[#58c7ff] transition-[width] duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/72 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <NavLink to="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#ff9f43] via-[#ffbe7a] to-[#ff6b8b] text-lg font-black text-slate-950 shadow-lg shadow-orange-500/20">
              F
            </span>
            <div>
              <p className="font-display text-3xl font-bold leading-none text-white">
                RestorantBooking
              </p>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                Book, taste, repeat
              </p>
            </div>
          </NavLink>

          <nav className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClass} onClick={closeMenus}>
                {item.label}
              </NavLink>
            ))}
            <div className="relative">
              <button
                type="button"
                onClick={() => setFeaturesOpen((value) => !value)}
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                Features
              </button>
              {featuresOpen ? (
                <div className="absolute right-0 top-full z-50 mt-3 w-[22rem] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0b1222]/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl">
                  <div className="grid gap-2">
                    {featureItems.map((feature) => (
                      <NavLink
                        key={feature.to}
                        to={feature.to}
                        onClick={closeMenus}
                        className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 transition hover:border-white/10 hover:bg-white/10"
                      >
                        <div className="text-sm font-semibold text-white">{feature.label}</div>
                        <div className="mt-1 text-xs leading-6 text-slate-400">{feature.description}</div>
                      </NavLink>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            {isAuthenticated ? (
              <>
              <Link
                to="/notifications"
                onClick={closeMenus}
                className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-orange-200 transition hover:border-white/20 hover:bg-white/10"
                aria-label="Notifications"
              >
                <FaBell />
                {notificationCount > 0 ? (
                  <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#ff6b8b] px-1.5 py-0.5 text-center text-[10px] font-black text-white">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                ) : null}
              </Link>
              <div ref={accountRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAccountOpen((value) => !value)}
                  className="flex h-12 items-center gap-3 rounded-full border border-white/10 bg-white/5 pl-1.5 pr-4 text-left text-slate-200 shadow-lg shadow-black/10 transition hover:border-white/20 hover:bg-white/10"
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#ff9f43] to-[#58c7ff] text-sm font-black text-slate-950">
                    {user?.picture ? (
                      <img src={user.picture} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials
                    )}
                  </span>
                  <span className="max-w-[8.5rem] truncate text-sm font-semibold">{displayName}</span>
                  <FaChevronDown className={`text-xs text-slate-400 transition ${accountOpen ? "rotate-180" : ""}`} />
                </button>

                {accountOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1222]/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl"
                  >
                    <Link
                      to="/profile#edit-profile"
                      onClick={closeMenus}
                      className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
                    >
                      Profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        closeMenus();
                        navigate("/");
                      }}
                      className="block w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-rose-200 transition hover:bg-rose-400/10 hover:text-rose-100"
                    >
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
              </>
            ) : (
              <>
                <Link
                  to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  Login
                </Link>
                <Link
                  to={`/register?next=${encodeURIComponent(location.pathname + location.search)}`}
                  className="rounded-full bg-gradient-to-r from-[#ff9f43] to-[#ff6b8b] px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/20 transition hover:scale-[1.02]"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 lg:hidden"
            onClick={() => {
              setMenuPath(location.pathname);
              setOpen((value) => !value);
            }}
            aria-label="Toggle navigation"
          >
            {menuOpen ? <FaXmark /> : <FaBars />}
          </button>
        </div>

        {menuOpen ? (
          <div className="border-t border-white/10 bg-[#060a14]/95 px-4 py-4 backdrop-blur-xl lg:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={navLinkClass}
                  onClick={() => {
                    closeMenus();
                    setMenuPath(item.to);
                  }}
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="mt-2 rounded-3xl border border-white/10 bg-white/5 p-3">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-orange-300">
                  Features
                </p>
                <div className="grid gap-2">
                  {featureItems.map((feature) => (
                    <NavLink
                      key={feature.to}
                      to={feature.to}
                      className="rounded-2xl border border-white/5 bg-black/10 px-4 py-3 transition hover:bg-white/10"
                      onClick={() => {
                        closeMenus();
                        setMenuPath(feature.to);
                      }}
                    >
                      <div className="text-sm font-semibold text-white">{feature.label}</div>
                      <div className="mt-1 text-xs leading-6 text-slate-400">{feature.description}</div>
                    </NavLink>
                  ))}
                </div>
              </div>
              <div className="mt-2">
                {isAuthenticated ? (
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-3">
                    <div className="mb-3 flex items-center gap-3 px-1">
                      <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#ff9f43] to-[#58c7ff] text-sm font-black text-slate-950">
                        {user?.picture ? (
                          <img src={user.picture} alt="" className="h-full w-full object-cover" />
                        ) : (
                          initials
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">{displayName}</p>
                        <p className="truncate text-xs text-slate-400">{user?.email ?? "Signed in"}</p>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Link
                        to="/profile#edit-profile"
                        onClick={closeMenus}
                        className="rounded-2xl border border-white/5 bg-black/10 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                      >
                        Profile
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          closeMenus();
                          navigate("/");
                        }}
                        className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-left text-sm font-semibold text-rose-100"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Link
                      to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
                      className="flex-1 rounded-full border border-white/10 px-4 py-2 font-semibold text-slate-200 text-center"
                    >
                      Login
                    </Link>
                    <Link
                      to={`/register?next=${encodeURIComponent(location.pathname + location.search)}`}
                      className="flex-1 rounded-full bg-gradient-to-r from-[#ff9f43] to-[#ff6b8b] px-4 py-2 font-semibold text-slate-950 text-center"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        ) : null}
      </header>

      <main className="relative z-10">
        <div key={location.pathname} className="page-transition">
          <Outlet />
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-black/20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.25fr_1fr_1fr] lg:px-8">
          <div className="space-y-4">
            <p className="font-display text-4xl font-bold text-white">RestorantBooking</p>
            <p className="max-w-md text-sm leading-7 text-slate-400">
              A modern restaurant discovery and booking experience designed to feel premium,
              fast, and easy to explore on any device.
            </p>
          </div>

          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-orange-300">
              Explore
            </p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm text-slate-300">
                {[
                  { label: "Home", to: "/" },
                  { label: "Restaurants", to: "/restaurants" },
                  { label: "Menu", to: "/menu" },
                  { label: "Book Table", to: "/booking" },
                  { label: "Events", to: "/events" },
                  { label: "Rewards", to: "/loyalty" },
                  { label: "Last Minute Deals", to: "/last-minute-deals" },
                  { label: "Profile", to: "/profile" },
                  { label: "Rebook Table", to: "/rebook" },
                ].map((item) => (
                <NavLink key={item.to} to={item.to} className="transition hover:text-white">
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-orange-300">
              Contact
            </p>
            <div className="space-y-3 text-sm text-slate-300">
              <p>Support: hello@restorantbooking.app</p>
              <p>Open daily: 11:00 AM - 11:00 PM</p>
              <p>Delivery and reservations available</p>
            </div>
          </div>
        </div>
      </footer>

      {showBackToTop ? (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-[#0b1222]/90 text-white shadow-2xl shadow-black/40 backdrop-blur transition hover:-translate-y-1 hover:bg-white/10"
          aria-label="Back to top"
        >
          <FaArrowUp />
        </button>
      ) : null}

      <AssistantChat
        onBookTable={(table) => {
          const params = new URLSearchParams({
            city: table.city,
            tableType: table.type,
          });
          navigate(`/booking?${params.toString()}`);
        }}
        onSearchMenu={(food) => {
          const params = new URLSearchParams({
            restaurant: food.restaurant,
            city: food.location,
            tableType: food.tableType,
            dish: food.name,
          });
          navigate(`/booking?${params.toString()}`);
        }}
      />
    </div>
  );
}
