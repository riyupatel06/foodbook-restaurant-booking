import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { EventBooking } from "../models/EventBooking.js";
import { LoyaltyAccount } from "../models/LoyaltyAccount.js";
import { SpinCoupon } from "../models/SpinCoupon.js";
import { RecurringBooking } from "../models/RecurringBooking.js";
import { Booking } from "../models/Booking.js";
import { Restaurant } from "../models/Restaurant.js";
import { Table } from "../models/Table.js";
import { AdminDeal } from "../models/AdminDeal.js";
import { isDatabaseReady } from "../config/database.js";
import {
  computeRestaurantSlotInsights,
  createRecurringRecords,
  findAvailableTableAssignment,
  getCrowdLabel,
  syncTableStatusesForBooking,
} from "../utils/bookingEngine.js";
import { fallbackRestaurants, fallbackTables } from "../utils/fallbackCatalog.js";

const router = Router();

function buildCouponCode(prefix = "SPIN") {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

router.get("/loyalty", requireAuth, async (request, response, next) => {
  try {
    const account = (await LoyaltyAccount.findOne({ userId: request.user.id })) ?? (await LoyaltyAccount.create({ userId: request.user.id }));
    return response.json(account);
  } catch (error) {
    return next(error);
  }
});

router.post("/loyalty/redeem", requireAuth, async (request, response, next) => {
  try {
    const pointsToRedeem = Math.max(0, Number(request.body.points ?? 0));
    if (!pointsToRedeem) {
      return response.status(400).json({ message: "points must be greater than 0" });
    }

    const current = (await LoyaltyAccount.findOne({ userId: request.user.id })) ?? (await LoyaltyAccount.create({ userId: request.user.id }));
    if (current.points < pointsToRedeem) {
      return response.status(400).json({ message: "Not enough points to redeem" });
    }

    const account = await LoyaltyAccount.findOneAndUpdate(
      { userId: request.user.id },
      { $inc: { points: -pointsToRedeem } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return response.json(account);
  } catch (error) {
    return next(error);
  }
});

router.get("/spin", requireAuth, async (request, response, next) => {
  try {
    const coupons = await SpinCoupon.find({ userId: request.user.id }).sort({ createdAt: -1 });
    return response.json(coupons);
  } catch (error) {
    return next(error);
  }
});

router.post("/spin", requireAuth, async (request, response, next) => {
  try {
    const wins = [
      { title: "Free Dessert", discount: 15 },
      { title: "Flat 10% Off", discount: 10 },
      { title: "Happy Hours 20% Off", discount: 20 },
      { title: "Free Drinks", discount: 12 },
      { title: "Loyalty Boost", discount: 8 },
    ];
    const prize = wins[Math.floor(Math.random() * wins.length)];
    const coupon = await SpinCoupon.create({
      userId: request.user.id,
      code: buildCouponCode(),
      title: prize.title,
      discount: prize.discount,
      expiresAt: request.body.expiresAt ?? new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    });
    return response.status(201).json(coupon);
  } catch (error) {
    return next(error);
  }
});

router.get("/events", requireAuth, async (request, response, next) => {
  try {
    const events = await EventBooking.find({ userId: request.user.id }).sort({ createdAt: -1 });
    return response.json(events);
  } catch (error) {
    return next(error);
  }
});

router.post("/events", requireAuth, async (request, response, next) => {
  try {
    const restaurant = isDatabaseReady()
      ? await Restaurant.findById(request.body.restaurantId)
      : fallbackRestaurants.find((item) => item._id === request.body.restaurantId) ?? null;
    const event = await EventBooking.create({
      userId: request.user.id,
      restaurantId: request.body.restaurantId,
      eventType: request.body.eventType,
      eventName: request.body.eventName,
      guests: request.body.guests,
      date: request.body.date,
      time: request.body.time,
      tables: request.body.tables ?? [],
      combineTables: Boolean(request.body.combineTables),
      recurring: request.body.recurring ?? { frequency: "none" },
      notes: request.body.notes,
      status: "confirmed",
    });
    return response.status(201).json({ event, restaurant });
  } catch (error) {
    return next(error);
  }
});

router.get("/rebookings", requireAuth, async (request, response, next) => {
  try {
    const bookings = await Booking.find({ userId: request.user.id }).sort({ createdAt: -1 });
    return response.json(bookings);
  } catch (error) {
    return next(error);
  }
});

router.post("/rebookings/:id", requireAuth, async (request, response, next) => {
  try {
    const booking = await Booking.findOne({ _id: request.params.id, userId: request.user.id });
    if (!booking) return response.status(404).json({ message: "Booking not found" });
    const copy = await Booking.create({
      userId: request.user.id,
      restaurantId: booking.restaurantId,
      restaurantName: booking.restaurantName,
      city: booking.city,
      tableId: booking.tableId,
      tableType: booking.tableType,
      guests: booking.guests,
      date: request.body.date ?? booking.date,
      time: request.body.time ?? booking.time,
      slot: booking.slot,
      items: booking.items,
      status: "confirmed",
    });
    return response.status(201).json(copy);
  } catch (error) {
    return next(error);
  }
});

router.get("/booking-insights", async (request, response, next) => {
  try {
    if (!isDatabaseReady()) {
      const tables = fallbackTables.filter((table) => {
        if (request.query.restaurantId && table.restaurantId?._id !== request.query.restaurantId) return false;
        if (request.query.city && table.city !== request.query.city) return false;
        if (request.query.type && request.query.type !== "All" && table.type !== request.query.type) return false;
        return true;
      });

      if (request.query.restaurantId && request.query.date && request.query.time) {
        const insights = await computeRestaurantSlotInsights({
          restaurantId: request.query.restaurantId,
          date: request.query.date,
          time: request.query.time,
        });
        return response.json(insights);
      }

      const totalTables = tables.length;
      const occupiedTables = 0;
      const occupancyRate = 0;

      return response.json({
        tables,
        totalTables,
        occupiedTables,
        emptyTables: totalTables,
        occupancyRate,
        crowdLabel: getCrowdLabel(occupancyRate),
        lastMinuteDiscount: 0,
      });
    }

    const filter = {};
    if (request.query.restaurantId) filter.restaurantId = request.query.restaurantId;
    if (request.query.city) filter.city = request.query.city;
    if (request.query.type && request.query.type !== "All") filter.type = request.query.type;

    const tables = await Table.find(filter).populate("restaurantId", "name location cuisine vibe rating image").sort({ city: 1, type: 1, price: 1 });

    if (request.query.restaurantId && request.query.date && request.query.time) {
      const insights = await computeRestaurantSlotInsights({
        restaurantId: request.query.restaurantId,
        date: request.query.date,
        time: request.query.time,
      });
      return response.json(insights);
    }

    const totalTables = tables.length;
    const occupiedTables = tables.filter((table) => table.status === "booked" || table.status === "occupied").length;
    const occupancyRate = totalTables ? Math.round((occupiedTables / totalTables) * 100) : 0;

    return response.json({
      tables,
      totalTables,
      occupiedTables,
      emptyTables: Math.max(0, totalTables - occupiedTables),
      occupancyRate,
      crowdLabel: getCrowdLabel(occupancyRate),
      lastMinuteDiscount: 0,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/recurring", requireAuth, async (request, response, next) => {
  try {
    const recurring = await RecurringBooking.find({ userId: request.user.id }).sort({ createdAt: -1 });
    return response.json(recurring);
  } catch (error) {
    return next(error);
  }
});

router.post("/recurring", requireAuth, async (request, response, next) => {
  try {
    const booking = await Booking.findOne({ _id: request.body.bookingId, userId: String(request.user.id) });
    if (!booking) return response.status(404).json({ message: "Booking not found" });

    const groupId = request.body.groupId ?? booking.recurringGroupId ?? `REC-${Date.now()}`;
    const records = await createRecurringRecords({
      booking,
      frequency: request.body.frequency,
      endsOn: request.body.endsOn ?? request.body.nextRun,
      groupId,
    });
    return response.status(201).json(records);
  } catch (error) {
    return next(error);
  }
});

router.post("/split-table", requireAuth, async (request, response, next) => {
  try {
    const { restaurantId, tableIds = [], date, time, guests, city, tableType, notes } = request.body;
    if (!restaurantId || !Array.isArray(tableIds) || tableIds.length < 2) {
      return response.status(400).json({ message: "restaurantId and at least 2 tableIds are required" });
    }

    const restaurant = isDatabaseReady()
      ? await Restaurant.findById(restaurantId)
      : fallbackRestaurants.find((item) => item._id === restaurantId) ?? null;
    if (!restaurant) {
      return response.status(404).json({ message: "Restaurant not found" });
    }

    const tables = isDatabaseReady()
      ? await Table.find({ _id: { $in: tableIds }, restaurantId })
      : fallbackTables.filter((table) => String(table.restaurantId?._id) === String(restaurantId) && tableIds.includes(table._id));
    if (tables.length !== tableIds.length && isDatabaseReady()) {
      return response.status(404).json({ message: "One or more tables were not found" });
    }

    const assignment = await findAvailableTableAssignment({
      restaurantId,
      date,
      time,
      guests,
      preferredTableIds: tables.map((table) => table.tableId),
      preferredType: tableType,
      combineTables: true,
    });
    if (!assignment) {
      return response.status(409).json({ message: "Selected tables are not available for this slot" });
    }

    const booking = await Booking.create({
      userId: String(request.user.id),
      restaurantId,
      restaurantName: restaurant.name,
      city: city ?? restaurant.location,
      tableId: assignment.tableId,
      tableType: assignment.tableType,
      splitTableBooking: true,
      linkedTableIds: assignment.assignedTables,
      assignedTables: assignment.assignedTables,
      guests,
      date,
      time,
      notes,
      status: "confirmed",
    });
    await syncTableStatusesForBooking(booking, booking.status);

    return response.status(201).json({
      booking,
      tables,
      restaurant,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/qr-checkin", requireAuth, async (request, response, next) => {
  try {
    const { bookingId, qrCode } = request.body;
    if (!bookingId && !qrCode) {
      return response.status(400).json({ message: "bookingId or qrCode is required" });
    }

    const query = { userId: request.user.id };
    if (bookingId) query._id = bookingId;
    if (qrCode) query.qrCode = qrCode;

    const booking = await Booking.findOne(query);
    if (!booking) {
      return response.status(404).json({ message: "Booking not found" });
    }

    booking.checkInStatus = "verified";
    booking.status = "checked_in";
    if (!booking.qrCode) {
      booking.qrCode = qrCode ?? `QR-${booking._id}`;
    }
    await booking.save();
    await syncTableStatusesForBooking(booking, booking.status);

    return response.json({
      message: "Check-in verified",
      booking,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/last-minute-deals", async (_request, response, next) => {
  try {
    const restaurants = isDatabaseReady()
      ? await Restaurant.find().sort({ name: 1 })
      : [...fallbackRestaurants].sort((a, b) => a.name.localeCompare(b.name));
    const today = new Date().toISOString().slice(0, 10);
    const deals = [];

    for (const restaurant of restaurants) {
      const slots = ["10:00", "13:00", "20:00"];
      for (const slotTime of slots) {
        const insights = await computeRestaurantSlotInsights({
          restaurantId: restaurant._id,
          date: today,
          time: slotTime,
        });
        if (insights.lastMinuteDiscount > 0) {
          deals.push({
            restaurantId: restaurant._id,
            restaurantName: restaurant.name,
            location: restaurant.location,
            time: slotTime,
            discount: insights.lastMinuteDiscount,
            emptyTables: insights.emptyTables,
            occupancyRate: insights.occupancyRate,
            crowdLabel: insights.crowdLabel,
          });
        }
      }
    }

    return response.json(deals);
  } catch (error) {
    return next(error);
  }
});

router.get("/deals", async (_request, response, next) => {
  try {
    const deals = await AdminDeal.find({ audience: "user", isActive: true }).sort({ createdAt: -1 });
    return response.json(deals);
  } catch (error) {
    return next(error);
  }
});

router.get("/summary", requireAuth, async (request, response, next) => {
  try {
    const [events, coupons, recurring, account] = await Promise.all([
      EventBooking.find({ userId: request.user.id }),
      SpinCoupon.find({ userId: request.user.id }),
      RecurringBooking.find({ userId: request.user.id }),
      LoyaltyAccount.findOne({ userId: request.user.id }),
    ]);

    return response.json({
      events,
      coupons,
      recurring,
      loyalty: account ?? { points: 0, tier: "Bronze" },
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
