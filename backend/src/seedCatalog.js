import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDatabase } from "./config/database.js";
import { Vendor } from "./vendor/models/Vendor.js";
import { Restaurant } from "./models/Restaurant.js";
import { MenuItem } from "./models/MenuItem.js";
import { Table } from "./models/Table.js";
import { fallbackMenuItems, fallbackRestaurants, fallbackTables } from "./utils/fallbackCatalog.js";
import { vendorSeedData } from "./utils/vendorSeedData.js";

dotenv.config();

function getRequiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required to seed launch credentials`);
  }
  return value;
}

function createVendorSeedPassword(index) {
  const prefix = getRequiredEnv("VENDOR_SEED_PASSWORD_PREFIX");
  return `${prefix}${String(index + 1).padStart(2, "0")}`;
}

function buildOwnerCredentialList() {
  return vendorSeedData.map((entry, index) => ({
    number: index + 1,
    restaurantName: entry.restaurant.name,
    ownerName: entry.ownerName,
    email: entry.email,
    password: createVendorSeedPassword(index),
  }));
}

function shouldShowSeededCredentials() {
  return process.env.SHOW_SEEDED_CREDENTIALS === "true";
}

async function upsertCatalog() {
  await connectDatabase();
  const restaurantByFallbackId = new Map();
  const vendorByRestaurantName = new Map();

  for (const [index, entry] of vendorSeedData.entries()) {
    const passwordHash = await bcrypt.hash(createVendorSeedPassword(index), 10);
    const vendor = await Vendor.findOneAndUpdate(
      { email: entry.email },
      {
        name: entry.ownerName,
        email: entry.email,
        phone: entry.phone,
        businessName: entry.businessName,
        passwordHash,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    vendorByRestaurantName.set(entry.restaurant.name, vendor);
  }

  for (const restaurant of fallbackRestaurants) {
    const vendor = vendorByRestaurantName.get(restaurant.name);
    const document = await Restaurant.findOneAndUpdate(
      { name: restaurant.name, location: restaurant.location },
      {
        vendorId: vendor?._id,
        name: restaurant.name,
        location: restaurant.location,
        cuisine: restaurant.cuisine,
        vibe: restaurant.vibe,
        rating: restaurant.rating,
        image: restaurant.image,
        description: restaurant.description,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    restaurantByFallbackId.set(restaurant._id, document);
  }

  for (const item of fallbackMenuItems) {
    const restaurant = restaurantByFallbackId.get(item.restaurantId?._id);
    if (!restaurant) continue;

    await MenuItem.findOneAndUpdate(
      { restaurantId: restaurant._id, name: item.name },
      {
        restaurantId: restaurant._id,
        name: item.name,
        category: item.category,
        location: item.location,
        price: item.price,
        available: item.available,
        tableType: item.tableType,
        image: item.image,
      },
      { upsert: true, setDefaultsOnInsert: true },
    );
  }

  for (const table of fallbackTables) {
    const restaurant = restaurantByFallbackId.get(table.restaurantId?._id);
    if (!restaurant) continue;

    await Table.findOneAndUpdate(
      { tableId: table.tableId },
      {
        restaurantId: restaurant._id,
        tableId: table.tableId,
        type: table.type,
        city: table.city,
        seats: table.seats,
        price: table.price,
        status: table.status,
      },
      { upsert: true, setDefaultsOnInsert: true },
    );
  }

  const counts = {
    vendors: await Vendor.countDocuments(),
    restaurants: await Restaurant.countDocuments(),
    menuItems: await MenuItem.countDocuments(),
    tables: await Table.countDocuments(),
  };

  console.log("Catalog upsert complete:", counts);
  if (shouldShowSeededCredentials()) {
    console.table(buildOwnerCredentialList());
  }
  await mongoose.disconnect();
}

upsertCatalog().catch((error) => {
  console.error("Catalog seed failed", error);
  process.exit(1);
});
