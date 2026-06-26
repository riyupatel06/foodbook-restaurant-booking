import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../src/app.js";
import { Booking } from "../src/models/Booking.js";
import { Invoice } from "../src/models/Invoice.js";
import { LoyaltyAccount } from "../src/models/LoyaltyAccount.js";
import { Notification } from "../src/models/Notification.js";
import { Payment } from "../src/models/Payment.js";
import { Restaurant } from "../src/models/Restaurant.js";
import { Table } from "../src/models/Table.js";
import { User } from "../src/models/User.js";
import { Vendor } from "../src/vendor/models/Vendor.js";
import { Waitlist } from "../src/vendor/models/Waitlist.js";
import { memoryUsers } from "../src/utils/memoryStore.js";

const originalFindOne = User.findOne;
const originalCreate = User.create;
const originalBookingFind = Booking.find;
const originalBookingFindOne = Booking.findOne;
const originalBookingCreate = Booking.create;
const originalInvoiceCreate = Invoice.create;
const originalLoyaltyFindOneAndUpdate = LoyaltyAccount.findOneAndUpdate;
const originalVendorFindOne = Vendor.findOne;
const originalVendorCreate = Vendor.create;
const originalVendorFindById = Vendor.findById;
const originalNotificationCreate = Notification.create;
const originalPaymentFindOne = Payment.findOne;
const originalPaymentCreate = Payment.create;
const originalRestaurantFindById = Restaurant.findById;
const originalRestaurantFindOne = Restaurant.findOne;
const originalRestaurantCreate = Restaurant.create;
const originalTableFind = Table.find;
const originalTableUpdateMany = Table.updateMany;
const originalWaitlistFindOne = Waitlist.findOne;

function resetEnv() {
  process.env.JWT_SECRET = "test-secret";
  process.env.ADMIN_EMAIL = "admin@foodbook.app";
  process.env.ADMIN_PASSWORD = "Admin@123";
}

function restoreUserModel() {
  User.findOne = originalFindOne;
  User.create = originalCreate;
}

function restoreVendorModel() {
  Vendor.findOne = originalVendorFindOne;
  Vendor.create = originalVendorCreate;
  Vendor.findById = originalVendorFindById;
}

function restoreBookingModel() {
  Booking.find = originalBookingFind;
  Booking.findOne = originalBookingFindOne;
  Booking.create = originalBookingCreate;
}

function restoreInvoiceModel() {
  Invoice.create = originalInvoiceCreate;
}

function restoreLoyaltyModel() {
  LoyaltyAccount.findOneAndUpdate = originalLoyaltyFindOneAndUpdate;
}

function restoreNotificationModel() {
  Notification.create = originalNotificationCreate;
}

function restorePaymentModel() {
  Payment.findOne = originalPaymentFindOne;
  Payment.create = originalPaymentCreate;
}

function restoreRestaurantModel() {
  Restaurant.findById = originalRestaurantFindById;
  Restaurant.findOne = originalRestaurantFindOne;
  Restaurant.create = originalRestaurantCreate;
}

function restoreTableModel() {
  Table.find = originalTableFind;
  Table.updateMany = originalTableUpdateMany;
}

function restoreWaitlistModel() {
  Waitlist.findOne = originalWaitlistFindOne;
}

test.beforeEach(() => {
  memoryUsers.clear();
  restoreUserModel();
  restoreVendorModel();
  restoreBookingModel();
  restoreInvoiceModel();
  restoreLoyaltyModel();
  restoreNotificationModel();
  restorePaymentModel();
  restoreRestaurantModel();
  restoreTableModel();
  restoreWaitlistModel();
  resetEnv();
});

test.after(() => {
  restoreUserModel();
  restoreVendorModel();
  restoreBookingModel();
  restoreInvoiceModel();
  restoreLoyaltyModel();
  restoreNotificationModel();
  restorePaymentModel();
  restoreRestaurantModel();
  restoreTableModel();
  restoreWaitlistModel();
  memoryUsers.clear();
});

test("registers a customer with memory fallback and returns a token", async () => {
  const response = await request(app).post("/api/auth/register").send({
    name: "Riya Patel",
    email: "riya@example.com",
    phone: "9876543210",
    password: "Riya@1234",
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.user.email, "riya@example.com");
  assert.ok(response.body.token);
  assert.equal(memoryUsers.size, 1);
});

test("logs in a previously registered customer through memory fallback", async () => {
  await request(app).post("/api/auth/register").send({
    name: "Riya Patel",
    email: "riya@example.com",
    phone: "9876543210",
    password: "Riya@1234",
  });

  const response = await request(app).post("/api/auth/login").send({
    email: "riya@example.com",
    password: "Riya@1234",
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.user.name, "Riya Patel");
  assert.ok(response.body.token);
});

test("rejects invalid customer password", async () => {
  await request(app).post("/api/auth/register").send({
    name: "Riya Patel",
    email: "riya@example.com",
    phone: "9876543210",
    password: "Riya@1234",
  });

  const response = await request(app).post("/api/auth/login").send({
    email: "riya@example.com",
    password: "Wrong@1234",
  });

  assert.equal(response.status, 401);
  assert.equal(response.body.message, "Invalid credentials");
});

test("allows admin login using environment credentials", async () => {
  User.findOne = async () => null;
  User.create = async (payload) => ({ _id: "admin-1", ...payload });

  const response = await request(app).post("/api/admin/login").send({
    email: "admin@foodbook.app",
    password: "Admin@123",
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.admin.email, "admin@foodbook.app");
  assert.equal(response.body.admin.role, "admin");
  assert.ok(response.body.token);
});

test("rejects admin login when environment credentials do not match", async () => {
  const response = await request(app).post("/api/admin/login").send({
    email: "admin@foodbook.app",
    password: "Wrong@1234",
  });

  assert.equal(response.status, 401);
  assert.equal(response.body.message, "Invalid admin credentials");
});

test("rejects protected admin routes without token", async () => {
  const response = await request(app).get("/api/admin/dashboard");

  assert.equal(response.status, 401);
  assert.equal(response.body.message, "Missing authorization token");
});

test("rejects protected admin routes for non-admin tokens", async () => {
  const token = jwt.sign({ id: "user-1", role: "user" }, process.env.JWT_SECRET, { expiresIn: "1h" });

  const response = await request(app)
    .get("/api/admin/dashboard")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(response.status, 403);
  assert.equal(response.body.message, "Admin access required");
});

test("registers a vendor and returns a vendor token", async () => {
  Vendor.findOne = async () => null;
  Vendor.create = async (payload) => ({ _id: "vendor-1", role: "vendor", ...payload });

  const response = await request(app).post("/api/vendor/register").send({
    name: "Aarav Shah",
    businessName: "Spice Garden Hospitality",
    email: "vendor@example.com",
    phone: "9876543210",
    password: "Vendor@1234",
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.vendor.email, "vendor@example.com");
  assert.equal(response.body.vendor.businessName, "Spice Garden Hospitality");
  assert.ok(response.body.token);
});

test("logs in a vendor with valid credentials", async () => {
  const passwordHash = await bcrypt.hash("Vendor@1234", 10);
  Vendor.findOne = async () => ({
    _id: "vendor-1",
    name: "Aarav Shah",
    email: "vendor@example.com",
    phone: "9876543210",
    businessName: "Spice Garden Hospitality",
    passwordHash,
  });

  const response = await request(app).post("/api/vendor/login").send({
    email: "vendor@example.com",
    password: "Vendor@1234",
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.vendor.email, "vendor@example.com");
  assert.ok(response.body.token);
});

test("rejects protected vendor routes for non-vendor tokens", async () => {
  const token = jwt.sign({ id: "user-1", role: "user" }, process.env.JWT_SECRET, { expiresIn: "1h" });

  const response = await request(app)
    .get("/api/vendor/me")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(response.status, 403);
  assert.equal(response.body.message, "Vendor access required");
});

test("returns vendor profile for a valid vendor token", async () => {
  const token = jwt.sign({ id: "vendor-1", role: "vendor" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  Vendor.findById = async () => ({
    _id: "vendor-1",
    name: "Aarav Shah",
    email: "vendor@example.com",
    phone: "9876543210",
    businessName: "Spice Garden Hospitality",
  });

  const response = await request(app)
    .get("/api/vendor/me")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.email, "vendor@example.com");
  assert.equal(response.body.businessName, "Spice Garden Hospitality");
});

test("rejects booking list requests without a customer token", async () => {
  const response = await request(app).get("/api/bookings");

  assert.equal(response.status, 401);
  assert.equal(response.body.message, "Missing authorization token");
});

test("returns customer bookings scoped to the authenticated user", async () => {
  const token = jwt.sign({ id: "mem-user-1", email: "riya@example.com", role: "user" }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  Booking.find = () => ({
    sort: async () => [
      {
        _id: "booking-1",
        userId: "mem-user-1",
        restaurantName: "Spice Garden",
        date: "2026-06-25",
        time: "20:00",
        status: "confirmed",
      },
    ],
  });

  const response = await request(app)
    .get("/api/bookings")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.length, 1);
  assert.equal(response.body[0].restaurantName, "Spice Garden");
});

test("creates a payment for the authenticated user's booking and confirms pending booking", async () => {
  const token = jwt.sign({ id: "mem-user-1", email: "riya@example.com", role: "user" }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  const booking = {
    _id: "booking-1",
    userId: "mem-user-1",
    status: "pending",
    restaurantId: "restaurant-1",
    tableId: "T1",
    save: async function save() {
      return this;
    },
  };

  Booking.findOne = async () => booking;
  Payment.findOne = async () => null;
  Payment.create = async (payload) => ({ _id: "payment-1", ...payload });
  Table.updateMany = async () => ({ acknowledged: true, modifiedCount: 1 });

  const response = await request(app)
    .post("/api/payments")
    .set("Authorization", `Bearer ${token}`)
    .send({
      bookingId: "booking-1",
      amount: 1499,
      transactionId: "txn-1",
      status: "paid",
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.transactionId, "txn-1");
  assert.equal(response.body.amount, 1499);
  assert.equal(booking.status, "confirmed");
});

test("returns existing payment for duplicate transaction id", async () => {
  const token = jwt.sign({ id: "mem-user-1", email: "riya@example.com", role: "user" }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  Booking.findOne = async () => ({
    _id: "booking-1",
    userId: "mem-user-1",
    status: "pending",
  });
  Payment.findOne = async () => ({
    _id: "payment-1",
    bookingId: "booking-1",
    transactionId: "txn-dup",
    amount: 1499,
    status: "paid",
  });

  const response = await request(app)
    .post("/api/payments")
    .set("Authorization", `Bearer ${token}`)
    .send({
      bookingId: "booking-1",
      amount: 1499,
      transactionId: "txn-dup",
      status: "paid",
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.transactionId, "txn-dup");
});

test("stores notification as sent for in-app delivery when no external channel is configured", async () => {
  const token = jwt.sign({ id: "mem-user-1", email: "riya@example.com", role: "user" }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  const notification = {
    _id: "notification-1",
    bookingId: "booking-1",
    userId: "mem-user-1",
    status: "queued",
    save: async function save() {
      return this;
    },
  };

  Notification.create = async (payload) => Object.assign(notification, payload);

  const response = await request(app)
    .post("/api/notifications")
    .set("Authorization", `Bearer ${token}`)
    .send({
      bookingId: "booking-1",
      channels: ["email"],
      email: "riya@example.com",
      restaurantName: "Spice Garden",
      city: "Ahmedabad",
      date: "2026-06-25",
      time: "20:00",
      tableId: "T1",
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.status, "sent");
});

test("confirms a booking for the authenticated customer", async () => {
  const token = jwt.sign({ id: "mem-user-1", email: "riya@example.com", role: "user" }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  const booking = {
    _id: "booking-1",
    userId: "mem-user-1",
    status: "pending",
    restaurantId: "restaurant-1",
    tableId: "T1",
    save: async function save() {
      return this;
    },
  };

  Booking.findOne = async () => booking;
  Table.updateMany = async () => ({ acknowledged: true, modifiedCount: 1 });

  const response = await request(app)
    .patch("/api/bookings/booking-1/confirm")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "confirmed");
  assert.equal(booking.status, "confirmed");
});

test("cancels a booking for the authenticated customer", async () => {
  const token = jwt.sign({ id: "mem-user-1", email: "riya@example.com", role: "user" }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  const booking = {
    _id: "booking-2",
    userId: "mem-user-1",
    status: "confirmed",
    restaurantId: "restaurant-1",
    restaurantName: "Spice Garden",
    tableId: "T2",
    date: "2026-06-25",
    time: "20:00",
    customerEmail: "riya@example.com",
    customerPhone: "9876543210",
    save: async function save() {
      return this;
    },
  };
  const notification = {
    _id: "notification-cancel",
    status: "queued",
    save: async function save() {
      return this;
    },
  };

  Booking.findOne = async () => booking;
  Notification.create = async () => notification;
  Table.updateMany = async () => ({ acknowledged: true, modifiedCount: 1 });
  Waitlist.findOne = () => ({
    sort: async () => null,
  });

  const response = await request(app)
    .patch("/api/bookings/booking-2/cancel")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "cancelled");
  assert.equal(booking.status, "cancelled");
});

test("marks a booking completed on checkout", async () => {
  const token = jwt.sign({ id: "mem-user-1", email: "riya@example.com", role: "user" }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  const booking = {
    _id: "booking-3",
    userId: "mem-user-1",
    status: "checked_in",
    restaurantId: "restaurant-1",
    tableId: "T3",
    save: async function save() {
      return this;
    },
  };

  Booking.findOne = async () => booking;
  Table.updateMany = async () => ({ acknowledged: true, modifiedCount: 1 });

  const response = await request(app)
    .patch("/api/bookings/booking-3/checkout")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "completed");
  assert.equal(booking.status, "completed");
});

test("creates a confirmed booking with payment, invoice, and loyalty updates", async () => {
  const token = jwt.sign({ id: "mem-user-confirm", email: "riya@example.com", role: "user" }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  memoryUsers.set("riya@example.com", {
    _id: "mem-user-confirm",
    name: "Riya Patel",
    email: "riya@example.com",
    phone: "9876543210",
    passwordHash: "hash",
    role: "user",
  });

  const restaurant = {
    _id: "restaurant-1",
    name: "Spice Garden",
    location: "Ahmedabad",
  };
  const createdBooking = {
    _id: "booking-confirm-1",
    restaurantId: "restaurant-1",
    restaurantName: "Spice Garden",
    city: "Ahmedabad",
    tableId: "T1",
    customerEmail: "riya@example.com",
    customerPhone: "9876543210",
    status: "confirmed",
    date: "2026-06-25",
    time: "20:00",
    slot: "dinner",
    userId: "mem-user-confirm",
    save: async function save() {
      return this;
    },
  };
  const loyaltyAccount = {
    points: 40,
    tier: "Bronze",
    lifetimeSpent: 1499,
    save: async function save() {
      return this;
    },
  };
  const notification = {
    _id: "notification-booking-1",
    status: "queued",
    save: async function save() {
      return this;
    },
  };

  Restaurant.findById = async () => restaurant;
  Restaurant.findOne = async () => restaurant;
  Restaurant.create = async () => restaurant;
  Table.find = () => ({
    sort: async () => [
      {
        tableId: "T1",
        type: "Family",
        seats: 4,
        price: 500,
        status: "available",
      },
    ],
  });
  Booking.find = async () => [];
  Booking.create = async () => createdBooking;
  Payment.create = async (payload) => ({ _id: "payment-confirm-1", ...payload });
  Invoice.create = async (payload) => ({ _id: "invoice-confirm-1", ...payload });
  LoyaltyAccount.findOneAndUpdate = async () => loyaltyAccount;
  Notification.create = async () => notification;
  Table.updateMany = async () => ({ acknowledged: true, modifiedCount: 1 });

  const response = await request(app)
    .post("/api/bookings/confirm")
    .set("Authorization", `Bearer ${token}`)
    .send({
      restaurantId: "restaurant-1",
      restaurantName: "Spice Garden",
      city: "Ahmedabad",
      guests: "4",
      date: "2026-06-25",
      time: "20:00",
      slot: "dinner",
      tableType: "Family",
      payment: {
        provider: "razorpay",
        amount: 1499,
        status: "paid",
        method: "Razorpay",
        transactionId: "txn-confirm-1",
      },
      invoice: {
        subtotal: 1270,
        gst: 229,
        total: 1499,
      },
      recurring: {
        frequency: "none",
      },
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.booking._id, "booking-confirm-1");
  assert.equal(response.body.payment.transactionId, "txn-confirm-1");
  assert.equal(response.body.invoice.total, 1499);
  assert.equal(response.body.loyalty.points, 40);
  assert.deepEqual(response.body.recurring, []);
});

test("updates vendor booking status for an owned restaurant booking", async () => {
  const token = jwt.sign({ id: "vendor-1", role: "vendor" }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  const booking = {
    _id: "vendor-booking-1",
    restaurantId: "restaurant-1",
    status: "pending",
    time: "20:00",
    slot: "dinner",
    tableId: "T9",
    save: async function save() {
      return this;
    },
  };

  Restaurant.find = () => ({
    sort: async () => [{ _id: "restaurant-1" }],
  });
  Booking.findOne = async () => booking;
  Table.updateMany = async () => ({ acknowledged: true, modifiedCount: 1 });

  const response = await request(app)
    .patch("/api/vendor/bookings/vendor-booking-1/status")
    .set("Authorization", `Bearer ${token}`)
    .send({
      status: "confirmed",
      time: "20:30",
      slot: "dinner",
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "confirmed");
  assert.equal(response.body.time, "20:30");
  assert.equal(booking.status, "confirmed");
});

test("checks in a vendor booking with QR verification", async () => {
  const token = jwt.sign({ id: "vendor-1", role: "vendor" }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  const booking = {
    _id: "vendor-booking-2",
    restaurantId: "restaurant-1",
    status: "confirmed",
    checkInStatus: "pending",
    qrCode: "",
    tableId: "T10",
    save: async function save() {
      return this;
    },
  };

  Restaurant.find = () => ({
    sort: async () => [{ _id: "restaurant-1" }],
  });
  Booking.findOne = async () => booking;
  Table.updateMany = async () => ({ acknowledged: true, modifiedCount: 1 });

  const response = await request(app)
    .patch("/api/vendor/bookings/vendor-booking-2/check-in")
    .set("Authorization", `Bearer ${token}`)
    .send({
      checkInStatus: "verified",
      qrCode: "QR-vendor-booking-2",
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.checkInStatus, "verified");
  assert.equal(response.body.status, "checked_in");
  assert.equal(booking.qrCode, "QR-vendor-booking-2");
});

test("rejects payment creation with invalid amount", async () => {
  const token = jwt.sign({ id: "mem-user-1", email: "riya@example.com", role: "user" }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  const response = await request(app)
    .post("/api/payments")
    .set("Authorization", `Bearer ${token}`)
    .send({
      bookingId: "booking-invalid-payment",
      amount: 0,
      status: "paid",
    });

  assert.equal(response.status, 400);
  assert.ok(Array.isArray(response.body.errors));
});

test("rejects notification creation without bookingId", async () => {
  const token = jwt.sign({ id: "mem-user-1", email: "riya@example.com", role: "user" }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  const response = await request(app)
    .post("/api/notifications")
    .set("Authorization", `Bearer ${token}`)
    .send({
      channels: ["email"],
      email: "riya@example.com",
      restaurantName: "Spice Garden",
    });

  assert.equal(response.status, 400);
  assert.ok(Array.isArray(response.body.errors));
});

test("rejects vendor booking status update with invalid status", async () => {
  const token = jwt.sign({ id: "vendor-1", role: "vendor" }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  const response = await request(app)
    .patch("/api/vendor/bookings/vendor-booking-bad/status")
    .set("Authorization", `Bearer ${token}`)
    .send({
      status: "done-now",
    });

  assert.equal(response.status, 400);
  assert.ok(Array.isArray(response.body.errors));
});

test("rejects admin booking creation without restaurantId", async () => {
  const token = jwt.sign({ id: "admin-1", role: "admin" }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  const response = await request(app)
    .post("/api/admin/bookings")
    .set("Authorization", `Bearer ${token}`)
    .send({
      customerName: "Walk-in Guest",
      date: "2026-06-25",
      time: "20:00",
      status: "pending",
    });

  assert.equal(response.status, 400);
  assert.ok(Array.isArray(response.body.errors));
});
