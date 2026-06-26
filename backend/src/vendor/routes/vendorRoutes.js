import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { OAuth2Client } from "google-auth-library";
import { Vendor } from "../models/Vendor.js";
import { Restaurant } from "../../models/Restaurant.js";
import { MenuItem } from "../../models/MenuItem.js";
import { Table } from "../../models/Table.js";
import { Booking } from "../../models/Booking.js";
import { Payment } from "../../models/Payment.js";
import { Feedback } from "../../models/Feedback.js";
import { Offer } from "../models/Offer.js";
import { Waitlist } from "../models/Waitlist.js";
import { Notification } from "../../models/Notification.js";
import { AdminDeal } from "../../models/AdminDeal.js";
import { isDatabaseReady } from "../../config/database.js";
import { requireVendorAuth } from "../middlewares/vendorAuth.js";
import { promoteNextWaitlist, syncTableStatusesForBooking } from "../../utils/bookingEngine.js";
import { createMemoryVendor, findMemoryVendorByEmail, findMemoryVendorById, updateMemoryVendor } from "../../utils/memoryStore.js";

const router = Router();
const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;
const vendorPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@])[A-Za-z\d@#$%^&*()_+\-=[\]{};':"\\|,.<>/?!~`]{8,}$/;
const vendorPhonePattern = /^[1-9]\d{9}$/;
const bookingStatusValues = ["pending", "confirmed", "waitlist", "cancelled", "checked_in", "completed"];
const checkInStatusValues = ["pending", "verified", "assigned"];
const tableStatusValues = ["available", "booked", "reserved", "occupied", "maintenance"];
const bookingSlotValues = ["morning", "lunch", "dinner"];
const waitlistStatusValues = ["waiting", "notified", "seated", "cancelled"];

function validateRequest(request, response) {
  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    response.status(400).json({ errors: errors.array() });
    return false;
  }
  return true;
}

const restaurantValidators = [
  body("name").optional().trim().notEmpty().withMessage("Restaurant name is required"),
  body("location").optional().trim().notEmpty().withMessage("Restaurant location is required"),
  body("cuisine").optional().trim().notEmpty().withMessage("Cuisine is required"),
  body("rating").optional().isFloat({ min: 0, max: 5 }).withMessage("Rating must be between 0 and 5"),
  body("description").optional().isString(),
  body("branchCode").optional().isString(),
  body("isActive").optional().isBoolean().withMessage("isActive must be boolean"),
];

const menuValidators = [
  body("restaurantId").optional().notEmpty().withMessage("restaurantId is required"),
  body("name").optional().trim().notEmpty().withMessage("Dish name is required"),
  body("category").optional().trim().notEmpty().withMessage("Category is required"),
  body("price").optional().isFloat({ gt: 0 }).withMessage("Price must be greater than 0"),
  body("available").optional().isBoolean().withMessage("available must be boolean"),
  body("isVeg").optional().isBoolean().withMessage("isVeg must be boolean"),
  body("isCombo").optional().isBoolean().withMessage("isCombo must be boolean"),
  body("isFestival").optional().isBoolean().withMessage("isFestival must be boolean"),
  body("isTodaySpecial").optional().isBoolean().withMessage("isTodaySpecial must be boolean"),
];

const tableValidators = [
  body("restaurantId").optional().notEmpty().withMessage("restaurantId is required"),
  body("tableId").optional().trim().notEmpty().withMessage("tableId is required"),
  body("type").optional().trim().notEmpty().withMessage("type is required"),
  body("city").optional().trim().notEmpty().withMessage("city is required"),
  body("seats").optional().isInt({ min: 1 }).withMessage("seats must be at least 1"),
  body("price").optional().isFloat({ min: 0 }).withMessage("price must be 0 or greater"),
  body("status").optional().isIn(tableStatusValues).withMessage("Invalid table status"),
  body("layout").optional().isObject().withMessage("layout must be an object"),
  body("layout.x").optional().isFloat({ min: 0, max: 100 }).withMessage("layout x must be between 0 and 100"),
  body("layout.y").optional().isFloat({ min: 0, max: 100 }).withMessage("layout y must be between 0 and 100"),
];

const offerValidators = [
  body("restaurantId").optional().notEmpty().withMessage("restaurantId is required"),
  body("code").optional().trim().notEmpty().withMessage("Offer code is required"),
  body("discount").optional().isFloat({ gt: 0, lte: 100 }).withMessage("discount must be between 0 and 100"),
  body("minOrder").optional().isFloat({ min: 0 }).withMessage("minOrder must be 0 or greater"),
  body("validUntil").optional().isISO8601().withMessage("validUntil must be a valid date"),
  body("isActive").optional().isBoolean().withMessage("isActive must be boolean"),
];

const waitlistValidators = [
  body("restaurantId").optional().notEmpty().withMessage("restaurantId is required"),
  body("name").optional().trim().notEmpty().withMessage("Customer name is required"),
  body("phone").optional().matches(vendorPhonePattern).withMessage("Phone number must be exactly 10 digits and cannot start with 0"),
  body("email").optional({ checkFalsy: true }).isEmail().withMessage("email must be valid"),
  body("guests").optional().isInt({ min: 1 }).withMessage("guests must be at least 1"),
  body("position").optional().isInt({ min: 1 }).withMessage("position must be at least 1"),
  body("date").optional().isISO8601().withMessage("date must be valid"),
  body("time").optional().trim().notEmpty().withMessage("time is required"),
  body("slot").optional().isIn(bookingSlotValues).withMessage("Invalid slot"),
  body("tableType").optional().trim().notEmpty().withMessage("tableType cannot be empty"),
  body("estimatedWait").optional().trim().notEmpty().withMessage("estimatedWait cannot be empty"),
  body("status").optional().isIn(waitlistStatusValues).withMessage("Invalid waitlist status"),
];

const bookingStatusValidators = [
  body("status").isIn(bookingStatusValues).withMessage("Invalid booking status"),
  body("time").optional().trim().notEmpty().withMessage("time cannot be empty"),
  body("slot").optional().isIn(bookingSlotValues).withMessage("Invalid slot"),
];

const bookingUpdateValidators = [
  body("status").optional().isIn(bookingStatusValues).withMessage("Invalid booking status"),
  body("checkInStatus").optional().isIn(checkInStatusValues).withMessage("Invalid check-in status"),
  body("date").optional().isISO8601().withMessage("date must be valid"),
  body("time").optional().trim().notEmpty().withMessage("time cannot be empty"),
  body("guests").optional().notEmpty().withMessage("guests cannot be empty"),
];

const notificationValidators = [
  body("message").trim().notEmpty().withMessage("message is required"),
  body("bookingId").optional().notEmpty(),
  body("channels").optional().isArray({ min: 1 }).withMessage("channels must be a non-empty array"),
];

async function getVendorRestaurantIds(vendorId) {
  const restaurants = await Restaurant.find({ vendorId }).sort({ createdAt: -1 });
  return { restaurants, restaurantIds: restaurants.map((restaurant) => restaurant._id) };
}

async function findVendorFromRequest(request) {
  if (!isDatabaseReady()) {
    const memoryVendor = findMemoryVendorById(request.vendor.id) ?? findMemoryVendorByEmail(request.vendor.email ?? "");
    if (memoryVendor) return memoryVendor;

    if (request.vendor?.id) {
      const mockedVendor = await Vendor.findById(request.vendor.id).catch(() => null);
      if (mockedVendor) return mockedVendor;
    }

    return {
      _id: request.vendor.id,
      name: request.vendor.name ?? "Vendor",
      email: request.vendor.email ?? "",
      businessName: request.vendor.businessName ?? "Vendor",
      phone: request.vendor.phone ?? "",
      logo: request.vendor.logo ?? "",
      role: "vendor",
    };
  }

  if (request.vendor?.id) {
    const vendorById = await Vendor.findById(request.vendor.id).catch(() => null);
    if (vendorById) return vendorById;
  }

  if (request.vendor?.email) {
    return Vendor.findOne({ email: String(request.vendor.email).toLowerCase().trim() });
  }

  return null;
}

async function getNextWaitlistPosition({ restaurantId, date, time }) {
  const lastEntry = await Waitlist.findOne({
    restaurantId,
    date,
    time,
    status: { $in: ["waiting", "notified"] },
  })
    .sort({ position: -1 })
    .select("position")
    .lean();

  return Number(lastEntry?.position ?? 0) + 1;
}

function buildVendorBookingQuery({ bookingId, restaurants, restaurantIds }) {
  const restaurantNames = restaurants.map((restaurant) => restaurant.name).filter(Boolean);
  return {
    _id: bookingId,
    ...(restaurantIds.length
      ? {
          $or: [
            { restaurantId: { $in: restaurantIds } },
            { restaurantName: { $in: restaurantNames } },
          ],
        }
      : {}),
  };
}

function emptyVendorDashboard(period = "monthly") {
  return {
    summary: {
      totalRestaurants: 0,
      todaysBookings: 0,
      upcomingBookings: 0,
      totalRevenue: 0,
      totalCustomers: 0,
      pendingBookings: 0,
      availableTables: 0,
      occupancyRate: 0,
    },
    restaurants: [],
    menuItems: [],
    tables: [],
    bookings: [],
    payments: [],
    feedback: [],
    offers: [],
    waitlist: [],
    charts: {
      period,
      labels: [],
      revenue: [],
      bookings: [],
      popularDishes: [],
      peakHours: [],
      customerGrowth: [],
      restaurantPerformance: [],
      statusBreakdown: [],
    },
  };
}

function createVendorToken(vendor) {
  return jwt.sign(
    { id: vendor._id, name: vendor.name, email: vendor.email, businessName: vendor.businessName, role: "vendor" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
}

function publicVendor(vendor) {
  return {
    id: vendor._id,
    name: vendor.name,
    email: vendor.email,
    phone: vendor.phone,
    businessName: vendor.businessName,
    logo: vendor.logo ?? "",
  };
}

function getStartOfWeek(dateValue) {
  const date = new Date(dateValue);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function buildRevenueSeries(payments, period = "monthly") {
  const now = new Date();
  const buckets = [];

  if (period === "daily") {
    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date(now);
      date.setDate(now.getDate() - index);
      const key = date.toISOString().slice(0, 10);
      buckets.push({ key, label: key.slice(5), total: 0, bookings: 0 });
    }
  } else if (period === "weekly") {
    for (let index = 5; index >= 0; index -= 1) {
      const date = new Date(now);
      date.setDate(now.getDate() - index * 7);
      const weekStart = getStartOfWeek(date);
      const key = weekStart.toISOString().slice(0, 10);
      buckets.push({ key, label: `Wk ${6 - index}`, total: 0, bookings: 0 });
    }
  } else {
    for (let index = 5; index >= 0; index -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      buckets.push({ key, label: date.toLocaleString("en-US", { month: "short" }), total: 0, bookings: 0 });
    }
  }

  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  payments.forEach((payment) => {
    const createdAt = new Date(payment.createdAt ?? Date.now());
    const key =
      period === "daily"
        ? createdAt.toISOString().slice(0, 10)
        : period === "weekly"
          ? getStartOfWeek(createdAt).toISOString().slice(0, 10)
          : `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`;
    const bucket = bucketMap.get(key);
    if (bucket) {
      bucket.total += Number(payment.amount ?? 0);
      bucket.bookings += 1;
    }
  });

  return buckets;
}

function getSeriesKey(dateValue, period) {
  const date = new Date(dateValue ?? Date.now());
  if (period === "daily") return date.toISOString().slice(0, 10);
  if (period === "weekly") return getStartOfWeek(date).toISOString().slice(0, 10);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildBookingSeries(bookings, baseBuckets, period = "monthly") {
  const buckets = baseBuckets.map((bucket) => ({ ...bucket, total: 0, bookings: 0 }));
  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  bookings.forEach((booking) => {
    const key = getSeriesKey(booking.createdAt, period);
    const bucket = bucketMap.get(key);
    if (bucket) {
      bucket.bookings += 1;
      bucket.total += 1;
    }
  });

  return buckets;
}

function buildPopularDishes(bookings) {
  const dishMap = new Map();

  bookings.forEach((booking) => {
    (booking.items ?? []).forEach((item) => {
      const name = item.name?.trim();
      if (!name) return;
      const quantity = Number(item.quantity ?? 1) || 1;
      const price = Number(item.price ?? 0) || 0;
      const current = dishMap.get(name) ?? { name, orders: 0, revenue: 0 };
      current.orders += quantity;
      current.revenue += quantity * price;
      dishMap.set(name, current);
    });
  });

  return [...dishMap.values()].sort((a, b) => b.orders - a.orders || b.revenue - a.revenue).slice(0, 8);
}

function buildPeakHours(bookings) {
  const hourMap = new Map();

  bookings.forEach((booking) => {
    const hour = String(booking.time ?? "").split(":")[0]?.padStart(2, "0");
    if (!hour || Number.isNaN(Number(hour))) return;
    const label = `${hour}:00`;
    hourMap.set(label, (hourMap.get(label) ?? 0) + 1);
  });

  return [...hourMap.entries()]
    .map(([hour, bookings]) => ({ hour, bookings }))
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 6);
}

function buildCustomerGrowth(bookings, baseBuckets, period = "monthly") {
  const buckets = baseBuckets.map((bucket) => ({ key: bucket.key, label: bucket.label, customers: 0 }));
  const seenByBucket = new Map(buckets.map((bucket) => [bucket.key, new Set()]));

  bookings.forEach((booking) => {
    const key = getSeriesKey(booking.createdAt, period);
    const customerKey = String(booking.userId || booking.customerEmail || booking.customerPhone || booking.customerName || "").trim();
    if (!customerKey || !seenByBucket.has(key)) return;
    seenByBucket.get(key).add(customerKey);
  });

  buckets.forEach((bucket) => {
    bucket.customers = seenByBucket.get(bucket.key)?.size ?? 0;
  });

  return buckets;
}

function buildRestaurantPerformance({ restaurants, bookings, payments }) {
  return restaurants.map((restaurant) => {
    const relatedBookings = bookings.filter(
      (booking) =>
        String(booking.restaurantId) === String(restaurant._id) ||
        booking.restaurantName === restaurant.name,
    );
    const relatedBookingIds = new Set(relatedBookings.map((booking) => String(booking._id)));
    const revenue = payments
      .filter((payment) => relatedBookingIds.has(String(payment.bookingId?._id ?? payment.bookingId)))
      .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

    return {
      restaurantName: restaurant.name,
      location: restaurant.location,
      bookings: relatedBookings.length,
      revenue,
    };
  }).sort((a, b) => b.revenue - a.revenue || b.bookings - a.bookings);
}

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Owner name is required"),
    body("businessName").trim().notEmpty().withMessage("Business name is required"),
    body("email").isEmail().withMessage("Enter a valid email address").normalizeEmail(),
    body("phone").matches(vendorPhonePattern).withMessage("Phone number must be exactly 10 digits and cannot start with 0"),
    body("password")
      .matches(vendorPasswordPattern)
      .withMessage("Password must be at least 8 characters and include uppercase, lowercase, number, and @"),
  ],
  async (request, response, next) => {
    try {
      const errors = validationResult(request);
      if (!errors.isEmpty()) return response.status(400).json({ errors: errors.array() });

      const { name, businessName, email, phone, password } = request.body;
      const normalizedEmail = email.toLowerCase().trim();
      const existing = isDatabaseReady()
        ? await Vendor.findOne({ email: normalizedEmail })
        : findMemoryVendorByEmail(normalizedEmail);
      if (existing) return response.status(409).json({ message: "Vendor email already registered" });

      const passwordHash = await bcrypt.hash(password, 10);
      const vendor = isDatabaseReady()
        ? await Vendor.create({ name, businessName, email: normalizedEmail, phone, passwordHash })
        : createMemoryVendor({ name, businessName, email: normalizedEmail, phone, passwordHash });
      return response.status(201).json({ token: createVendorToken(vendor), vendor: publicVendor(vendor) });
    } catch (error) {
      return next(error);
    }
  },
);

router.post(
  "/login",
  [body("email").isEmail().withMessage("Enter a valid email address").normalizeEmail(), body("password").notEmpty().withMessage("Password is required")],
  async (request, response, next) => {
    try {
      const errors = validationResult(request);
      if (!errors.isEmpty()) return response.status(400).json({ errors: errors.array() });

      const normalizedEmail = request.body.email.toLowerCase().trim();
      const vendor = isDatabaseReady()
        ? await Vendor.findOne({ email: normalizedEmail })
        : findMemoryVendorByEmail(normalizedEmail);
      if (!vendor) return response.status(401).json({ message: "Invalid vendor credentials" });
      if (vendor.isBlocked) return response.status(403).json({ message: "Your vendor account has been blocked by admin" });

      const valid = await bcrypt.compare(request.body.password, vendor.passwordHash);
      if (!valid) return response.status(401).json({ message: "Invalid vendor credentials" });

      return response.json({ token: createVendorToken(vendor), vendor: publicVendor(vendor) });
    } catch (error) {
      return next(error);
    }
  },
);

router.post("/google", [body("credential").notEmpty().withMessage("Google credential is required")], async (request, response, next) => {
  try {
    if (!googleClient) {
      return response.status(500).json({ message: "GOOGLE_CLIENT_ID is not configured" });
    }

    const errors = validationResult(request);
    if (!errors.isEmpty()) return response.status(400).json({ errors: errors.array() });

    const ticket = await googleClient.verifyIdToken({
      idToken: request.body.credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) return response.status(401).json({ message: "Invalid Google account" });

    const email = payload.email.toLowerCase().trim();
    const name = payload.name ?? payload.given_name ?? email.split("@")[0];
    const existing = isDatabaseReady() ? await Vendor.findOne({ email }) : findMemoryVendorByEmail(email);

    const vendor =
      existing ??
      (isDatabaseReady()
        ? await Vendor.create({
            name,
            businessName: payload.hd ? `${payload.hd} Vendor` : `${name}'s Business`,
            email,
            phone: "9999999999",
            passwordHash: await bcrypt.hash(`${email}:${Date.now()}`, 10),
          })
        : createMemoryVendor({
            name,
            businessName: payload.hd ? `${payload.hd} Vendor` : `${name}'s Business`,
            email,
            phone: "9999999999",
            passwordHash: await bcrypt.hash(`${email}:${Date.now()}`, 10),
          }));

    return response.json({ token: createVendorToken(vendor), vendor: publicVendor(vendor) });
  } catch (error) {
    return next(error);
  }
});

router.use(requireVendorAuth);
router.use(async (request, response, next) => {
  try {
    const vendor = await findVendorFromRequest(request);
    if (!vendor) return response.status(404).json({ message: "Vendor not found" });

    request.vendorRecord = vendor;
    request.vendor = {
      ...request.vendor,
      id: String(vendor._id),
      email: vendor.email,
      name: vendor.name,
    };
    return next();
  } catch (error) {
    return next(error);
  }
});

router.get("/me", async (request, response, next) => {
  try {
    return response.json(publicVendor(request.vendorRecord));
  } catch (error) {
    return next(error);
  }
});

router.patch(
  "/me",
  [
    body("name").optional().trim().notEmpty().withMessage("Owner name is required"),
    body("businessName").optional().trim().notEmpty().withMessage("Business name is required"),
    body("phone").optional({ checkFalsy: true }).matches(vendorPhonePattern).withMessage("Phone number must be exactly 10 digits and cannot start with 0"),
    body("logo").optional().isString(),
  ],
  async (request, response, next) => {
    try {
      if (!validateRequest(request, response)) return;
      if (!isDatabaseReady()) {
        const current = findMemoryVendorById(request.vendor.id);
        if (!current) return response.status(404).json({ message: "Vendor not found" });
        const vendor = updateMemoryVendor(current.email, {
          ...(request.body.name ? { name: request.body.name.trim() } : {}),
          ...(request.body.businessName ? { businessName: request.body.businessName.trim() } : {}),
          ...(request.body.phone ? { phone: request.body.phone.trim() } : {}),
          ...(request.body.logo !== undefined ? { logo: request.body.logo } : {}),
        });
        return response.json(publicVendor(vendor));
      }

      const vendor = await Vendor.findByIdAndUpdate(
        request.vendor.id,
        {
          ...(request.body.name ? { name: request.body.name.trim() } : {}),
          ...(request.body.businessName ? { businessName: request.body.businessName.trim() } : {}),
          ...(request.body.phone ? { phone: request.body.phone.trim() } : {}),
          ...(request.body.logo !== undefined ? { logo: request.body.logo } : {}),
        },
        { new: true },
      );
      if (!vendor) return response.status(404).json({ message: "Vendor not found" });
      return response.json(publicVendor(vendor));
    } catch (error) {
      return next(error);
    }
  },
);

router.post(
  "/change-password",
  [
    body("oldPassword").notEmpty().withMessage("Old password is required"),
    body("newPassword")
      .matches(vendorPasswordPattern)
      .withMessage("Password must be at least 8 characters and include uppercase, lowercase, number, and @"),
    body("confirmPassword")
      .custom((value, { req }) => value === req.body.newPassword)
      .withMessage("Confirm password must match new password"),
  ],
  async (request, response, next) => {
    try {
      if (!validateRequest(request, response)) return;

      const vendor = isDatabaseReady()
        ? await Vendor.findById(request.vendor.id)
        : findMemoryVendorById(request.vendor.id);
      if (!vendor) return response.status(404).json({ message: "Vendor not found" });

      const validOldPassword = await bcrypt.compare(request.body.oldPassword, vendor.passwordHash);
      if (!validOldPassword) return response.status(400).json({ message: "Old password is incorrect" });

      const passwordHash = await bcrypt.hash(request.body.newPassword, 10);
      if (isDatabaseReady()) {
        await Vendor.findByIdAndUpdate(request.vendor.id, { passwordHash });
      } else {
        updateMemoryVendor(vendor.email, { passwordHash });
      }

      return response.json({ message: "Password updated successfully" });
    } catch (error) {
      return next(error);
    }
  },
);

router.get("/dashboard", async (request, response, next) => {
  try {
    const period = ["daily", "weekly", "monthly"].includes(request.query.period) ? request.query.period : "monthly";
    if (!isDatabaseReady()) {
      return response.json(emptyVendorDashboard(period));
    }

    const { restaurants, restaurantIds } = await getVendorRestaurantIds(request.vendor.id);
    const restaurantNames = restaurants.map((restaurant) => restaurant.name).filter(Boolean);
    const bookingQuery = restaurantIds.length
      ? {
          $or: [
            { restaurantId: { $in: restaurantIds } },
            { restaurantName: { $in: restaurantNames } },
          ],
        }
      : { _id: { $in: [] } };
    const [bookings, payments, menuItems, tables, feedback, offers, waitlist, notifications, adminDeals] = await Promise.all([
      Booking.find(bookingQuery).sort({ createdAt: -1 }).select("userId restaurantId restaurantName city customerName customerEmail customerPhone tableId tableType guests date time slot status checkInStatus items createdAt").lean(),
      Payment.find()
        .populate({
          path: "bookingId",
          match: bookingQuery,
          select: "restaurantId restaurantName",
        })
        .select("bookingId amount status method provider transactionId createdAt")
        .lean(),
      MenuItem.find({ restaurantId: { $in: restaurantIds } }).select("restaurantId name category price available isVeg isCombo isFestival isTodaySpecial image addons specialOffer createdAt").lean(),
      Table.find({ restaurantId: { $in: restaurantIds } }).select("restaurantId tableId type seats floor price status layout createdAt").lean(),
      Feedback.find()
        .populate({
          path: "bookingId",
          match: bookingQuery,
          select: "restaurantId restaurantName city customerName customerEmail customerPhone date time tableId",
        })
        .select("bookingId foodRating serviceRating comment vendorReply reported createdAt")
        .lean(),
      Offer.find({ vendorId: request.vendor.id }).select("restaurantId code discount minOrder validUntil isActive notes createdAt").lean(),
      Waitlist.find({ vendorId: request.vendor.id })
        .sort({ date: 1, time: 1, position: 1 })
        .select("restaurantId bookingId userId name phone email guests position date time slot tableType estimatedWait status createdAt")
        .lean(),
      Notification.find({
        $or: [
          { userId: String(request.vendor.id) },
          ...(restaurantIds.length ? [{ bookingId: { $exists: true } }] : []),
        ],
      })
        .populate({
          path: "bookingId",
          match: bookingQuery,
          select: "restaurantId restaurantName city customerName customerEmail customerPhone date time tableId status",
        })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      AdminDeal.find({ audience: "vendor", isActive: true }).sort({ createdAt: -1 }).lean(),
    ]);

    const vendorPayments = payments.filter((payment) => payment.bookingId && payment.status === "paid");
    const vendorFeedback = feedback
      .filter((item) => item.bookingId)
      .map((item) => ({
        ...item,
        restaurantName: item.bookingId.restaurantName,
        customerName: item.bookingId.customerName,
        customerEmail: item.bookingId.customerEmail,
        customerPhone: item.bookingId.customerPhone,
        date: item.bookingId.date,
        time: item.bookingId.time,
        tableId: item.bookingId.tableId,
      }));
    const vendorNotifications = notifications
      .filter((item) => String(item.userId) === String(request.vendor.id) || item.bookingId)
      .map((item) => ({
        ...item,
        restaurantName: item.bookingId?.restaurantName ?? "",
        customerName: item.bookingId?.customerName ?? "",
        customerEmail: item.bookingId?.customerEmail ?? "",
        customerPhone: item.bookingId?.customerPhone ?? "",
        date: item.bookingId?.date ?? "",
        time: item.bookingId?.time ?? "",
        tableId: item.bookingId?.tableId ?? "",
      }));
    const today = new Date().toISOString().slice(0, 10);
    const upcomingBookings = bookings.filter((booking) => String(booking.date) >= today && booking.status !== "cancelled");
    const todaysBookings = bookings.filter((booking) => String(booking.date).startsWith(today));
    const totalRevenue = vendorPayments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
    const availableTables = tables.filter((table) => table.status === "available").length;
    const occupiedTables = tables.filter((table) => table.status === "occupied").length;
    const pendingBookings = bookings.filter((booking) => booking.status === "pending").length;
    const totalCustomers = new Set(bookings.map((booking) => String(booking.userId))).size;
    const occupancyRate = tables.length ? Math.round((occupiedTables / tables.length) * 100) : 0;
    const revenueSeries = buildRevenueSeries(vendorPayments, period);
    const bookingSeries = buildBookingSeries(bookings, revenueSeries, period);
    const popularDishes = buildPopularDishes(bookings);
    const peakHours = buildPeakHours(bookings);
    const customerGrowth = buildCustomerGrowth(bookings, revenueSeries, period);
    const restaurantPerformance = buildRestaurantPerformance({ restaurants, bookings, payments: vendorPayments });
    const statusBreakdown = ["pending", "confirmed", "waitlist", "cancelled", "checked_in", "completed"].map((status) => ({
      status,
      count: bookings.filter((booking) => booking.status === status).length,
    }));

    return response.json({
      summary: {
        totalRestaurants: restaurants.length,
        todaysBookings: todaysBookings.length,
        upcomingBookings: upcomingBookings.length,
        totalRevenue,
        totalCustomers,
        pendingBookings,
        availableTables,
        occupancyRate,
      },
      restaurants,
      menuItems,
      tables,
      bookings,
      payments: vendorPayments,
      feedback: vendorFeedback,
      offers,
      adminDeals,
      waitlist,
      notifications: vendorNotifications,
      charts: {
        period,
        labels: revenueSeries.map((bucket) => bucket.label),
        revenue: revenueSeries.map((bucket) => bucket.total),
        bookings: bookingSeries.map((bucket) => bucket.bookings),
        popularDishes: popularDishes.length
          ? popularDishes
          : menuItems.slice(0, 5).map((item) => ({ name: item.name, orders: 0, revenue: 0 })),
        peakHours,
        customerGrowth,
        restaurantPerformance,
        statusBreakdown,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/restaurants", restaurantValidators, async (request, response, next) => {
  try {
    if (!validateRequest(request, response)) return;
    const restaurant = await Restaurant.create({ ...request.body, vendorId: request.vendor.id });
    return response.status(201).json(restaurant);
  } catch (error) {
    return next(error);
  }
});

router.patch("/restaurants/:id", restaurantValidators, async (request, response, next) => {
  try {
    if (!validateRequest(request, response)) return;
    const restaurant = await Restaurant.findOneAndUpdate(
      { _id: request.params.id, vendorId: request.vendor.id },
      request.body,
      { new: true },
    );
    if (!restaurant) return response.status(404).json({ message: "Restaurant not found" });
    return response.json(restaurant);
  } catch (error) {
    return next(error);
  }
});

router.delete("/restaurants/:id", async (request, response, next) => {
  try {
    const restaurant = await Restaurant.findOneAndDelete({ _id: request.params.id, vendorId: request.vendor.id });
    if (!restaurant) return response.status(404).json({ message: "Restaurant not found" });
    return response.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.post("/menu", menuValidators, async (request, response, next) => {
  try {
    if (!validateRequest(request, response)) return;
    const restaurant = await Restaurant.findOne({ _id: request.body.restaurantId, vendorId: request.vendor.id });
    if (!restaurant) return response.status(404).json({ message: "Restaurant not found" });
    const menuItem = await MenuItem.create({ ...request.body, vendorId: request.vendor.id });
    return response.status(201).json(menuItem);
  } catch (error) {
    return next(error);
  }
});

router.patch("/menu/:id", menuValidators, async (request, response, next) => {
  try {
    if (!validateRequest(request, response)) return;
    const { restaurantIds } = await getVendorRestaurantIds(request.vendor.id);
    const menuItem = await MenuItem.findOneAndUpdate(
      { _id: request.params.id, restaurantId: { $in: restaurantIds } },
      request.body,
      { new: true },
    );
    if (!menuItem) return response.status(404).json({ message: "Dish not found" });
    return response.json(menuItem);
  } catch (error) {
    return next(error);
  }
});

router.delete("/menu/:id", async (request, response, next) => {
  try {
    const { restaurantIds } = await getVendorRestaurantIds(request.vendor.id);
    const menuItem = await MenuItem.findOneAndDelete({ _id: request.params.id, restaurantId: { $in: restaurantIds } });
    if (!menuItem) return response.status(404).json({ message: "Dish not found" });
    return response.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.post("/tables", tableValidators, async (request, response, next) => {
  try {
    if (!validateRequest(request, response)) return;
    const restaurant = await Restaurant.findOne({ _id: request.body.restaurantId, vendorId: request.vendor.id });
    if (!restaurant) return response.status(404).json({ message: "Restaurant not found" });
    const table = await Table.create({ ...request.body, vendorId: request.vendor.id });
    return response.status(201).json(table);
  } catch (error) {
    return next(error);
  }
});

router.patch("/tables/:id", tableValidators, async (request, response, next) => {
  try {
    if (!validateRequest(request, response)) return;
    const { restaurantIds } = await getVendorRestaurantIds(request.vendor.id);
    const table = await Table.findOneAndUpdate(
      { _id: request.params.id, restaurantId: { $in: restaurantIds } },
      request.body,
      { new: true },
    );
    if (!table) return response.status(404).json({ message: "Table not found" });
    return response.json(table);
  } catch (error) {
    return next(error);
  }
});

router.delete("/tables/:id", async (request, response, next) => {
  try {
    const { restaurantIds } = await getVendorRestaurantIds(request.vendor.id);
    const table = await Table.findOneAndDelete({ _id: request.params.id, restaurantId: { $in: restaurantIds } });
    if (!table) return response.status(404).json({ message: "Table not found" });
    return response.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.patch("/bookings/:id/status", bookingStatusValidators, async (request, response, next) => {
  try {
    if (!validateRequest(request, response)) return;
    const { restaurants, restaurantIds } = await getVendorRestaurantIds(request.vendor.id);
    const booking = await Booking.findOne(buildVendorBookingQuery({ bookingId: request.params.id, restaurants, restaurantIds }));
    if (!booking) return response.status(404).json({ message: "Booking not found" });
    const previousStatus = booking.status;
    booking.status = request.body.status;
    booking.time = request.body.time ?? booking.time;
    booking.slot = request.body.slot ?? booking.slot;
    if (booking.status === "confirmed" && (previousStatus === "waitlist" || booking.waitlistPosition)) {
      booking.waitlistPosition = null;
      await Waitlist.updateMany(
        { bookingId: booking._id, status: { $in: ["waiting", "notified"] } },
        { $set: { status: "seated" } },
      );
    }
    await booking.save();
    await syncTableStatusesForBooking(booking, booking.status);
    if (booking.status === "cancelled" && (previousStatus === "waitlist" || booking.waitlistPosition)) {
      await Waitlist.updateMany(
        { bookingId: booking._id, status: { $in: ["waiting", "notified"] } },
        { $set: { status: "cancelled" } },
      );
    }
    if (booking.status === "cancelled") {
      await promoteNextWaitlist({ restaurantId: booking.restaurantId, date: booking.date, time: booking.time });
    }
    return response.json(booking);
  } catch (error) {
    return next(error);
  }
});

router.patch("/bookings/:id", bookingUpdateValidators, async (request, response, next) => {
  try {
    if (!validateRequest(request, response)) return;
    const { restaurants, restaurantIds } = await getVendorRestaurantIds(request.vendor.id);
    const booking = await Booking.findOneAndUpdate(
      buildVendorBookingQuery({ bookingId: request.params.id, restaurants, restaurantIds }),
      request.body,
      { new: true },
    );
    if (!booking) return response.status(404).json({ message: "Booking not found" });
    return response.json(booking);
  } catch (error) {
    return next(error);
  }
});

router.patch(
  "/bookings/:id/check-in",
  [body("checkInStatus").optional().isIn(checkInStatusValues).withMessage("Invalid check-in status"), body("qrCode").optional().isString()],
  async (request, response, next) => {
  try {
    if (!validateRequest(request, response)) return;
    const { restaurants, restaurantIds } = await getVendorRestaurantIds(request.vendor.id);
    const booking = await Booking.findOne(buildVendorBookingQuery({ bookingId: request.params.id, restaurants, restaurantIds }));
    if (!booking) return response.status(404).json({ message: "Booking not found" });
    booking.checkInStatus = request.body.checkInStatus ?? "verified";
    booking.qrCode = request.body.qrCode ?? booking.qrCode;
    booking.status = booking.checkInStatus === "verified" ? "checked_in" : booking.status;
    await booking.save();
    await syncTableStatusesForBooking(booking, booking.status);
    return response.json(booking);
  } catch (error) {
    return next(error);
  }
});

router.post("/waitlist", waitlistValidators, async (request, response, next) => {
  try {
    if (!validateRequest(request, response)) return;
    if (!request.body.restaurantId || !request.body.name || !request.body.date || !request.body.time) {
      return response.status(400).json({ message: "restaurantId, name, date, and time are required" });
    }
    const restaurant = await Restaurant.findOne({ _id: request.body.restaurantId, vendorId: request.vendor.id });
    if (!restaurant) return response.status(404).json({ message: "Restaurant not found" });
    const position = await getNextWaitlistPosition({
      restaurantId: restaurant._id,
      date: request.body.date,
      time: request.body.time,
    });
    const entry = await Waitlist.create({
      ...request.body,
      restaurantId: restaurant._id,
      vendorId: request.vendor.id,
      guests: Number(request.body.guests ?? 2),
      position,
      status: request.body.status ?? "waiting",
    });
    return response.status(201).json(entry);
  } catch (error) {
    return next(error);
  }
});

router.patch("/waitlist/:id", waitlistValidators, async (request, response, next) => {
  try {
    if (!validateRequest(request, response)) return;
    const updates = { ...request.body };
    delete updates.vendorId;
    delete updates.position;
    if (updates.restaurantId) {
      const restaurant = await Restaurant.findOne({ _id: updates.restaurantId, vendorId: request.vendor.id });
      if (!restaurant) return response.status(404).json({ message: "Restaurant not found" });
      updates.restaurantId = restaurant._id;
    }
    const entry = await Waitlist.findOneAndUpdate({ _id: request.params.id, vendorId: request.vendor.id }, updates, { new: true });
    if (!entry) return response.status(404).json({ message: "Waitlist entry not found" });
    return response.json(entry);
  } catch (error) {
    return next(error);
  }
});

router.delete("/waitlist/:id", async (request, response, next) => {
  try {
    const entry = await Waitlist.findOneAndDelete({ _id: request.params.id, vendorId: request.vendor.id });
    if (!entry) return response.status(404).json({ message: "Waitlist entry not found" });
    return response.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.patch("/feedback/:id", async (request, response, next) => {
  try {
    const { restaurantIds } = await getVendorRestaurantIds(request.vendor.id);
    const feedback = await Feedback.findOneAndUpdate(
      { _id: request.params.id, bookingId: { $exists: true } },
      request.body,
      { new: true },
    ).populate({ path: "bookingId", match: { restaurantId: { $in: restaurantIds } } });
    if (!feedback) return response.status(404).json({ message: "Review not found" });
    return response.json(feedback);
  } catch (error) {
    return next(error);
  }
});

router.delete("/feedback/:id", async (request, response, next) => {
  try {
    const { restaurantIds } = await getVendorRestaurantIds(request.vendor.id);
    const feedback = await Feedback.findOne({ _id: request.params.id }).populate({
      path: "bookingId",
      match: { restaurantId: { $in: restaurantIds } },
    });
    if (!feedback?.bookingId) return response.status(404).json({ message: "Review not found" });
    await Feedback.findByIdAndDelete(request.params.id);
    if (!feedback) return response.status(404).json({ message: "Review not found" });
    return response.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.post("/offers", offerValidators, async (request, response, next) => {
  try {
    if (!validateRequest(request, response)) return;
    const offer = await Offer.create({ ...request.body, vendorId: request.vendor.id });
    return response.status(201).json(offer);
  } catch (error) {
    return next(error);
  }
});

router.patch("/offers/:id", offerValidators, async (request, response, next) => {
  try {
    if (!validateRequest(request, response)) return;
    const offer = await Offer.findOneAndUpdate({ _id: request.params.id, vendorId: request.vendor.id }, request.body, { new: true });
    if (!offer) return response.status(404).json({ message: "Offer not found" });
    return response.json(offer);
  } catch (error) {
    return next(error);
  }
});

router.delete("/offers/:id", async (request, response, next) => {
  try {
    const offer = await Offer.findOneAndDelete({ _id: request.params.id, vendorId: request.vendor.id });
    if (!offer) return response.status(404).json({ message: "Offer not found" });
    return response.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.post("/notifications", notificationValidators, async (request, response, next) => {
  try {
    if (!validateRequest(request, response)) return;
    const notification = await Notification.create({
      userId: request.vendor.id,
      bookingId: request.body.bookingId,
      channels: request.body.channels ?? ["email"],
      status: "queued",
      message: request.body.message,
    });
    return response.status(201).json(notification);
  } catch (error) {
    return next(error);
  }
});

export default router;
