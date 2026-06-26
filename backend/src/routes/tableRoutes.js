import { Router } from "express";
import { Booking } from "../models/Booking.js";
import { Table } from "../models/Table.js";
import { isDatabaseReady } from "../config/database.js";
import { fallbackTables } from "../utils/fallbackCatalog.js";
import { ACTIVE_BOOKING_STATUSES, computeRestaurantSlotInsights, extractAssignedTableIds } from "../utils/bookingEngine.js";

const router = Router();

router.get("/", async (request, response, next) => {
  try {
    if (!isDatabaseReady()) {
      const tables = fallbackTables.filter((table) => {
        if (request.query.restaurantId && table.restaurantId?._id !== request.query.restaurantId) return false;
        if (request.query.city && table.city !== request.query.city) return false;
        if (request.query.type && table.type !== request.query.type) return false;
        return true;
      });

      return response.json(tables.sort((a, b) => a.city.localeCompare(b.city) || a.type.localeCompare(b.type) || a.price - b.price));
    }

    const filter = {};
    if (request.query.restaurantId) filter.restaurantId = request.query.restaurantId;
    if (request.query.city) filter.city = request.query.city;
    if (request.query.type) filter.type = request.query.type;
    const tables = await Table.find(filter).populate("restaurantId", "name location cuisine vibe rating image isActive").sort({ city: 1, type: 1, price: 1 });
    if (tables.length === 0) {
      const fallbackRows = fallbackTables.filter((table) => {
        if (request.query.restaurantId && table.restaurantId?._id !== request.query.restaurantId) return false;
        if (request.query.city && table.city !== request.query.city) return false;
        if (request.query.type && table.type !== request.query.type) return false;
        return true;
      });

      return response.json(fallbackRows.sort((a, b) => a.city.localeCompare(b.city) || a.type.localeCompare(b.type) || a.price - b.price));
    }

    if (!request.query.date || !request.query.time) {
      return response.json(tables);
    }

    const bookings = await Booking.find({
      ...(request.query.restaurantId ? { restaurantId: request.query.restaurantId } : {}),
      date: request.query.date,
      time: request.query.time,
      status: { $in: ACTIVE_BOOKING_STATUSES },
    });
    const statusMap = new Map();
    bookings.forEach((booking) => {
      const tableStatus = booking.status === "checked_in" ? "occupied" : "booked";
      extractAssignedTableIds(booking).forEach((tableId) => {
        if (statusMap.get(tableId) !== "occupied") {
          statusMap.set(tableId, tableStatus);
        }
      });
    });

    return response.json(
      tables.map((table) => ({
        ...table.toObject(),
        status: statusMap.get(table.tableId) || table.status,
      })),
    );
  } catch (error) {
    return next(error);
  }
});

router.get("/insights", async (request, response, next) => {
  try {
    if (!request.query.restaurantId || !request.query.date || !request.query.time) {
      return response.status(400).json({ message: "restaurantId, date, and time are required" });
    }

    const insights = await computeRestaurantSlotInsights({
      restaurantId: request.query.restaurantId,
      date: request.query.date,
      time: request.query.time,
    });
    return response.json(insights);
  } catch (error) {
    return next(error);
  }
});

export default router;
