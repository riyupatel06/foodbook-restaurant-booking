import { Router } from "express";
import { Restaurant } from "../models/Restaurant.js";
import { isDatabaseReady } from "../config/database.js";
import { fallbackRestaurants } from "../utils/fallbackCatalog.js";

const router = Router();

router.get("/", async (_request, response, next) => {
  try {
    if (!isDatabaseReady()) {
      return response.json([...fallbackRestaurants].sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name)));
    }

    const restaurants = await Restaurant.find().sort({ rating: -1, name: 1 });
    return response.json(restaurants);
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (request, response, next) => {
  try {
    if (!isDatabaseReady()) {
      const restaurant = fallbackRestaurants.find((item) => item._id === request.params.id);
      if (!restaurant) {
        return response.status(404).json({ message: "Restaurant not found" });
      }

      return response.json(restaurant);
    }

    const restaurant = await Restaurant.findById(request.params.id);
    if (restaurant) {
      return response.json(restaurant);
    }
    return response.status(404).json({ message: "Restaurant not found" });
  } catch (error) {
    return next(error);
  }
});

export default router;
