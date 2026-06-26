import { Router } from "express";
import { Booking } from "../models/Booking.js";
import { Invoice } from "../models/Invoice.js";
import { LoyaltyAccount } from "../models/LoyaltyAccount.js";
import { Payment } from "../models/Payment.js";
import { User } from "../models/User.js";
import { requireAuth } from "../middlewares/auth.js";
import {
  createWaitlistEntry,
  findAvailableTableAssignment,
  normalizeGuestCount,
  notifyBookingUpdate,
  promoteNextWaitlist,
  resolveRestaurant,
  syncTableStatusesForBooking,
} from "../utils/bookingEngine.js";
import { buildBookingNotification } from "../utils/notify.js";
import { findMemoryUserById } from "../utils/memoryStore.js";
import { isDatabaseReady } from "../config/database.js";

const router = Router();

router.get("/stats/public", async (_request, response, next) => {
  try {
    if (!isDatabaseReady()) {
      return response.json({ bookings: 0 });
    }

    const bookings = await Booking.countDocuments();
    return response.json({ bookings });
  } catch (error) {
    return next(error);
  }
});

function createInvoiceNumber() {
  return `INV${Date.now()}`;
}

function validateBookingDate(dateValue) {
  const bookingDate = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(bookingDate.getTime())) {
    const error = new Error("Booking date is invalid");
    error.statusCode = 400;
    throw error;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);

  if (bookingDate < today) {
    const error = new Error("Booking date cannot be in the past");
    error.statusCode = 400;
    throw error;
  }

  if (bookingDate > maxDate) {
    const error = new Error("Pre-booking beyond 30 days is not allowed");
    error.statusCode = 400;
    throw error;
  }
}

function buildStatusMessage(status, restaurantName) {
  if (status === "waitlist") return `No table is free right now. You have been added to the waitlist for ${restaurantName}.`;
  if (status === "pending") return `Your booking request for ${restaurantName} is pending confirmation.`;
  if (status === "cancelled") return `Your booking for ${restaurantName} has been cancelled.`;
  if (status === "checked_in") return `You are checked in at ${restaurantName}.`;
  return `Your booking for ${restaurantName} is confirmed.`;
}

async function resolveCurrentUser(request) {
  const memoryUser = (() => {
    if (!request.user?.id) return null;
    if (typeof request.user.id === "string" && request.user.id.startsWith("mem-user-")) {
      return findMemoryUserById(request.user.id);
    }
    return null;
  })();

  if (memoryUser) return memoryUser;
  if (request.user?.id) {
    const userById = await User.findById(request.user.id).catch(() => null);
    if (userById) return userById;
  }
  if (request.user?.email) {
    const userByEmail = await User.findOne({ email: request.user.email }).catch(() => null);
    if (userByEmail) return userByEmail;
  }
  return null;
}

async function createManagedBooking({
  user,
  payload,
  statusOverride,
  recurringGroupId,
}) {
  validateBookingDate(payload.date);
  const restaurant = await resolveRestaurant(payload);
  if (restaurant.isActive === false) {
    const error = new Error(`${restaurant.name} is currently offline and not accepting bookings`);
    error.statusCode = 409;
    throw error;
  }
  const guestCount = normalizeGuestCount(payload.guests);
  const preferredTableIds = String(payload.tableGroup ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const assignment = await findAvailableTableAssignment({
    restaurantId: restaurant._id,
    date: payload.date,
    time: payload.time,
    guests: guestCount,
    preferredTableId: payload.tableId,
    preferredTableIds,
    preferredType: payload.tableType,
    combineTables: Boolean(payload.combineTables || payload.splitTableBooking || guestCount > 6),
  });

  const paymentStatus = payload.payment?.status ?? payload.paymentStatus ?? "pending";
  const baseStatus = statusOverride ?? (paymentStatus === "paid" ? "confirmed" : "pending");
  const finalStatus = assignment ? baseStatus : "waitlist";
  const assignedTables = assignment?.assignedTables ?? (payload.tableId ? [payload.tableId] : []);

  const booking = await Booking.create({
    userId: String(user?._id ?? user?.id ?? payload.userId ?? "anonymous"),
    restaurantId: restaurant._id,
    restaurantName: payload.restaurantName || restaurant.name,
    city: payload.city || restaurant.location,
    customerName: payload.customerName || user?.name || "",
    customerEmail: payload.customerEmail || user?.email || "",
    customerPhone: payload.customerPhone || user?.phone || "",
    tableId: assignment?.tableId ?? payload.tableId ?? "WAITLIST",
    tableType: assignment?.tableType ?? payload.tableType ?? "Any",
    splitTableBooking: Boolean(assignment?.splitTableBooking),
    linkedTableIds: assignedTables,
    assignedTables,
    guests: String(payload.guests ?? guestCount),
    date: payload.date,
    time: payload.time,
    slot: payload.slot ?? "dinner",
    qrCode: `QR-${Date.now()}`,
    checkInStatus: payload.checkInStatus ?? "pending",
    bookingMode: payload.bookingMode ?? "standard",
    notes: payload.notes,
    recurringGroupId,
    lastMinuteDiscount: Number(payload.lastMinuteDiscount ?? 0),
    items: Array.isArray(payload.items) ? payload.items : [],
    status: finalStatus,
  });

  if (finalStatus === "waitlist") {
    const waitlist = await createWaitlistEntry({ booking, restaurant, user });
    booking.waitlistPosition = waitlist.position;
    await booking.save();
  } else {
    await syncTableStatusesForBooking(booking, finalStatus);
  }

  const notificationContent = buildBookingNotification({
    restaurantName: booking.restaurantName,
    city: booking.city,
    date: booking.date,
    time: booking.time,
    tableId: booking.tableId,
    total: payload.payment?.amount,
    bookingId: booking._id,
  });

  await notifyBookingUpdate({
    booking,
    subject: notificationContent.subject,
    message: payload.notifications?.message ?? `${buildStatusMessage(finalStatus, booking.restaurantName)}\n${notificationContent.message}`,
    channels: payload.notifications?.channels ?? ["text", "email"],
  });

  return { booking, restaurant, waitlisted: finalStatus === "waitlist" };
}

router.get("/", requireAuth, async (request, response, next) => {
  try {
    const bookings = await Booking.find({ userId: String(request.user.id) }).sort({ createdAt: -1 });
    return response.json(bookings);
  } catch (error) {
    return next(error);
  }
});

router.post("/", requireAuth, async (request, response, next) => {
  try {
    const user = await resolveCurrentUser(request);
    const { booking } = await createManagedBooking({
      user,
      payload: {
        ...request.body,
        customerName: request.body.customerName ?? user?.name ?? "",
        customerEmail: request.body.customerEmail ?? user?.email ?? "",
        customerPhone: request.body.customerPhone ?? user?.phone ?? "",
      },
    });
    return response.status(201).json(booking);
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id/confirm", requireAuth, async (request, response, next) => {
  try {
    const booking = await Booking.findOne({ _id: request.params.id, userId: String(request.user.id) });
    if (!booking) return response.status(404).json({ message: "Booking not found" });

    booking.status = "confirmed";
    await booking.save();
    await syncTableStatusesForBooking(booking, booking.status);
    return response.json(booking);
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id/cancel", requireAuth, async (request, response, next) => {
  try {
    const booking = await Booking.findOne({ _id: request.params.id, userId: String(request.user.id) });
    if (!booking) return response.status(404).json({ message: "Booking not found" });

    booking.status = "cancelled";
    await booking.save();
    await syncTableStatusesForBooking(booking, booking.status);

    await notifyBookingUpdate({
      booking,
      subject: `RestorantBooking booking cancelled for ${booking.restaurantName}`,
      message: buildStatusMessage("cancelled", booking.restaurantName),
    });

    await promoteNextWaitlist({
      restaurantId: booking.restaurantId,
      date: booking.date,
      time: booking.time,
    });

    return response.json(booking);
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id/checkout", requireAuth, async (request, response, next) => {
  try {
    const booking = await Booking.findOne({ _id: request.params.id, userId: String(request.user.id) });
    if (!booking) return response.status(404).json({ message: "Booking not found" });

    booking.status = "completed";
    await booking.save();
    await syncTableStatusesForBooking(booking, booking.status);
    return response.json(booking);
  } catch (error) {
    return next(error);
  }
});

router.post("/confirm", requireAuth, async (request, response, next) => {
  try {
    const user = await resolveCurrentUser(request);
    if (!user) {
      return response.status(404).json({ message: "User not found" });
    }

    const primary = await createManagedBooking({
      user,
      payload: request.body,
    });

    const paymentRecord = await Payment.create({
      bookingId: primary.booking._id,
      userId: String(user._id),
      provider: request.body.payment?.provider ?? "razorpay",
      amount: request.body.payment?.amount ?? request.body.invoice?.total ?? 0,
      status: request.body.payment?.status ?? "paid",
      method: request.body.payment?.method ?? "Razorpay",
      transactionId: request.body.payment?.transactionId ?? `TXN-${Date.now()}`,
    });

    const invoiceRecord = await Invoice.create({
      bookingId: primary.booking._id,
      userId: String(user._id),
      invoiceNo: request.body.invoice?.invoiceNo ?? createInvoiceNumber(),
      subtotal: request.body.invoice?.subtotal ?? 0,
      gst: request.body.invoice?.gst ?? 0,
      total: request.body.invoice?.total ?? 0,
      status: "generated",
    });

    const earnedPoints = Math.max(10, Math.floor((Number(request.body.payment?.amount ?? request.body.invoice?.total ?? 0) || 0) / 50));
    const loyaltyAccount = await LoyaltyAccount.findOneAndUpdate(
      { userId: String(user._id) },
      {
        $inc: { points: earnedPoints, lifetimeSpent: Number(request.body.payment?.amount ?? request.body.invoice?.total ?? 0) || 0 },
        $setOnInsert: { tier: "Bronze" },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    if (loyaltyAccount.points >= 2000) loyaltyAccount.tier = "Platinum";
    else if (loyaltyAccount.points >= 1000) loyaltyAccount.tier = "Gold";
    else if (loyaltyAccount.points >= 500) loyaltyAccount.tier = "Silver";
    await loyaltyAccount.save();

    return response.status(201).json({
      booking: primary.booking,
      payment: paymentRecord,
      invoice: invoiceRecord,
      loyalty: loyaltyAccount,
      recurring: [],
      recurringEntries: [],
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone },
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
