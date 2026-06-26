import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { User } from "../../models/User.js";
import { Vendor } from "../../vendor/models/Vendor.js";
import { Waitlist } from "../../vendor/models/Waitlist.js";
import { Restaurant } from "../../models/Restaurant.js";
import { Booking } from "../../models/Booking.js";
import { Table } from "../../models/Table.js";
import { MenuItem } from "../../models/MenuItem.js";
import { Payment } from "../../models/Payment.js";
import { Feedback } from "../../models/Feedback.js";
import { Notification } from "../../models/Notification.js";
import { SpinCoupon } from "../../models/SpinCoupon.js";
import { EventBooking } from "../../models/EventBooking.js";
import { AdminDeal } from "../../models/AdminDeal.js";
import PDFDocument from "pdfkit";
import { requireAdminAuth } from "../middlewares/adminAuth.js";
import { isDatabaseReady } from "../../config/database.js";

const router = Router();
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
  body("isActive").optional().isBoolean().withMessage("isActive must be boolean"),
];

const adminBookingValidators = [
  body("restaurantId").optional().notEmpty().withMessage("restaurantId is required"),
  body("date").optional().isISO8601().withMessage("date must be valid"),
  body("time").optional().trim().notEmpty().withMessage("time is required"),
  body("slot").optional().isIn(bookingSlotValues).withMessage("Invalid slot"),
  body("status").optional().isIn(bookingStatusValues).withMessage("Invalid booking status"),
  body("checkInStatus").optional().isIn(checkInStatusValues).withMessage("Invalid check-in status"),
  body("linkedTableIds").optional().isArray().withMessage("linkedTableIds must be an array"),
];

const adminBookingCreateValidators = [
  body("restaurantId").notEmpty().withMessage("restaurantId is required"),
  body("date").isISO8601().withMessage("date must be valid"),
  body("time").trim().notEmpty().withMessage("time is required"),
  body("slot").optional().isIn(bookingSlotValues).withMessage("Invalid slot"),
  body("status").optional().isIn(bookingStatusValues).withMessage("Invalid booking status"),
  body("checkInStatus").optional().isIn(checkInStatusValues).withMessage("Invalid check-in status"),
  body("linkedTableIds").optional().isArray().withMessage("linkedTableIds must be an array"),
];

const tableValidators = [
  body("restaurantId").optional().notEmpty().withMessage("restaurantId is required"),
  body("tableId").optional().trim().notEmpty().withMessage("tableId is required"),
  body("type").optional().trim().notEmpty().withMessage("type is required"),
  body("city").optional().trim().notEmpty().withMessage("city is required"),
  body("seats").optional().isInt({ min: 1 }).withMessage("seats must be at least 1"),
  body("price").optional().isFloat({ min: 0 }).withMessage("price must be 0 or greater"),
  body("status").optional().isIn(tableStatusValues).withMessage("Invalid table status"),
];

const waitlistValidators = [
  body("status").optional().isIn(waitlistStatusValues).withMessage("Invalid waitlist status"),
  body("estimatedWait").optional().trim().notEmpty().withMessage("estimatedWait cannot be empty"),
];

const menuValidators = [
  body("restaurantId").optional().notEmpty().withMessage("restaurantId is required"),
  body("name").optional().trim().notEmpty().withMessage("Menu item name is required"),
  body("category").optional().trim().notEmpty().withMessage("Category is required"),
  body("price").optional().isFloat({ gt: 0 }).withMessage("Price must be greater than 0"),
  body("available").optional().isBoolean().withMessage("available must be boolean"),
];

const adminDealValidators = [
  body("audience").isIn(["user", "vendor"]).withMessage("Invalid deal audience"),
  body("title").trim().notEmpty().withMessage("Deal title is required"),
  body("description").optional().isString().withMessage("description must be text"),
  body("code").optional().isString().withMessage("code must be text"),
  body("discount").isFloat({ min: 0 }).withMessage("discount must be 0 or greater"),
  body("minOrder").optional().isFloat({ min: 0 }).withMessage("minOrder must be 0 or greater"),
  body("validUntil").optional().isString().withMessage("validUntil must be text"),
  body("isActive").optional().isBoolean().withMessage("isActive must be boolean"),
];

const adminDealUpdateValidators = [
  body("audience").optional().isIn(["user", "vendor"]).withMessage("Invalid deal audience"),
  body("title").optional().trim().notEmpty().withMessage("Deal title is required"),
  body("description").optional().isString().withMessage("description must be text"),
  body("code").optional().isString().withMessage("code must be text"),
  body("discount").optional().isFloat({ min: 0 }).withMessage("discount must be 0 or greater"),
  body("minOrder").optional().isFloat({ min: 0 }).withMessage("minOrder must be 0 or greater"),
  body("validUntil").optional().isString().withMessage("validUntil must be text"),
  body("isActive").optional().isBoolean().withMessage("isActive must be boolean"),
];

function getAdminCredentials() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD?.trim();

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be configured");
  }

  return { email, password };
}

function createAdminToken(admin) {
  return jwt.sign({ id: admin._id, name: admin.name, email: admin.email, role: "admin" }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

function publicAdmin(admin) {
  return {
    id: admin._id,
    name: admin.name,
    email: admin.email,
    phone: admin.phone,
    picture: admin.picture,
    role: "admin",
  };
}

async function findAdminFromRequest(request) {
  if (request.admin?.id && /^[a-f\d]{24}$/i.test(String(request.admin.id))) {
    const adminById = await User.findOne({ _id: request.admin.id, role: "admin" });
    if (adminById) return adminById;
  }

  if (request.admin?.email) {
    return User.findOne({ email: String(request.admin.email).toLowerCase().trim(), role: "admin" });
  }

  return null;
}

function buildOrderRows(bookings, payments = [], menuItems = []) {
  const paymentByBooking = new Map(payments.map((payment) => [String(payment.bookingId), payment]));
  const priceByRestaurantAndName = new Map(
    menuItems.map((item) => [`${String(item.restaurantId)}::${String(item.name || "").trim().toLowerCase()}`, Number(item.price || 0)]),
  );
  const priceByRestaurantNameAndName = new Map(
    menuItems.map((item) => [`${String(item.restaurantName || "").trim().toLowerCase()}::${String(item.name || "").trim().toLowerCase()}`, Number(item.price || 0)]),
  );
  const priceByName = new Map();
  menuItems.forEach((item) => {
    const name = String(item.name || "").trim().toLowerCase();
    const price = Number(item.price || 0);
    if (!name || price <= 0) return;
    if (priceByName.has(name) && priceByName.get(name) !== price) {
      priceByName.set(name, 0);
      return;
    }
    priceByName.set(name, price);
  });

  const findItemPrice = (booking, item) => {
    const explicitPrice = Number(item.price || 0);
    if (explicitPrice > 0) return explicitPrice;
    const itemName = String(item.name || "").trim().toLowerCase();
    const byId = priceByRestaurantAndName.get(`${String(booking.restaurantId)}::${itemName}`);
    if (byId > 0) return byId;
    const byRestaurantName = priceByRestaurantNameAndName.get(`${String(booking.restaurantName || "").trim().toLowerCase()}::${itemName}`);
    if (byRestaurantName > 0) return byRestaurantName;
    return priceByName.get(itemName) || 0;
  };

  return bookings.flatMap((booking) => {
    const items = Array.isArray(booking.items) ? booking.items : [];
    const payment = paymentByBooking.get(String(booking._id));

    if (!items.length) {
      return [{
        _id: `${booking._id}-booking`,
        bookingId: booking._id,
        restaurantId: booking.restaurantId,
        restaurantName: booking.restaurantName,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        name: "Table booking",
        quantity: 1,
        price: payment?.amount || 0,
        amount: payment?.amount || 0,
        status: booking.status,
        paymentStatus: payment?.status || "pending",
        paymentAmount: payment?.amount || 0,
        transactionId: payment?.transactionId,
        paymentMethod: payment?.method || payment?.provider,
        date: booking.date,
        time: booking.time,
        createdAt: booking.createdAt,
      }];
    }

    const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 1), 0) || 1;

    return items.map((item, index) => {
      const quantity = Number(item.quantity || 1);
      const price = findItemPrice(booking, item) || (payment?.amount ? Number(payment.amount || 0) / totalQuantity : 0);
      return {
        _id: `${booking._id}-${index}`,
        bookingId: booking._id,
        restaurantId: booking.restaurantId,
        restaurantName: booking.restaurantName,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        name: item.name || "Order item",
        quantity,
        price,
        amount: price * quantity,
        status: booking.status,
        paymentStatus: payment?.status || "pending",
        paymentAmount: payment?.amount || 0,
        transactionId: payment?.transactionId,
        paymentMethod: payment?.method || payment?.provider,
        date: booking.date,
        time: booking.time,
        createdAt: booking.createdAt,
      };
    });
  });
}

function shapeAdminPayment(payment, booking, restaurant) {
  const paymentObject = typeof payment.toObject === "function" ? payment.toObject() : payment;
  const bookingRecord = booking || paymentObject.bookingId;

  return {
    ...paymentObject,
    bookingId: bookingRecord?._id || paymentObject.bookingId,
    restaurantId: bookingRecord?.restaurantId,
    restaurantName: bookingRecord?.restaurantName || "Unknown restaurant",
    restaurantLocation: restaurant?.location || bookingRecord?.city,
    location: restaurant?.location || bookingRecord?.city,
    customerName: bookingRecord?.customerName,
    customerEmail: bookingRecord?.customerEmail,
    customerPhone: bookingRecord?.customerPhone,
    date: bookingRecord?.date,
    time: bookingRecord?.time,
  };
}

function shapeAdminFeedback(feedback, booking) {
  const feedbackObject = typeof feedback.toObject === "function" ? feedback.toObject() : feedback;
  const bookingRecord = booking || feedbackObject.bookingId;
  return {
    ...feedbackObject,
    bookingId: bookingRecord?._id || feedbackObject.bookingId,
    restaurantId: bookingRecord?.restaurantId,
    restaurantName: bookingRecord?.restaurantName || "Unknown restaurant",
    customerName: bookingRecord?.customerName || "Guest",
    customerEmail: bookingRecord?.customerEmail || "",
    customerPhone: bookingRecord?.customerPhone || "",
    date: bookingRecord?.date || "",
    time: bookingRecord?.time || "",
    title: bookingRecord?.customerName || feedbackObject.comment || "Review",
    details: feedbackObject.comment || "No comment",
  };
}

function shapeAdminNotification(notification, booking) {
  const notificationObject = typeof notification.toObject === "function" ? notification.toObject() : notification;
  const bookingRecord = booking || notificationObject.bookingId;
  return {
    ...notificationObject,
    bookingId: bookingRecord?._id || notificationObject.bookingId,
    restaurantId: bookingRecord?.restaurantId,
    restaurantName: bookingRecord?.restaurantName || "System",
    customerName: bookingRecord?.customerName || "",
    customerEmail: bookingRecord?.customerEmail || "",
    customerPhone: bookingRecord?.customerPhone || "",
    date: bookingRecord?.date || "",
    time: bookingRecord?.time || "",
    title: bookingRecord?.restaurantName || "Notification",
    details: notificationObject.message || "Notification",
  };
}

router.post("/login", [body("email").isEmail(), body("password").notEmpty()], async (request, response, next) => {
  try {
    const credentials = getAdminCredentials();
    const errors = validationResult(request);
    if (!errors.isEmpty()) return response.status(400).json({ errors: errors.array() });

    const { email, password } = request.body;
    const normalizedEmail = email.toLowerCase().trim();
    const passwordMatchesEnv = normalizedEmail === credentials.email && password === credentials.password;
    if (normalizedEmail !== credentials.email) {
      return response.status(401).json({ message: "Invalid admin credentials" });
    }
    if (!passwordMatchesEnv && !isDatabaseReady()) {
      return response.status(401).json({ message: "Invalid admin credentials" });
    }

    let admin = await User.findOne({ email: credentials.email, role: "admin" });
    if (!admin && !passwordMatchesEnv) {
      return response.status(401).json({ message: "Invalid admin credentials" });
    }

    if (!admin) {
      admin = await User.create({
        name: "Super Admin",
        email: credentials.email,
        phone: "0000000000",
        passwordHash: await bcrypt.hash(credentials.password, 10),
        role: "admin",
      });
    }

    const passwordMatchesSaved = await bcrypt.compare(password, admin.passwordHash);
    if (!passwordMatchesSaved && !passwordMatchesEnv) {
      return response.status(401).json({ message: "Invalid admin credentials" });
    }

    if (passwordMatchesEnv && !passwordMatchesSaved && typeof admin.save === "function") {
      admin.passwordHash = await bcrypt.hash(credentials.password, 10);
      await admin.save();
    }

    return response.json({ token: createAdminToken(admin), admin: publicAdmin(admin) });
  } catch (error) {
    return next(error);
  }
});

router.use(requireAdminAuth);

router.get("/me", async (request, response, next) => {
  try {
    const admin = await findAdminFromRequest(request);
    if (!admin) return response.status(404).json({ message: "Admin not found" });
    return response.json(publicAdmin(admin));
  } catch (error) {
    return next(error);
  }
});

router.patch(
  "/me",
  [
    body("name").optional().trim().notEmpty().withMessage("Name is required"),
    body("phone").optional({ checkFalsy: true }).trim().notEmpty().withMessage("Phone is required"),
    body("picture").optional().isString().withMessage("picture must be text"),
  ],
  async (request, response, next) => {
    try {
      if (!validateRequest(request, response)) return;
      const payload = {
        ...(request.body.name !== undefined ? { name: request.body.name } : {}),
        ...(request.body.phone !== undefined ? { phone: request.body.phone } : {}),
        ...(request.body.picture !== undefined ? { picture: request.body.picture } : {}),
      };
      const admin = await findAdminFromRequest(request);
      if (!admin) return response.status(404).json({ message: "Admin not found" });
      Object.assign(admin, payload);
      await admin.save();
      return response.json(publicAdmin(admin));
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
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@])[A-Za-z\d@#$%^&*()_+\-=[\]{};':"\\|,.<>/?!~`]{8,}$/)
      .withMessage("New password must have uppercase, lowercase, number, and @"),
  ],
  async (request, response, next) => {
    try {
      if (!validateRequest(request, response)) return;
      const credentials = getAdminCredentials();
      const admin = await findAdminFromRequest(request);
      if (!admin) return response.status(404).json({ message: "Admin not found" });

      const oldPasswordMatches = await bcrypt.compare(request.body.oldPassword, admin.passwordHash);
      const envPasswordMatches = request.body.oldPassword === credentials.password;
      if (!oldPasswordMatches && !envPasswordMatches) {
        return response.status(401).json({ message: "Old password is incorrect" });
      }

      admin.passwordHash = await bcrypt.hash(request.body.newPassword, 10);
      await admin.save();
      return response.json({ ok: true });
    } catch (error) {
      return next(error);
    }
  },
);

router.get("/dashboard", async (_request, response, next) => {
  try {
    const [users, vendors, restaurants, bookings, tables, menuItems, payments, reviews, notifications] = await Promise.all([
      User.find().sort({ createdAt: -1 }),
      Vendor.find().sort({ createdAt: -1 }),
      Restaurant.find().sort({ createdAt: -1 }),
      Booking.find().sort({ createdAt: -1 }),
      Table.find().sort({ createdAt: -1 }),
      MenuItem.find().sort({ createdAt: -1 }),
      Payment.find().sort({ createdAt: -1 }),
      Feedback.find().sort({ createdAt: -1 }),
      Notification.find().sort({ createdAt: -1 }),
    ]);

    const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    return response.json({
      summary: {
        users: users.length,
        vendors: vendors.length,
        restaurants: restaurants.length,
        bookings: bookings.length,
        tables: tables.length,
        menuItems: menuItems.length,
        payments: payments.length,
        reviews: reviews.length,
        notifications: notifications.length,
        revenue: totalRevenue,
        approvedRestaurants: restaurants.filter((restaurant) => restaurant.isActive).length,
        pendingBookings: bookings.filter((booking) => booking.status === "pending").length,
      },
      users,
      vendors,
      restaurants,
      bookings,
      tables,
      menuItems,
      payments,
      reviews,
      notifications,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/restaurants/:id/detail", async (request, response, next) => {
  try {
    const restaurant = await Restaurant.findById(request.params.id);
    if (!restaurant) return response.status(404).json({ message: "Restaurant not found" });

    const [bookings, tables, menuItems, payments] = await Promise.all([
      Booking.find({
        $or: [{ restaurantId: restaurant._id }, { restaurantName: restaurant.name }],
      }).sort({ createdAt: -1 }),
      Table.find({ restaurantId: restaurant._id }).sort({ createdAt: -1 }),
      MenuItem.find({ restaurantId: restaurant._id }).sort({ createdAt: -1 }),
      Payment.find().sort({ createdAt: -1 }),
    ]);

    const bookingIds = bookings.map((booking) => String(booking._id));
    const relatedPayments = payments.filter((payment) => bookingIds.includes(String(payment.bookingId)));

    return response.json({
      restaurant,
      bookings,
      tables,
      menuItems,
      payments: relatedPayments,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/restaurants", restaurantValidators, async (request, response, next) => {
  try {
    if (!validateRequest(request, response)) return;
    const restaurant = await Restaurant.create(request.body);
    return response.status(201).json(restaurant);
  } catch (error) {
    return next(error);
  }
});

router.get("/reports", async (_request, response, next) => {
  try {
    const [users, vendors, restaurants, bookings, tables, menuItems, payments, reviews, notifications] = await Promise.all([
      User.find().sort({ createdAt: -1 }),
      Vendor.find().sort({ createdAt: -1 }),
      Restaurant.find().sort({ createdAt: -1 }),
      Booking.find().sort({ createdAt: -1 }),
      Table.find().sort({ createdAt: -1 }),
      MenuItem.find().sort({ createdAt: -1 }),
      Payment.find().sort({ createdAt: -1 }),
      Feedback.find().sort({ createdAt: -1 }),
      Notification.find().sort({ createdAt: -1 }),
    ]);

    const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const activeRestaurants = restaurants.filter((restaurant) => restaurant.isActive).length;
    const pendingBookings = bookings.filter((booking) => booking.status === "pending").length;
    const confirmedBookings = bookings.filter((booking) => booking.status === "confirmed").length;
    const cancelledBookings = bookings.filter((booking) => booking.status === "cancelled").length;

    const summary = {
      users: users.length,
      vendors: vendors.length,
      restaurants: restaurants.length,
      bookings: bookings.length,
      tables: tables.length,
      menuItems: menuItems.length,
      payments: payments.length,
      reviews: reviews.length,
      notifications: notifications.length,
      revenue: totalRevenue,
      approvedRestaurants: activeRestaurants,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
    };

    return response.json({
      generatedAt: new Date().toISOString(),
      summary,
      topRestaurants: restaurants.slice(0, 5).map((restaurant) => ({
        name: restaurant.name,
        location: restaurant.location,
        isActive: restaurant.isActive,
      })),
      recentBookings: bookings.slice(0, 10).map((booking) => ({
        restaurantName: booking.restaurantName,
        date: booking.date,
        time: booking.time,
        status: booking.status,
        customerName: booking.customerName,
      })),
      recentPayments: payments.slice(0, 10).map((payment) => ({
        amount: payment.amount,
        status: payment.status,
        provider: payment.provider,
      })),
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/reports/pdf", async (_request, response, next) => {
  try {
    const [users, vendors, restaurants, bookings, tables, menuItems, payments, reviews, notifications] = await Promise.all([
      User.find().sort({ createdAt: -1 }),
      Vendor.find().sort({ createdAt: -1 }),
      Restaurant.find().sort({ createdAt: -1 }),
      Booking.find().sort({ createdAt: -1 }),
      Table.find().sort({ createdAt: -1 }),
      MenuItem.find().sort({ createdAt: -1 }),
      Payment.find().sort({ createdAt: -1 }),
      Feedback.find().sort({ createdAt: -1 }),
      Notification.find().sort({ createdAt: -1 }),
    ]);

    const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const doc = new PDFDocument({ margin: 42, size: "A4" });

    response.setHeader("Content-Type", "application/pdf");
    response.setHeader("Content-Disposition", 'attachment; filename="restorantbooking-admin-report.pdf"');
    doc.pipe(response);

    doc.fontSize(24).fillColor("#111827").text("RestorantBooking Super Admin Report", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#6b7280").text(`Generated at: ${new Date().toISOString()}`, { align: "center" });
    doc.moveDown(1.2);

    const rows = [
      ["Users", users.length],
      ["Vendors", vendors.length],
      ["Restaurants", restaurants.length],
      ["Bookings", bookings.length],
      ["Tables", tables.length],
      ["Menu Items", menuItems.length],
      ["Payments", payments.length],
      ["Reviews", reviews.length],
      ["Notifications", notifications.length],
      ["Revenue", `₹${Number(totalRevenue).toLocaleString("en-IN")}`],
      ["Approved Restaurants", restaurants.filter((restaurant) => restaurant.isActive).length],
      ["Pending Bookings", bookings.filter((booking) => booking.status === "pending").length],
    ];

    doc.fontSize(14).fillColor("#111827").text("Summary", { underline: true });
    doc.moveDown(0.5);
    rows.forEach(([label, value]) => {
      doc.fontSize(11).fillColor("#111827").text(`${label}: ${value}`);
    });

    doc.moveDown(1);
    doc.fontSize(14).fillColor("#111827").text("Recent Restaurants", { underline: true });
    doc.moveDown(0.5);
    restaurants.slice(0, 6).forEach((restaurant) => {
      doc.fontSize(11).text(`- ${restaurant.name} | ${restaurant.location} | ${restaurant.isActive ? "Active" : "Inactive"}`);
    });

    doc.moveDown(1);
    doc.fontSize(14).fillColor("#111827").text("Recent Bookings", { underline: true });
    doc.moveDown(0.5);
    bookings.slice(0, 8).forEach((booking) => {
      doc.fontSize(11).text(`- ${booking.restaurantName} | ${booking.date} | ${booking.time} | ${booking.status}`);
    });

    doc.end();
  } catch (error) {
    return next(error);
  }
});

router.patch("/restaurants/:id", restaurantValidators, async (request, response, next) => {
  try {
    if (!validateRequest(request, response)) return;
    const restaurant = await Restaurant.findByIdAndUpdate(request.params.id, request.body, { new: true });
    if (!restaurant) return response.status(404).json({ message: "Restaurant not found" });
    return response.json(restaurant);
  } catch (error) {
    return next(error);
  }
});

router.delete("/restaurants/:id", async (request, response, next) => {
  try {
    const restaurant = await Restaurant.findByIdAndDelete(request.params.id);
    if (!restaurant) return response.status(404).json({ message: "Restaurant not found" });

    const bookings = await Booking.find({
      $or: [{ restaurantId: restaurant._id }, { restaurantName: restaurant.name }],
    }).select("_id");
    const bookingIds = bookings.map((booking) => booking._id);

    await Promise.all([
      Booking.deleteMany({
        $or: [{ restaurantId: restaurant._id }, { restaurantName: restaurant.name }],
      }),
      Table.deleteMany({ restaurantId: restaurant._id }),
      MenuItem.deleteMany({ restaurantId: restaurant._id }),
      Payment.deleteMany({ bookingId: { $in: bookingIds } }),
    ]);

    return response.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.patch("/users/:id", async (request, response, next) => {
  try {
    const user = await User.findByIdAndUpdate(request.params.id, request.body, { new: true });
    if (!user) return response.status(404).json({ message: "User not found" });
    return response.json(user);
  } catch (error) {
    return next(error);
  }
});

router.patch("/vendors/:id", async (request, response, next) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(request.params.id, request.body, { new: true });
    if (!vendor) return response.status(404).json({ message: "Vendor not found" });
    return response.json(vendor);
  } catch (error) {
    return next(error);
  }
});

router.post("/restaurants/:id/approve", async (request, response, next) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(request.params.id, { isActive: true }, { new: true });
    if (!restaurant) return response.status(404).json({ message: "Restaurant not found" });
    return response.json(restaurant);
  } catch (error) {
    return next(error);
  }
});

router.post("/restaurants/:id/reject", async (request, response, next) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(request.params.id, { isActive: false }, { new: true });
    if (!restaurant) return response.status(404).json({ message: "Restaurant not found" });
    return response.json(restaurant);
  } catch (error) {
    return next(error);
  }
});

router.delete("/users/:id", async (request, response, next) => {
  try {
    const user = await User.findByIdAndDelete(request.params.id);
    if (!user) return response.status(404).json({ message: "User not found" });
    return response.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.delete("/vendors/:id", async (request, response, next) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(request.params.id);
    if (!vendor) return response.status(404).json({ message: "Vendor not found" });
    return response.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.get("/bookings", async (_request, response, next) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    return response.json(bookings);
  } catch (error) {
    return next(error);
  }
});

router.post("/bookings", adminBookingCreateValidators, async (request, response, next) => {
  try {
    if (!validateRequest(request, response)) return;
    const restaurant = await Restaurant.findById(request.body.restaurantId);
    if (!restaurant) return response.status(404).json({ message: "Restaurant not found" });

    const booking = await Booking.create({
      userId: request.body.userId || "admin-created",
      restaurantId: restaurant._id,
      restaurantName: request.body.restaurantName || restaurant.name,
      city: request.body.city || restaurant.location,
      customerName: request.body.customerName || "Walk-in guest",
      customerEmail: request.body.customerEmail || "",
      customerPhone: request.body.customerPhone || "",
      tableId: request.body.tableId,
      tableType: request.body.tableType,
      splitTableBooking: Boolean(request.body.splitTableBooking),
      linkedTableIds: Array.isArray(request.body.linkedTableIds) ? request.body.linkedTableIds : [],
      guests: request.body.guests,
      date: request.body.date,
      time: request.body.time,
      slot: request.body.slot || "dinner",
      items: Array.isArray(request.body.items) ? request.body.items : [],
      status: request.body.status || "pending",
      checkInStatus: request.body.checkInStatus || "pending",
    });

    return response.status(201).json(booking);
  } catch (error) {
    return next(error);
  }
});

router.patch("/bookings/:id", adminBookingValidators, async (request, response, next) => {
  try {
    if (!validateRequest(request, response)) return;
    let restaurantPatch = {};
    if (request.body.restaurantId) {
      const restaurant = await Restaurant.findById(request.body.restaurantId);
      if (!restaurant) return response.status(404).json({ message: "Restaurant not found" });
      restaurantPatch = {
        restaurantId: restaurant._id,
        restaurantName: request.body.restaurantName || restaurant.name,
        city: request.body.city || restaurant.location,
      };
    }

    const booking = await Booking.findByIdAndUpdate(
      request.params.id,
      { ...request.body, ...restaurantPatch },
      { new: true },
    );
    if (!booking) return response.status(404).json({ message: "Booking not found" });
    return response.json(booking);
  } catch (error) {
    return next(error);
  }
});

router.patch("/bookings/:id/status", [body("status").isIn(bookingStatusValues).withMessage("Invalid booking status")], async (request, response, next) => {
  try {
    if (!validateRequest(request, response)) return;
    const booking = await Booking.findByIdAndUpdate(
      request.params.id,
      { status: request.body.status },
      { new: true },
    );
    if (!booking) return response.status(404).json({ message: "Booking not found" });
    return response.json(booking);
  } catch (error) {
    return next(error);
  }
});

router.delete("/bookings/:id", async (request, response, next) => {
  try {
    const booking = await Booking.findByIdAndDelete(request.params.id);
    if (!booking) return response.status(404).json({ message: "Booking not found" });
    return response.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.get("/payments", async (_request, response, next) => {
  try {
    const [payments, bookings, restaurants] = await Promise.all([
      Payment.find().sort({ createdAt: -1 }),
      Booking.find().select("restaurantId restaurantName city customerName customerEmail customerPhone date time"),
      Restaurant.find().select("location"),
    ]);
    const bookingById = new Map(bookings.map((booking) => [String(booking._id), booking]));
    const restaurantById = new Map(restaurants.map((restaurant) => [String(restaurant._id), restaurant]));

    return response.json(payments.map((payment) => {
      const booking = bookingById.get(String(payment.bookingId));
      const restaurant = booking?.restaurantId ? restaurantById.get(String(booking.restaurantId)) : null;
      return shapeAdminPayment(payment, booking, restaurant);
    }));
  } catch (error) {
    return next(error);
  }
});

router.get("/payments/restaurant/:restaurantId", async (request, response, next) => {
  try {
    const restaurant = await Restaurant.findById(request.params.restaurantId).select("name location");
    if (!restaurant) return response.status(404).json({ message: "Restaurant not found" });

    const bookings = await Booking.find({ restaurantId: restaurant._id }).select("restaurantId restaurantName city customerName customerEmail customerPhone date time");
    const bookingById = new Map(bookings.map((booking) => [String(booking._id), booking]));
    const payments = await Payment.find({ bookingId: { $in: bookings.map((booking) => booking._id) } }).sort({ createdAt: -1 });

    return response.json({
      restaurant,
      payments: payments.map((payment) => shapeAdminPayment(payment, bookingById.get(String(payment.bookingId)), restaurant)),
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/payments/restaurant/:restaurantId/payout", async (request, response, next) => {
  try {
    const restaurant = await Restaurant.findById(request.params.restaurantId).select("name location");
    if (!restaurant) return response.status(404).json({ message: "Restaurant not found" });

    const bookings = await Booking.find({ restaurantId: restaurant._id }).select("restaurantId restaurantName city customerName customerEmail customerPhone date time");
    const bookingIds = bookings.map((booking) => booking._id);
    await Payment.updateMany(
      { bookingId: { $in: bookingIds }, payoutStatus: { $ne: "paid" } },
      { payoutStatus: "paid", payoutAt: new Date() },
    );

    const bookingById = new Map(bookings.map((booking) => [String(booking._id), booking]));
    const payments = await Payment.find({ bookingId: { $in: bookingIds } }).sort({ createdAt: -1 });

    return response.json({
      restaurant,
      payments: payments.map((payment) => shapeAdminPayment(payment, bookingById.get(String(payment.bookingId)), restaurant)),
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/payments/:id", async (request, response, next) => {
  try {
    const payment = await Payment.findById(request.params.id);
    if (!payment) return response.status(404).json({ message: "Payment not found" });

    const booking = await Booking.findById(payment.bookingId).select("restaurantId restaurantName city customerName customerEmail customerPhone date time");
    const restaurant = booking?.restaurantId ? await Restaurant.findById(booking.restaurantId).select("location") : null;
    return response.json(shapeAdminPayment(payment, booking, restaurant));
  } catch (error) {
    return next(error);
  }
});

router.patch("/payments/:id/payout", async (request, response, next) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      request.params.id,
      { payoutStatus: "paid", payoutAt: new Date() },
      { new: true },
    );

    if (!payment) return response.status(404).json({ message: "Payment not found" });

    const booking = await Booking.findById(payment.bookingId).select("restaurantId restaurantName city customerName customerEmail customerPhone date time");
    const restaurant = booking?.restaurantId ? await Restaurant.findById(booking.restaurantId).select("location") : null;
    return response.json(shapeAdminPayment(payment, booking, restaurant));
  } catch (error) {
    return next(error);
  }
});

router.get("/orders", async (_request, response, next) => {
  try {
    const [bookings, payments, menuItems] = await Promise.all([
      Booking.find().sort({ createdAt: -1 }),
      Payment.find().sort({ createdAt: -1 }),
      MenuItem.find().select("restaurantId restaurantName name price"),
    ]);
    return response.json(buildOrderRows(bookings, payments, menuItems));
  } catch (error) {
    return next(error);
  }
});

router.get("/tables", async (_request, response, next) => {
  try {
    const tables = await Table.find().populate("restaurantId", "name location").sort({ createdAt: -1 });
    return response.json(tables);
  } catch (error) {
    return next(error);
  }
});

router.patch("/tables/:id", tableValidators, async (request, response, next) => {
  try {
    if (!validateRequest(request, response)) return;
    const table = await Table.findByIdAndUpdate(request.params.id, request.body, { new: true });
    if (!table) return response.status(404).json({ message: "Table not found" });
    return response.json(table);
  } catch (error) {
    return next(error);
  }
});

router.post("/tables", tableValidators, async (request, response, next) => {
  try {
    if (!validateRequest(request, response)) return;
    const table = await Table.create(request.body);
    return response.status(201).json(table);
  } catch (error) {
    return next(error);
  }
});

router.delete("/tables/:id", async (request, response, next) => {
  try {
    const table = await Table.findByIdAndDelete(request.params.id);
    if (!table) return response.status(404).json({ message: "Table not found" });
    return response.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.get("/menu-items", async (_request, response, next) => {
  try {
    const menuItems = await MenuItem.find().populate("restaurantId", "name location").sort({ createdAt: -1 });
    return response.json(menuItems);
  } catch (error) {
    return next(error);
  }
});

router.post("/menu-items", menuValidators, async (request, response, next) => {
  try {
    if (!validateRequest(request, response)) return;
    const menuItem = await MenuItem.create(request.body);
    return response.status(201).json(menuItem);
  } catch (error) {
    return next(error);
  }
});

router.patch("/menu-items/:id", menuValidators, async (request, response, next) => {
  try {
    if (!validateRequest(request, response)) return;
    const menuItem = await MenuItem.findByIdAndUpdate(request.params.id, request.body, { new: true });
    if (!menuItem) return response.status(404).json({ message: "Menu item not found" });
    return response.json(menuItem);
  } catch (error) {
    return next(error);
  }
});

router.delete("/menu-items/:id", async (request, response, next) => {
  try {
    const menuItem = await MenuItem.findByIdAndDelete(request.params.id);
    if (!menuItem) return response.status(404).json({ message: "Menu item not found" });
    return response.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.get("/coupons", async (request, response, next) => {
  try {
    const coupons = await SpinCoupon.find().sort({ createdAt: -1 });
    return response.json(coupons);
  } catch (error) {
    return next(error);
  }
});

router.delete("/coupons/:id", async (request, response, next) => {
  try {
    const coupon = await SpinCoupon.findByIdAndDelete(request.params.id);
    if (!coupon) return response.status(404).json({ message: "Coupon not found" });
    return response.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.get("/reviews", async (_request, response, next) => {
  try {
    const [reviews, bookings] = await Promise.all([
      Feedback.find().sort({ createdAt: -1 }),
      Booking.find().select("restaurantId restaurantName customerName customerEmail customerPhone date time"),
    ]);
    const bookingById = new Map(bookings.map((booking) => [String(booking._id), booking]));
    return response.json(reviews.map((review) => shapeAdminFeedback(review, bookingById.get(String(review.bookingId)))));
  } catch (error) {
    return next(error);
  }
});

router.delete("/reviews/:id", async (request, response, next) => {
  try {
    const review = await Feedback.findByIdAndDelete(request.params.id);
    if (!review) return response.status(404).json({ message: "Review not found" });
    return response.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.get("/notifications", async (_request, response, next) => {
  try {
    const [notifications, bookings] = await Promise.all([
      Notification.find().sort({ createdAt: -1 }),
      Booking.find().select("restaurantId restaurantName customerName customerEmail customerPhone date time"),
    ]);
    const bookingById = new Map(bookings.map((booking) => [String(booking._id), booking]));
    return response.json(notifications.map((notification) => shapeAdminNotification(notification, bookingById.get(String(notification.bookingId)))));
  } catch (error) {
    return next(error);
  }
});

router.delete("/notifications/:id", async (request, response, next) => {
  try {
    const notification = await Notification.findByIdAndDelete(request.params.id);
    if (!notification) return response.status(404).json({ message: "Notification not found" });
    return response.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.get("/waitlist", async (_request, response, next) => {
  try {
    const entries = await Waitlist.find()
      .populate("restaurantId", "name location")
      .populate("bookingId", "restaurantName customerName customerEmail customerPhone date time status")
      .populate("vendorId", "name businessName email")
      .sort({ date: 1, time: 1, position: 1 })
      .lean();

    return response.json(entries.map((entry) => ({
      ...entry,
      restaurantName: entry.restaurantId?.name ?? entry.bookingId?.restaurantName ?? "",
      restaurantLocation: entry.restaurantId?.location ?? "",
      vendorName: entry.vendorId?.businessName || entry.vendorId?.name || "",
      vendorEmail: entry.vendorId?.email ?? "",
    })));
  } catch (error) {
    return next(error);
  }
});

router.patch("/waitlist/:id", waitlistValidators, async (request, response, next) => {
  try {
    if (!validateRequest(request, response)) return;
    const entry = await Waitlist.findByIdAndUpdate(request.params.id, request.body, { new: true })
      .populate("restaurantId", "name location")
      .populate("bookingId", "restaurantName customerName customerEmail customerPhone date time status")
      .populate("vendorId", "name businessName email")
      .lean();
    if (!entry) return response.status(404).json({ message: "Waitlist entry not found" });

    return response.json({
      ...entry,
      restaurantName: entry.restaurantId?.name ?? entry.bookingId?.restaurantName ?? "",
      restaurantLocation: entry.restaurantId?.location ?? "",
      vendorName: entry.vendorId?.businessName || entry.vendorId?.name || "",
      vendorEmail: entry.vendorId?.email ?? "",
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/waitlist/:id", async (request, response, next) => {
  try {
    const entry = await Waitlist.findByIdAndDelete(request.params.id);
    if (!entry) return response.status(404).json({ message: "Waitlist entry not found" });
    return response.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.get("/deals", async (_request, response, next) => {
  try {
    const deals = await AdminDeal.find().sort({ createdAt: -1 });
    return response.json(deals);
  } catch (error) {
    return next(error);
  }
});

router.post("/deals", adminDealValidators, async (request, response, next) => {
  try {
    if (!validateRequest(request, response)) return;
    const deal = await AdminDeal.create({
      audience: request.body.audience,
      title: request.body.title,
      description: request.body.description || "",
      code: request.body.code || "",
      discount: Number(request.body.discount || 0),
      minOrder: Number(request.body.minOrder || 0),
      validUntil: request.body.validUntil || "",
      isActive: request.body.isActive ?? true,
    });
    return response.status(201).json(deal);
  } catch (error) {
    return next(error);
  }
});

router.patch("/deals/:id", adminDealUpdateValidators, async (request, response, next) => {
  try {
    if (!validateRequest(request, response)) return;
    const payload = {
      ...request.body,
    };
    if (payload.discount !== undefined) payload.discount = Number(payload.discount || 0);
    if (payload.minOrder !== undefined) payload.minOrder = Number(payload.minOrder || 0);
    const deal = await AdminDeal.findByIdAndUpdate(request.params.id, payload, { new: true });
    if (!deal) return response.status(404).json({ message: "Deal not found" });
    return response.json(deal);
  } catch (error) {
    return next(error);
  }
});

router.delete("/deals/:id", async (request, response, next) => {
  try {
    const deal = await AdminDeal.findByIdAndDelete(request.params.id);
    if (!deal) return response.status(404).json({ message: "Deal not found" });
    return response.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.get("/events", async (_request, response, next) => {
  try {
    const events = await EventBooking.find().sort({ createdAt: -1 });
    return response.json(events);
  } catch (error) {
    return next(error);
  }
});

export default router;
