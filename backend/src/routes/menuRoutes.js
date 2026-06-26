import { Router } from "express";
import { MenuItem } from "../models/MenuItem.js";
import { isDatabaseReady } from "../config/database.js";
import { fallbackMenuItems, filterFallback } from "../utils/fallbackCatalog.js";

const router = Router();

router.get("/", async (request, response, next) => {
  try {
    if (!isDatabaseReady()) {
      const items = filterFallback(fallbackMenuItems, request.query, {
        location: "location",
      }).filter((item) => {
        if (!request.query.restaurantId) return true;
        return item.restaurantId?._id === request.query.restaurantId;
      });

      return response.json(items.sort((a, b) => a.category.localeCompare(b.category) || a.price - b.price));
    }

    const filter = {};
    if (request.query.restaurantId) filter.restaurantId = request.query.restaurantId;
    if (request.query.location) filter.location = request.query.location;
    const items = await MenuItem.find(filter).populate("restaurantId", "name location cuisine vibe rating image isActive").sort({ category: 1, price: 1 });
    if (items.length === 0) {
      const fallbackItems = filterFallback(fallbackMenuItems, request.query, {
        location: "location",
      }).filter((item) => {
        if (!request.query.restaurantId) return true;
        return item.restaurantId?._id === request.query.restaurantId;
      });

      return response.json(fallbackItems.sort((a, b) => a.category.localeCompare(b.category) || a.price - b.price));
    }

    return response.json(items);
  } catch (error) {
    return next(error);
  }
});

export default router;
