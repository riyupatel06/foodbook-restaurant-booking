import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowRight, FaCheckCircle, FaExclamationCircle, FaFilter, FaMapMarkerAlt, FaShoppingBag, FaTrash, FaUtensils } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { apiGet } from "../../lib/api";
import { normalizeMenuItem, uniqueValues } from "../../lib/catalog";

const CART_STORAGE_KEY = "foodbook-cart";

function loadCart() {
  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export default function FoodMenu() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [activeRestaurant, setActiveRestaurant] = useState(params.get("restaurant") ?? "All");
  const [activeTableType, setActiveTableType] = useState(params.get("tableType") ?? "All");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeLocation, setActiveLocation] = useState(params.get("city") ?? "All");
  const [query, setQuery] = useState(params.get("dish") ?? "");
  const [sortBy, setSortBy] = useState("featured");
  const [cart, setCart] = useState(loadCart);
  const [foods, setFoods] = useState([]);
  const [status, setStatus] = useState("loading");
  const deferredQuery = useDeferredValue(query);
  const hasRestaurantContext = activeRestaurant !== "All";

  useEffect(() => {
    apiGet("/menu", "")
      .then((response) => {
        setFoods(response.map(normalizeMenuItem));
        setStatus("ready");
      })
      .catch((error) => {
        setStatus(error.message || "Unable to load menu from backend");
      });
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const restaurants = useMemo(() => ["All", ...uniqueValues(foods, (food) => food.restaurant)], [foods]);
  const tableTypes = useMemo(() => ["All", ...uniqueValues(foods, (food) => food.tableType)], [foods]);
  const categories = useMemo(() => ["All", ...uniqueValues(foods, (food) => food.category)], [foods]);
  const locations = useMemo(() => ["All", ...uniqueValues(foods, (food) => food.location)], [foods]);

  const filteredFoods = useMemo(() => {
    const matches = foods.filter((food) => {
      const matchesRestaurant = activeRestaurant === "All" || food.restaurant === activeRestaurant;
      const matchesTableType = activeTableType === "All" || food.tableType === activeTableType;
      const matchesCategory = activeCategory === "All" || food.category === activeCategory;
      const matchesLocation = activeLocation === "All" || food.location === activeLocation;
      const matchesQuery =
        deferredQuery.trim() === "" ||
        food.name.toLowerCase().includes(deferredQuery.toLowerCase()) ||
        food.category.toLowerCase().includes(deferredQuery.toLowerCase()) ||
        food.location.toLowerCase().includes(deferredQuery.toLowerCase()) ||
        food.restaurant.toLowerCase().includes(deferredQuery.toLowerCase());

      return matchesRestaurant && matchesTableType && matchesCategory && matchesLocation && matchesQuery;
    });

    if (sortBy === "price-low") return [...matches].sort((a, b) => a.price - b.price);
    if (sortBy === "price-high") return [...matches].sort((a, b) => b.price - a.price);
    return matches;
  }, [activeCategory, activeLocation, activeRestaurant, activeTableType, deferredQuery, foods, sortBy]);

  const activeRestaurantLabel = activeRestaurant === "All" ? "Any restaurant" : activeRestaurant;
  const activeTableLabel = activeTableType === "All" ? "Any table type" : activeTableType;

  const cartItems = useMemo(
    () =>
      cart
        .map((entry) => {
          const food = foods.find((item) => item.id === entry.id);
          return food ? { ...food, quantity: entry.quantity } : null;
        })
        .filter(Boolean),
    [cart, foods],
  );

  const cartRestaurant = cartItems[0]?.restaurant ?? "";

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addToCart = (food) => {
    if (!food.available) return;

    if (cartItems.length > 0 && cartRestaurant && cartRestaurant !== food.restaurant) {
      return;
    }

    setCart((current) => {
      const existing = current.find((entry) => entry.id === food.id);
      if (existing) {
        return current.map((entry) =>
          entry.id === food.id ? { ...entry, quantity: entry.quantity + 1 } : entry,
        );
      }
      return [...current, { id: food.id, quantity: 1 }];
    });
  };

  const updateCartQuantity = (id, delta) => {
    setCart((current) =>
      current
        .map((entry) =>
          entry.id === id ? { ...entry, quantity: entry.quantity + delta } : entry,
        )
        .filter((entry) => entry.quantity > 0),
    );
  };

  const removeFromCart = (id) => {
    setCart((current) => current.filter((entry) => entry.id !== id));
  };

  const bookTableWithCart = () => {
    const firstItem = cartItems[0];
    const restaurantName = cartRestaurant || (activeRestaurant !== "All" ? activeRestaurant : firstItem?.restaurant ?? "");
    const bookingParams = new URLSearchParams({
      restaurant: restaurantName,
      city: activeLocation !== "All" ? activeLocation : firstItem?.location ?? "",
      tableType: activeTableType !== "All" ? activeTableType : firstItem?.tableType ?? "",
      dish: cartItems.map((item) => item.name).join(", "),
      items: cartItems.map((item) => `${item.name} x${item.quantity}`).join(" | "),
    });

    const target = `/booking?${bookingParams.toString()}`;
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(target)}`);
      return;
    }

    navigate(target);
  };

  const bookDishOnline = (dish) => {
    const bookingParams = new URLSearchParams({
      restaurant: dish.restaurant,
      city: dish.location,
      tableType: dish.tableType,
      dish: dish.name,
      items: `${dish.name} x1`,
    });

    const target = `/booking?${bookingParams.toString()}`;
    navigate(target);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="glass-panel-strong rounded-[2rem] p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="space-y-4">
            <span className="section-kicker">Menu experience</span>
            <h1 className="font-display text-5xl font-bold text-white sm:text-6xl">
              Restaurant-wise and table-wise menu booking
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Choose a restaurant, pick a table style, and add available dishes to your cart before
              booking online.
            </p>

            <div className="flex flex-wrap gap-3">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                {activeRestaurantLabel}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                {activeTableLabel}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                {filteredFoods.length} dishes available
              </span>
            </div>

            {hasRestaurantContext ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                Showing menu for <span className="font-semibold text-white">{activeRestaurant}</span>.
                Use the cart controls to increase, decrease, or remove items before booking.
              </div>
            ) : null}

            {cartRestaurant ? (
              <div className="rounded-2xl border border-orange-300/30 bg-orange-400/10 px-4 py-3 text-sm text-orange-100">
                Cart is locked to <span className="font-semibold text-white">{cartRestaurant}</span>.
                You can add multiple dishes from this restaurant only.
              </div>
            ) : null}
          </div>

          <div className="glass-panel rounded-[1.5rem] p-5">
            <div className="flex items-center gap-3 text-slate-200">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-400/15 text-orange-200">
                <FaUtensils />
              </div>
              <div>
                <p className="text-sm text-slate-400">Cart summary</p>
                <p className="font-semibold text-white">{cartItems.length} items in cart</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const target = "/booking";
                if (!isAuthenticated) {
                  navigate(`/login?next=${encodeURIComponent(target)}`);
                  return;
                }
                navigate(target);
              }}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff9f43] to-[#ff6b8b] px-5 py-3 font-semibold text-slate-950 transition hover:scale-[1.01]"
            >
              <FaShoppingBag />
              Book online now
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto]">
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <FaFilter className="text-orange-200" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="text"
              placeholder="Search dishes, restaurant, category, or city"
              className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
            />
          </label>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="rounded-2xl border border-white/10 bg-[#0b1222] px-4 py-3 text-slate-200 outline-none"
          >
            <option value="featured">Featured first</option>
            <option value="price-low">Price low to high</option>
            <option value="price-high">Price high to low</option>
          </select>
        </div>

        {status !== "ready" ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            {status === "loading" ? "Loading menu from backend..." : status}
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <div className="flex flex-wrap gap-3 lg:col-span-1">
            {restaurants.map((restaurant) => (
              <button
                key={restaurant}
                type="button"
                onClick={() => setActiveRestaurant(restaurant)}
                className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  activeRestaurant === restaurant
                    ? "bg-gradient-to-r from-[#ff9f43] to-[#ff6b8b] text-slate-950"
                    : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                }`}
              >
                {restaurant}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div>
              <p className="text-sm text-slate-400">Current view</p>
              <p className="font-semibold text-white">
                {activeRestaurant === "All" ? "All restaurants" : activeRestaurant}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveRestaurant("All")}
              className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Reset
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            {tableTypes.map((tableType) => (
              <button
                key={tableType}
                type="button"
                onClick={() => setActiveTableType(tableType)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  activeTableType === tableType
                    ? "bg-white text-slate-950"
                    : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                }`}
              >
                {tableType}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                activeCategory === category
                  ? "bg-gradient-to-r from-[#ff9f43] to-[#ff6b8b] text-slate-950"
                  : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {locations.map((loc) => (
            <button
              key={loc}
              onClick={() => setActiveLocation(loc)}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
                activeLocation === loc
                  ? "bg-white text-slate-950"
                  : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
              }`}
            >
              <FaMapMarkerAlt className={activeLocation === loc ? "text-slate-950" : "text-orange-200"} />
              {loc}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredFoods.map((food, index) => (
            <article
              key={food.id}
              className="glass-panel lift-card overflow-hidden rounded-[1.75rem]"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={food.image}
                  alt={food.name}
                  className="h-full w-full object-cover transition duration-500 hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-transparent to-transparent" />
                <div className="absolute left-4 top-4 rounded-full bg-black/30 px-3 py-1 text-xs font-semibold text-orange-100 backdrop-blur">
                  {food.category}
                </div>
                <div className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                  <FaMapMarkerAlt className="text-orange-200" />
                  {food.location}
                </div>
                <div className="absolute bottom-4 left-4 rounded-full bg-black/30 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                  {food.restaurant}
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{food.name}</h2>
                    <p className="mt-1 text-sm text-slate-400">Best for {food.tableType} tables</p>
                  </div>
                  <p className="text-xl font-bold text-orange-200">Rs. {food.price}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                    {food.restaurant}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                    {food.tableType}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                      food.available ? "bg-emerald-400/15 text-emerald-200" : "bg-rose-400/15 text-rose-200"
                    }`}
                  >
                    {food.available ? <FaCheckCircle /> : <FaExclamationCircle />}
                    {food.available ? "Available" : "Not available"}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => bookDishOnline(food)}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff9f43] to-[#ff6b8b] px-4 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01]"
                  >
                    Book online
                    <FaArrowRight />
                  </button>
                  <button
                    type="button"
                    disabled={!food.available}
                    onClick={() => addToCart(food)}
                    className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${
                      food.available
                        ? "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                        : "cursor-not-allowed border border-white/10 bg-white/5 text-slate-500"
                    }`}
                  >
                    Add to cart
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="glass-panel sticky top-24 h-fit rounded-[1.75rem] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-kicker">Cart</p>
              <h2 className="font-display mt-2 text-3xl font-bold text-white">Selected dishes</h2>
            </div>
            <span className="rounded-full bg-white/5 px-3 py-1 text-sm text-slate-200">
              {cartItems.length} items
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {cartItems.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                No dishes in cart yet. Add available items to build your order.
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{item.name}</p>
                      <p className="text-xs text-slate-400">
                        {item.restaurant} | {item.tableType} | Qty {item.quantity}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="rounded-full border border-white/10 bg-black/20 p-2 text-slate-300 transition hover:bg-white/10"
                      aria-label={`Remove ${item.name}`}
                    >
                      <FaTrash />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-slate-400">Rs. {item.price}</span>
                    <span className="font-semibold text-orange-200">Rs. {item.price * item.quantity}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="inline-flex items-center rounded-full border border-white/10 bg-black/20">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.id, -1)}
                        className="h-9 w-9 rounded-full text-slate-200 transition hover:bg-white/10"
                        aria-label={`Decrease quantity for ${item.name}`}
                      >
                        -
                      </button>
                      <span className="min-w-8 px-3 text-center text-sm font-semibold text-white">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.id, 1)}
                        className="h-9 w-9 rounded-full text-slate-200 transition hover:bg-white/10"
                        aria-label={`Increase quantity for ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>Total</span>
              <span className="font-semibold text-white">Rs. {cartTotal}</span>
            </div>
            <button
              type="button"
              onClick={bookTableWithCart}
              disabled={cartItems.length === 0}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${
                cartItems.length > 0
                  ? "bg-gradient-to-r from-[#ff9f43] to-[#ff6b8b] text-slate-950 hover:scale-[1.01]"
                  : "cursor-not-allowed bg-white/10 text-slate-500"
              }`}
            >
              <FaShoppingBag />
              Book table with cart
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
}
