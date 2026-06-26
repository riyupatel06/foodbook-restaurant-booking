import { restaurantSeed } from "./vendorSeedData.js";

export const fallbackRestaurants = restaurantSeed.map((restaurant, index) => ({
  _id: `fallback-restaurant-${index + 1}`,
  ...restaurant,
}));

const byName = new Map(fallbackRestaurants.map((restaurant) => [restaurant.name, restaurant]));

export const fallbackMenuItems = [
  { restaurantName: "Spice Garden", name: "Paneer Tikka", category: "Starter", location: "Thaltej", price: 249, available: true, tableType: "Couple" },
  { restaurantName: "Spice Garden", name: "Veg Biryani", category: "Main Course", location: "Thaltej", price: 299, available: true, tableType: "Family" },
  { restaurantName: "Spice Garden", name: "Masala Peanuts", category: "Starter", location: "Thaltej", price: 179, available: true, tableType: "Couple" },
  { restaurantName: "Italian House", name: "Margherita Pizza", category: "Italian", location: "Sindhu Bhavan", price: 399, available: true, tableType: "Private" },
  { restaurantName: "Italian House", name: "Penne Alfredo", category: "Italian", location: "Sindhu Bhavan", price: 429, available: true, tableType: "Private" },
  { restaurantName: "Burger Factory", name: "Loaded Fries", category: "Starter", location: "S.G. Highway", price: 219, available: true, tableType: "Indoor" },
  { restaurantName: "Burger Factory", name: "Veg Wrap Combo", category: "Main Course", location: "S.G. Highway", price: 289, available: true, tableType: "Indoor" },
  { restaurantName: "Royal Punjabi", name: "Sarson Ka Saag", category: "Main Course", location: "Prahlad Nagar", price: 349, available: true, tableType: "Family" },
  { restaurantName: "Royal Punjabi", name: "Lassi Delight", category: "Dessert", location: "Prahlad Nagar", price: 159, available: true, tableType: "Family" },
  { restaurantName: "Sushi Bloom", name: "Sushi Platter", category: "Main Course", location: "Bodakdev", price: 499, available: true, tableType: "VIP" },
  { restaurantName: "Sushi Bloom", name: "Miso Soup", category: "Starter", location: "Bodakdev", price: 189, available: true, tableType: "VIP" },
  { restaurantName: "Coastal Oven", name: "Grilled Fish Steak", category: "Main Course", location: "Vastrapur", price: 549, available: true, tableType: "Luxury" },
  { restaurantName: "Coastal Oven", name: "Caramel Pudding", category: "Dessert", location: "Vastrapur", price: 189, available: true, tableType: "Luxury" },
  { restaurantName: "Tandoor Terrace", name: "Smoked Paneer Skewers", category: "Starter", location: "Satellite", price: 329, available: true, tableType: "Rooftop" },
  { restaurantName: "Tandoor Terrace", name: "Dal Bukhara", category: "Main Course", location: "Satellite", price: 359, available: true, tableType: "Family" },
  { restaurantName: "Green Leaf Bistro", name: "Pesto Cottage Bowl", category: "Main Course", location: "Navrangpura", price: 289, available: true, tableType: "Garden" },
  { restaurantName: "Green Leaf Bistro", name: "Herb Lemonade", category: "Beverage", location: "Navrangpura", price: 129, available: true, tableType: "Garden" },
  { restaurantName: "Urban Curry Lab", name: "Butter Tofu Bao", category: "Fusion", location: "Science City", price: 319, available: true, tableType: "Indoor" },
  { restaurantName: "Urban Curry Lab", name: "Gunpowder Fries", category: "Starter", location: "Science City", price: 199, available: true, tableType: "Indoor" },
  { restaurantName: "Skyline BBQ House", name: "BBQ Platter", category: "Main Course", location: "Gota", price: 599, available: true, tableType: "Family" },
  { restaurantName: "Skyline BBQ House", name: "Charcoal Corn", category: "Starter", location: "Gota", price: 179, available: true, tableType: "Outdoor" },
].map((item, index) => {
  const restaurant = byName.get(item.restaurantName);

  return {
    _id: `fallback-menu-${index + 1}`,
    restaurantId: restaurant,
    name: item.name,
    category: item.category,
    location: item.location,
    price: item.price,
    available: item.available,
    tableType: item.tableType,
    image: restaurant?.image ?? "",
  };
});

export const fallbackTables = [
  { restaurantName: "Spice Garden", tableId: "SG-I1", type: "Indoor", city: "Thaltej", seats: 2, price: 400, status: "available" },
  { restaurantName: "Spice Garden", tableId: "SG-F1", type: "Family", city: "Thaltej", seats: 6, price: 550, status: "available" },
  { restaurantName: "Italian House", tableId: "IH-P1", type: "Private", city: "Sindhu Bhavan", seats: 4, price: 650, status: "available" },
  { restaurantName: "Italian House", tableId: "IH-R1", type: "Rooftop", city: "Sindhu Bhavan", seats: 4, price: 700, status: "available" },
  { restaurantName: "Burger Factory", tableId: "BF-I1", type: "Indoor", city: "S.G. Highway", seats: 2, price: 250, status: "available" },
  { restaurantName: "Royal Punjabi", tableId: "RP-F1", type: "Family", city: "Prahlad Nagar", seats: 6, price: 500, status: "available" },
  { restaurantName: "Sushi Bloom", tableId: "SB-V1", type: "VIP", city: "Bodakdev", seats: 4, price: 900, status: "available" },
  { restaurantName: "Coastal Oven", tableId: "CO-L1", type: "Indoor", city: "Vastrapur", seats: 4, price: 800, status: "available" },
  { restaurantName: "Tandoor Terrace", tableId: "TT-R1", type: "Rooftop", city: "Satellite", seats: 4, price: 650, status: "available" },
  { restaurantName: "Green Leaf Bistro", tableId: "GL-G1", type: "Garden", city: "Navrangpura", seats: 2, price: 300, status: "available" },
  { restaurantName: "Urban Curry Lab", tableId: "UC-M1", type: "Modern", city: "Science City", seats: 4, price: 450, status: "available" },
  { restaurantName: "Skyline BBQ House", tableId: "SBQ-F1", type: "Family", city: "Gota", seats: 6, price: 550, status: "available" },
].map((table, index) => ({
  _id: `fallback-table-${index + 1}`,
  restaurantId: byName.get(table.restaurantName),
  tableId: table.tableId,
  type: table.type,
  city: table.city,
  seats: table.seats,
  price: table.price,
  status: table.status,
}));

export function filterFallback(items, query, fieldMap = {}) {
  return items.filter((item) =>
    Object.entries(fieldMap).every(([queryName, itemField]) => {
      if (!query[queryName]) return true;
      return String(item[itemField]) === String(query[queryName]);
    }),
  );
}
