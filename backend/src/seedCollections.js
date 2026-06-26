import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDatabase } from "./config/database.js";
import { User } from "./models/User.js";
import { Restaurant } from "./models/Restaurant.js";
import { MenuItem } from "./models/MenuItem.js";
import { Table } from "./models/Table.js";

dotenv.config();

const restaurants = [
  {
    name: "Spice Garden",
    location: "Thaltej",
    cuisine: "Indian",
    vibe: "Fine Dining",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80",
    description: "Premium multi-cuisine restaurant serving rich Indian flavors.",
  },
  {
    name: "Italian House",
    location: "Sindhu Bhavan",
    cuisine: "Italian",
    vibe: "Romantic",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1600&q=80",
    description: "Romantic Italian dining with handcrafted pasta and wood-fired pizzas.",
  },
  {
    name: "Burger Factory",
    location: "S.G. Highway",
    cuisine: "Fast Food",
    vibe: "Casual",
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1600&q=80",
    description: "A lively casual spot for gourmet burgers and loaded sides.",
  },
  {
    name: "Royal Punjabi",
    location: "Prahlad Nagar",
    cuisine: "Punjabi",
    vibe: "Family Friendly",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80",
    description: "Punjabi comfort food and warm family dining.",
  },
  {
    name: "Sushi Bloom",
    location: "Bodakdev",
    cuisine: "Japanese",
    vibe: "Minimal",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1600&q=80",
    description: "Minimal Japanese dining with sushi, ramen, and premium plating.",
  },
  {
    name: "Coastal Oven",
    location: "Vastrapur",
    cuisine: "Seafood",
    vibe: "Luxury",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1600&q=80",
    description: "Luxury seafood dining with refined ambiance and fresh catch.",
  },
];

const menuItems = [
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
];

const tables = [
  { restaurantName: "Spice Garden", tableId: "SG-I1", type: "Indoor", city: "Thaltej", seats: 2, price: 400, status: "available" },
  { restaurantName: "Spice Garden", tableId: "SG-F1", type: "Family", city: "Thaltej", seats: 6, price: 550, status: "available" },
  { restaurantName: "Italian House", tableId: "IH-P1", type: "Private", city: "Sindhu Bhavan", seats: 4, price: 650, status: "available" },
  { restaurantName: "Italian House", tableId: "IH-R1", type: "Rooftop", city: "Sindhu Bhavan", seats: 4, price: 700, status: "available" },
  { restaurantName: "Burger Factory", tableId: "BF-I1", type: "Indoor", city: "S.G. Highway", seats: 2, price: 250, status: "available" },
  { restaurantName: "Royal Punjabi", tableId: "RP-F1", type: "Family", city: "Prahlad Nagar", seats: 6, price: 500, status: "available" },
  { restaurantName: "Sushi Bloom", tableId: "SB-V1", type: "VIP", city: "Bodakdev", seats: 4, price: 900, status: "available" },
  { restaurantName: "Coastal Oven", tableId: "CO-L1", type: "Indoor", city: "Vastrapur", seats: 4, price: 800, status: "available" },
];

async function ensureCollections() {
  const names = [
    "users",
    "restaurants",
    "menuitems",
    "tables",
    "bookings",
    "payments",
    "invoices",
    "feedback",
    "notifications",
    "ailogs",
  ];

  await Promise.all(
    names.map(async (name) => {
      try {
        await mongoose.connection.createCollection(name);
      } catch {
        // Collection already exists.
      }
    }),
  );
}

async function run() {
  await connectDatabase();
  await ensureCollections();

  await Promise.all([
    User.deleteMany({}),
    Restaurant.deleteMany({}),
    MenuItem.deleteMany({}),
    Table.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash("Riya2005", 10);
  await User.create({
    name: "Riya Patel",
    email: "riya@gmail.com",
    phone: "9876543210",
    passwordHash,
    role: "user",
  });

  const restaurantDocs = await Restaurant.insertMany(restaurants);
  const restaurantByName = new Map(restaurantDocs.map((restaurant) => [restaurant.name, restaurant]));

  await MenuItem.insertMany(
    menuItems.map((item) => ({
      restaurantId: restaurantByName.get(item.restaurantName)._id,
      name: item.name,
      category: item.category,
      location: item.location,
      price: item.price,
      available: item.available,
      tableType: item.tableType,
      image: "",
    })),
  );

  await Table.insertMany(
    tables.map((table) => ({
      restaurantId: restaurantByName.get(table.restaurantName)._id,
      tableId: table.tableId,
      type: table.type,
      city: table.city,
      seats: table.seats,
      price: table.price,
      status: table.status,
    })),
  );

  console.log("Seeded Atlas collections:");
  console.log(["users", "restaurants", "menuitems", "tables", "bookings", "payments", "invoices", "feedback", "notifications", "ailogs"].join(", "));

  await mongoose.disconnect();
}

run().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});