const fallbackImage =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80";

export function normalizeRestaurant(restaurant) {
  return {
    id: restaurant._id ?? restaurant.id,
    name: restaurant.name ?? "Restaurant",
    cuisine: restaurant.cuisine ?? "Multi Cuisine",
    rating: Number(restaurant.rating ?? 0),
    location: restaurant.location ?? "Ahmedabad",
    vibe: restaurant.vibe ?? "Dining",
    image: restaurant.image || fallbackImage,
    description: restaurant.description ?? "A RestorantBooking restaurant ready for online table booking.",
    isActive: restaurant.isActive !== false,
  };
}

export function normalizeMenuItem(item) {
  const restaurant = item.restaurantId && typeof item.restaurantId === "object" ? item.restaurantId : null;

  return {
    id: item._id ?? item.id,
    name: item.name ?? "Menu item",
    category: item.category ?? "Main Course",
    location: item.location ?? restaurant?.location ?? "Ahmedabad",
    price: Number(item.price ?? 0),
    available: item.available !== false,
    image: item.image || restaurant?.image || fallbackImage,
    tableType: item.tableType ?? "Indoor",
    restaurant: restaurant?.name ?? item.restaurantName ?? "RestorantBooking Kitchen",
    restaurantId: restaurant?._id ?? item.restaurantId,
    restaurantProfile: restaurant ? normalizeRestaurant(restaurant) : null,
  };
}

export function normalizeTable(table) {
  const restaurant = table.restaurantId && typeof table.restaurantId === "object" ? table.restaurantId : null;

  return {
    id: table.tableId ?? table.id ?? table._id,
    mongoId: table._id,
    type: table.type ?? "Indoor",
    city: table.city ?? restaurant?.location ?? "Ahmedabad",
    seats: Number(table.seats ?? 2),
    price: Number(table.price ?? 0),
    status: table.status ?? "available",
    restaurant: restaurant?.name ?? table.restaurantName ?? "RestorantBooking Kitchen",
    restaurantId: restaurant?._id ?? table.restaurantId,
    restaurantProfile: restaurant ? normalizeRestaurant(restaurant) : null,
  };
}

export function uniqueValues(items, selector, fallback = []) {
  const values = [...new Set(items.map(selector).filter(Boolean))];
  return values.length > 0 ? values : fallback;
}
