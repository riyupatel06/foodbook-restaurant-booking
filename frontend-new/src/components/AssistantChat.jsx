import { useEffect, useRef, useState } from "react";
import {
  FaBrain,
  FaChevronDown,
  FaFilter,
  FaRobot,
  FaStar,
  FaUtensils,
} from "react-icons/fa";
import { apiGet } from "../lib/api";
import { normalizeMenuItem, normalizeRestaurant, normalizeTable, uniqueValues } from "../lib/catalog";

const quickPrompts = [
  "Best healthy food",
  "Cheapest items",
  "Top rated restaurant",
  "Best area wise food",
  "Table available in Thaltej",
  "Show menu and table options",
  "Show all menu items",
  "Show all tables",
  "Best Punjabi restaurant under 500",
];

function normalize(value) {
  return value.toLowerCase().trim();
}

function healthyScore(food) {
  let score = 0;

  if (["Starter", "Main Course"].includes(food.category)) score += 2;
  if (food.name.toLowerCase().includes("tikka")) score += 3;
  if (food.name.toLowerCase().includes("kebab")) score += 3;
  if (food.name.toLowerCase().includes("tandoori")) score += 2;
  if (food.name.toLowerCase().includes("dal")) score += 2;
  if (food.category === "Dessert") score -= 4;
  if (food.price <= 250) score += 1;

  return score;
}

function getRestaurantStats(name, restaurantProfiles) {
  return restaurantProfiles.find((item) => item.name === name) ?? restaurantProfiles[0] ?? { rating: 0, cuisine: "", avgPrice: 0 };
}

function parseBudget(query) {
  const match = query.match(/(?:under|below|within)\s*(?:rs\.?|₹)?\s*(\d+)/);
  return match ? Number(match[1]) : null;
}

function matchesCuisine(query, cuisine) {
  return query.includes(cuisine.toLowerCase());
}

function buildResults(text, datasets) {
  const { branches, enrichedFoods, restaurantProfiles, restaurants, tableTypes, tables } = datasets;
  const query = normalize(text);
  const wantsAll = /\b(all items|show all|everything|all menu|all tables)\b/.test(query);

  const wantsHealthy = /\b(healthy|healthier|light|lightest|best healthy)\b/.test(query);
  const wantsCheap = /\b(cheap|cheapest|budget|low price|price|under rs|under)\b/.test(query);
  const wantsRating = /\b(rating|best|top rated|highest|good restaurant)\b/.test(query);
  const wantsTable = /\b(table|seat|booking|availability)\b/.test(query);
  const wantsArea = branches.some((branch) => query.includes(normalize(branch))) || /\b(area|location|locality|city)\b/.test(query);
  const wantsMenu = /\b(menu|dish|food|item)\b/.test(query);
  const budget = parseBudget(query);
  const wantsPunjabi = matchesCuisine(query, "punjabi");
  const wantsRestaurantQuery = /\b(restaurant|restaurants)\b/.test(query);

  const cityMatch = branches.find((branch) => query.includes(normalize(branch)));
  const restaurantMatch = restaurants.find((name) => name !== "All" && query.includes(normalize(name)));
  const tableTypeMatch = tableTypes.find((type) => type !== "All" && query.includes(normalize(type)));

  const resultFoods = [...enrichedFoods];
  const resultTables = [...tables];
  const resultRestaurants = [...restaurantProfiles];

  if (cityMatch) {
    resultFoods.splice(0, resultFoods.length, ...resultFoods.filter((food) => food.location === cityMatch));
    resultTables.splice(0, resultTables.length, ...resultTables.filter((table) => table.city === cityMatch));
    resultRestaurants.splice(
      0,
      resultRestaurants.length,
      ...resultRestaurants.filter((restaurant) => restaurant.location === cityMatch),
    );
  }

  if (restaurantMatch) {
    const matchedProfile = resultRestaurants.filter((restaurant) => restaurant.name === restaurantMatch);
    resultRestaurants.splice(0, resultRestaurants.length, ...matchedProfile);
    resultFoods.splice(
      0,
      resultFoods.length,
      ...resultFoods.filter((food) => food.restaurant === restaurantMatch),
    );
  }

  if (tableTypeMatch) {
    resultTables.splice(0, resultTables.length, ...resultTables.filter((table) => table.type === tableTypeMatch));
    resultFoods.splice(0, resultFoods.length, ...resultFoods.filter((food) => food.tableType === tableTypeMatch));
  }

  let reply = "I can search all menu items and tables by healthy, price, rating, area, restaurant, or table type.";

  if (wantsHealthy) {
    const healthyFoods = [...resultFoods].sort((a, b) => healthyScore(b) - healthyScore(a)).slice(0, 4);
    reply =
      "Best healthy picks are estimated from the menu name, category, and price. Based on the current menu, these look like the lightest choices.";
    return {
      reply,
      foods: healthyFoods,
      tables: resultTables.slice(0, 4),
      restaurants: resultRestaurants.slice(0, 3),
    };
  }

  if ((wantsPunjabi || wantsRestaurantQuery || budget) && !wantsTable) {
    const maxPrice = budget ?? 500;
    const budgetFoods = enrichedFoods.filter((food) => {
      const restaurant = getRestaurantStats(food.restaurant, restaurantProfiles);
      const matchesCuisineFilter = wantsPunjabi ? restaurant.cuisine === "Punjabi" : true;
      const matchesBudget = food.price <= maxPrice;
      const matchesArea = cityMatch ? food.location === cityMatch : true;
      return matchesCuisineFilter && matchesBudget && matchesArea;
    });
    const budgetRestaurants = restaurantProfiles.filter((restaurant) => {
      const matchesCuisineFilter = wantsPunjabi ? restaurant.cuisine === "Punjabi" : true;
      const matchesBudget = restaurant.avgPrice <= maxPrice;
      const matchesArea = cityMatch ? restaurant.location === cityMatch : true;
      return matchesCuisineFilter && matchesBudget && matchesArea;
    });
    reply = wantsPunjabi
      ? `These are the best Punjabi options under Rs. ${maxPrice}.`
      : `These are the best restaurant options I found under Rs. ${maxPrice}.`;
    return {
      reply,
      foods: budgetFoods.sort((a, b) => a.price - b.price).slice(0, 6),
      tables: resultTables.slice(0, 4),
      restaurants: budgetRestaurants.sort((a, b) => a.avgPrice - b.avgPrice).slice(0, 4),
    };
  }

  if (wantsCheap) {
    const cheapFoods = [...resultFoods].sort((a, b) => a.price - b.price).slice(0, 6);
    const cheapTables = [...resultTables].sort((a, b) => a.price - b.price).slice(0, 6);
    reply = "These are the best-value items I found by price.";
    return {
      reply,
      foods: cheapFoods,
      tables: cheapTables,
      restaurants: resultRestaurants.slice(0, 3),
    };
  }

  if (wantsRating) {
    const topRestaurants = [...resultRestaurants].sort((a, b) => b.rating - a.rating).slice(0, 4);
    const featuredFoods = [...resultFoods]
      .sort((a, b) => getRestaurantStats(b.restaurant, restaurantProfiles).rating - getRestaurantStats(a.restaurant, restaurantProfiles).rating)
      .slice(0, 6);
    reply = "These are the highest-rated restaurant options in the current view.";
    return {
      reply,
      foods: featuredFoods,
      tables: resultTables.slice(0, 4),
      restaurants: topRestaurants,
    };
  }

  if (wantsTable) {
    const sortedTables = [...resultTables].sort((a, b) => a.price - b.price);
    const tableFoods = [...resultFoods].slice(0, 6);
    reply = cityMatch
      ? `Here are the tables currently available in ${cityMatch}.`
      : "Here are the table options I found.";
    return {
      reply,
      foods: tableFoods,
      tables: sortedTables.slice(0, 8),
      restaurants: resultRestaurants.slice(0, 3),
    };
  }

  if (wantsArea) {
    reply = cityMatch
      ? `I filtered the menu and tables for ${cityMatch}.`
      : "Tell me an area or city and I’ll narrow the menu and tables.";
    return {
      reply,
      foods: resultFoods.slice(0, 6),
      tables: resultTables.slice(0, 6),
      restaurants: resultRestaurants.slice(0, 3),
    };
  }

  if (wantsMenu) {
    reply = "Here are matching menu items along with the restaurant and table type suggestions.";
    return {
      reply,
      foods: resultFoods.slice(0, 8),
      tables: resultTables.slice(0, 6),
      restaurants: resultRestaurants.slice(0, 3),
    };
  }

  if (query.length > 0) {
    const searchFoods = resultFoods.filter((food) => {
      return [food.name, food.category, food.location, food.restaurant, food.tableType]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
    const searchTables = resultTables.filter((table) =>
      [table.id, table.type, table.city].join(" ").toLowerCase().includes(query),
    );
    const searchRestaurants = resultRestaurants.filter((restaurant) =>
      [restaurant.name, restaurant.location, restaurant.cuisine, restaurant.vibe]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );

    reply = searchFoods.length || searchTables.length || searchRestaurants.length
      ? "I found matching menu items, table options, and restaurants."
      : "I couldn’t find an exact match, but I can still suggest food by healthy, price, rating, or area.";
    return {
      reply,
      foods: (wantsAll ? searchFoods : searchFoods.slice(0, 6)),
      tables: (wantsAll ? searchTables : searchTables.slice(0, 6)),
      restaurants: (wantsAll ? searchRestaurants : searchRestaurants.slice(0, 3)),
    };
  }

  return {
    reply,
    foods: resultFoods.slice(0, 6),
    tables: resultTables.slice(0, 6),
    restaurants: resultRestaurants.slice(0, 3),
  };
}

export default function AssistantChat({ onBookTable, onSearchMenu }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [datasets, setDatasets] = useState({
    branches: [],
    enrichedFoods: [],
    restaurantProfiles: [],
    restaurants: ["All"],
    tableTypes: ["All"],
    tables: [],
  });
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text:
        "Hi, I’m RestorantBooking AI. Ask me for healthy dishes, cheapest items, top-rated restaurants, area-wise options, or table availability.",
    },
  ]);
  const bottomRef = useRef(null);

  useEffect(() => {
    Promise.all([apiGet("/menu", ""), apiGet("/tables", ""), apiGet("/restaurants", "")])
      .then(([menuResponse, tableResponse, restaurantResponse]) => {
        const foods = menuResponse.map(normalizeMenuItem);
        const tableRows = tableResponse.map(normalizeTable);
        const profiles = restaurantResponse.map((restaurant) => {
          const normalized = normalizeRestaurant(restaurant);
          return {
            ...normalized,
            avgPrice:
              foods
                .filter((food) => food.restaurant === normalized.name)
                .reduce((sum, food, _index, items) => sum + food.price / Math.max(items.length, 1), 0) || 0,
          };
        });

        setDatasets({
          branches: uniqueValues([...foods, ...tableRows], (item) => item.location ?? item.city),
          enrichedFoods: foods,
          restaurantProfiles: profiles,
          restaurants: ["All", ...profiles.map((restaurant) => restaurant.name)],
          tableTypes: ["All", ...uniqueValues([...foods, ...tableRows], (item) => item.tableType ?? item.type)],
          tables: tableRows,
        });
      })
      .catch(() => {
        // The assistant stays usable; it will simply show no backend matches until the API is available.
      });
  }, []);

  const sendMessage = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const answer = buildResults(trimmed, datasets);
    const userMessage = { role: "user", text: trimmed };
    const assistantMessage = {
      role: "assistant",
      text: answer.reply,
      foods: answer.foods,
      tables: answer.tables,
      restaurants: answer.restaurants,
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setInput("");

    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  };

  const currentReply = messages[messages.length - 1]?.role === "assistant" ? messages[messages.length - 1] : null;
  const currentFoods = currentReply?.foods ?? [];
  const currentTables = currentReply?.tables ?? [];
  const currentRestaurants = currentReply?.restaurants ?? [];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-6 left-6 z-50 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0b1222]/90 px-4 py-3 text-sm font-semibold text-white shadow-2xl shadow-black/40 backdrop-blur transition hover:-translate-y-1 hover:bg-white/10"
      >
        <FaRobot />
        RestorantBooking AI
      </button>

      {open ? (
        <div className="fixed bottom-24 left-6 z-50 w-[min(92vw,440px)] overflow-hidden rounded-[2rem] border border-white/10 bg-[#060a14]/95 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-orange-200">
                <FaBrain />
                Smart menu and table guide
              </p>
              <p className="mt-1 text-xs text-slate-400">Healthy, cheap, rating, area, and search help</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 transition hover:bg-white/10"
            >
              <FaChevronDown />
            </button>
          </div>

          <div className="max-h-[56vh] space-y-4 overflow-y-auto px-5 py-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-3xl px-4 py-3 text-sm leading-7 ${
                  message.role === "assistant"
                    ? "border border-white/10 bg-white/5 text-slate-200"
                    : "ml-auto max-w-[90%] bg-gradient-to-r from-[#ff9f43] to-[#ff6b8b] text-slate-950"
                }`}
              >
                {message.text}
              </div>
            ))}

            {currentFoods?.length > 0 ? (
              <div className="grid gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-orange-200">
                  <FaUtensils />
                  Menu matches
                </div>
                {currentFoods.map((food) => (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => onSearchMenu?.(food)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{food.name}</p>
                        <p className="text-xs text-slate-400">
                          {food.restaurant} | {food.location} | {food.tableType}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-orange-200">Rs. {food.price}</div>
                        <div
                          className={`mt-1 inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${
                            food.available ? "bg-emerald-400/15 text-emerald-200" : "bg-rose-400/15 text-rose-200"
                          }`}
                        >
                          {food.available ? "Available" : "Not available"}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}

            {currentTables?.length > 0 ? (
              <div className="grid gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-orange-200">
                  <FaFilter />
                  Table matches
                </div>
                {currentTables.map((table) => (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => onBookTable?.(table)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">
                          {table.id} - {table.type}
                        </p>
                        <p className="text-xs text-slate-400">
                          {table.city} | {table.seats} seats
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-emerald-200">Rs. {table.price}</div>
                        <div className="mt-1 inline-flex rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-semibold text-emerald-200">
                          {table.status}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}

            {currentRestaurants?.length > 0 ? (
              <div className="grid gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-orange-200">
                  <FaStar />
                  Restaurant matches
                </div>
                {currentRestaurants.map((restaurant) => (
                  <div
                    key={restaurant.name}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{restaurant.name}</p>
                        <p className="text-xs text-slate-400">
                          {restaurant.cuisine} | {restaurant.location} | {restaurant.vibe}
                        </p>
                      </div>
                      <span className="rounded-full bg-amber-400/10 px-3 py-1 text-sm font-semibold text-amber-200">
                        {restaurant.rating}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div ref={bottomRef} />
          </div>

          <div className="border-t border-white/10 px-5 py-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 transition hover:bg-white/10"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    sendMessage(input);
                  }
                }}
                placeholder="Ask: healthy, cheap, rating, area wise, table in Bodakdev..."
                className="min-w-0 flex-1 rounded-full border border-white/10 bg-[#0b1222] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => sendMessage(input)}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#ff9f43] to-[#ff6b8b] px-4 py-3 text-sm font-semibold text-slate-950"
              >
                Ask
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
