import { Booking } from "../models/Booking.js";
import { Notification } from "../models/Notification.js";
import { RecurringBooking } from "../models/RecurringBooking.js";
import { Restaurant } from "../models/Restaurant.js";
import { Table } from "../models/Table.js";
import { isDatabaseReady } from "../config/database.js";
import { fallbackRestaurants, fallbackTables } from "./fallbackCatalog.js";
import { Waitlist } from "../vendor/models/Waitlist.js";
import { buildBookingNotification, sendNotification } from "./notify.js";

export const ACTIVE_BOOKING_STATUSES = ["pending", "confirmed", "checked_in"];

export function normalizeGuestCount(guests) {
  if (typeof guests === "number") return guests;
  const match = String(guests ?? "").match(/\d+/);
  return Math.max(1, Number(match?.[0] ?? 1));
}

export function extractAssignedTableIds(booking) {
  const direct = typeof booking?.tableId === "string"
    ? booking.tableId.split(",").map((item) => item.trim()).filter(Boolean)
    : [];
  const linked = Array.isArray(booking?.linkedTableIds) ? booking.linkedTableIds : [];
  const assigned = Array.isArray(booking?.assignedTables) ? booking.assignedTables : [];
  return [...new Set([...assigned, ...linked, ...direct])];
}

export function getCrowdLabel(occupancyRate) {
  if (occupancyRate <= 30) return "Low Crowd";
  if (occupancyRate <= 70) return "Moderate";
  return "Busy";
}

export function parseDateTime(date, time) {
  if (!date || !time) return null;
  if (/am|pm/i.test(time)) {
    return new Date(`${date} ${time}`);
  }
  return new Date(`${date}T${time}:00`);
}

export function buildRecurringDates(date, frequency, endsOn) {
  if (!date || !frequency || frequency === "none" || !endsOn) return [];

  const results = [];
  let current = parseDateTime(date, "00:00");
  const end = parseDateTime(endsOn, "23:59");
  if (!current || !end || Number.isNaN(current.getTime()) || Number.isNaN(end.getTime())) return [];

  while (true) {
    if (frequency === "weekly") current.setDate(current.getDate() + 7);
    else current.setMonth(current.getMonth() + 1);

    if (current > end) break;
    results.push(current.toISOString().slice(0, 10));
  }

  return results;
}

export async function resolveRestaurant(payload) {
  if (!isDatabaseReady()) {
    const fallbackRestaurant =
      fallbackRestaurants.find((restaurant) => restaurant._id === payload.restaurantId) ??
      fallbackRestaurants.find(
        (restaurant) =>
          restaurant.name === payload.restaurantName &&
          (!payload.city || restaurant.location === payload.city),
      ) ??
      fallbackRestaurants[0];

    return (
      fallbackRestaurant ?? {
        _id: payload.restaurantId ?? "fallback-restaurant-runtime",
        name: payload.restaurantName || "RestorantBooking Restaurant",
        location: payload.city || "Ahmedabad",
        cuisine: payload.cuisine || "Multi Cuisine",
        vibe: payload.vibe || "Dining",
        rating: payload.rating || 4.5,
        description: payload.description || "Fallback restaurant booking entry.",
      }
    );
  }

  if (payload.restaurantId) {
    const restaurant = await Restaurant.findById(payload.restaurantId);
    if (restaurant) return restaurant;
  }

  const existing = await Restaurant.findOne({
    name: payload.restaurantName,
    location: payload.city,
  });
  if (existing) return existing;

  return Restaurant.create({
    name: payload.restaurantName || "RestorantBooking Restaurant",
    location: payload.city || "Ahmedabad",
    cuisine: payload.cuisine || "Multi Cuisine",
    vibe: payload.vibe || "Dining",
    rating: payload.rating || 4.5,
    description: payload.description || "Restaurant booking entry created from the RestorantBooking flow.",
  });
}

function sortTables(tables) {
  return [...tables].sort((a, b) => a.seats - b.seats || a.price - b.price || a.tableId.localeCompare(b.tableId));
}

function chooseSingleTable(tables, guests, preferredTableId, preferredType) {
  const filtered = sortTables(
    tables.filter((table) => {
      if (preferredType && preferredType !== "All" && table.type !== preferredType) return false;
      return table.seats >= guests;
    }),
  );

  if (preferredTableId) {
    const direct = filtered.find((table) => table.tableId === preferredTableId);
    if (direct) return direct;
  }

  return filtered[0] ?? null;
}

function chooseSplitTables(tables, guests, preferredTableIds = [], preferredType) {
  const candidates = sortTables(
    tables.filter((table) => {
      if (preferredType && preferredType !== "All" && table.type !== preferredType) return false;
      return true;
    }),
  );

  let best = null;

  function search(index, current, seats) {
    if (seats >= guests) {
      if (!best || seats < best.seats || (seats === best.seats && current.length < best.tables.length)) {
        best = { tables: [...current], seats };
      }
      return;
    }

    if (index >= candidates.length) return;
    if (best && seats >= best.seats) return;

    search(index + 1, [...current, candidates[index]], seats + candidates[index].seats);
    search(index + 1, current, seats);
  }

  if (preferredTableIds.length > 1) {
    const preferred = candidates.filter((table) => preferredTableIds.includes(table.tableId));
    const preferredSeats = preferred.reduce((sum, table) => sum + table.seats, 0);
    if (preferred.length === preferredTableIds.length && preferredSeats >= guests) {
      return preferred;
    }
  }

  search(0, [], 0);
  return best?.tables ?? null;
}

export async function findAvailableTableAssignment({
  restaurantId,
  date,
  time,
  guests,
  preferredTableId,
  preferredTableIds = [],
  preferredType,
  combineTables = false,
}) {
  if (!isDatabaseReady()) {
    const availableTables = fallbackTables.filter((table) => String(table.restaurantId?._id) === String(restaurantId));
    const guestCount = normalizeGuestCount(guests);
    const singleTable = chooseSingleTable(availableTables, guestCount, preferredTableId, preferredType);

    if (!singleTable) return null;

    return {
      splitTableBooking: false,
      assignedTables: [singleTable.tableId],
      tableId: singleTable.tableId,
      tableType: singleTable.type,
      seatsCovered: singleTable.seats,
    };
  }

  const [tables, activeBookings] = await Promise.all([
    Table.find({ restaurantId }).sort({ seats: 1, price: 1 }),
    Booking.find({
      restaurantId,
      date,
      time,
      status: { $in: ACTIVE_BOOKING_STATUSES },
    }),
  ]);

  const unavailable = new Set(activeBookings.flatMap((booking) => extractAssignedTableIds(booking)));
  const availableTables = tables.filter((table) => !unavailable.has(table.tableId) && table.status !== "maintenance");
  const guestCount = normalizeGuestCount(guests);
  const singleTable = chooseSingleTable(availableTables, guestCount, preferredTableId, preferredType);

  if (singleTable && !combineTables && preferredTableIds.length <= 1) {
    return {
      splitTableBooking: false,
      assignedTables: [singleTable.tableId],
      tableId: singleTable.tableId,
      tableType: singleTable.type,
      seatsCovered: singleTable.seats,
    };
  }

  if (singleTable && guestCount <= singleTable.seats && !combineTables) {
    return {
      splitTableBooking: false,
      assignedTables: [singleTable.tableId],
      tableId: singleTable.tableId,
      tableType: singleTable.type,
      seatsCovered: singleTable.seats,
    };
  }

  const splitTables = chooseSplitTables(availableTables, guestCount, preferredTableIds, preferredType);
  if (!splitTables) return null;

  return {
    splitTableBooking: splitTables.length > 1,
    assignedTables: splitTables.map((table) => table.tableId),
    tableId: splitTables.map((table) => table.tableId).join(", "),
    tableType: preferredType || "split-table",
    seatsCovered: splitTables.reduce((sum, table) => sum + table.seats, 0),
  };
}

export async function syncTableStatusesForBooking(booking, nextStatus) {
  const assignedTables = extractAssignedTableIds(booking);
  if (!assignedTables.length) return;

  const tableStatus =
    nextStatus === "checked_in"
      ? "occupied"
      : nextStatus === "pending" || nextStatus === "confirmed"
        ? "booked"
        : "available";

  await Table.updateMany(
    {
      restaurantId: booking.restaurantId,
      tableId: { $in: assignedTables },
    },
    { $set: { status: tableStatus } },
  );
}

export async function rebalanceWaitlistPositions(restaurantId, date, time) {
  const entries = await Waitlist.find({
    restaurantId,
    date,
    time,
    status: "waiting",
  }).sort({ createdAt: 1 });

  await Promise.all(
    entries.map(async (entry, index) => {
      const position = index + 1;
      if (entry.position !== position) {
        entry.position = position;
        entry.estimatedWait = `${position * 15} mins`;
        await entry.save();
      }

      if (entry.bookingId) {
        await Booking.findByIdAndUpdate(entry.bookingId, { waitlistPosition: position });
      }
    }),
  );
}

export async function createWaitlistEntry({ booking, restaurant, user }) {
  const currentPosition =
    (await Waitlist.countDocuments({
      restaurantId: restaurant._id,
      date: booking.date,
      time: booking.time,
      status: "waiting",
    })) + 1;

  const waitlist = await Waitlist.create({
    vendorId: restaurant.vendorId,
    restaurantId: restaurant._id,
    bookingId: booking._id,
    userId: String(user?.id ?? booking.userId ?? ""),
    name: booking.customerName || user?.name || "Guest",
    phone: booking.customerPhone || user?.phone || "",
    email: booking.customerEmail || user?.email || "",
    guests: normalizeGuestCount(booking.guests),
    position: currentPosition,
    date: booking.date,
    time: booking.time,
    slot: booking.slot || "dinner",
    tableType: booking.tableType,
    estimatedWait: `${currentPosition * 15} mins`,
    status: "waiting",
  });

  await Booking.findByIdAndUpdate(booking._id, { waitlistPosition: currentPosition });
  return waitlist;
}

export async function notifyBookingUpdate({
  booking,
  subject,
  message,
  channels = ["text", "email"],
}) {
  if (!booking?._id) return null;

  const notification = await Notification.create({
    userId: String(booking.userId),
    bookingId: booking._id,
    channels,
    status: "queued",
    message,
  });

  try {
    await sendNotification({
      email: booking.customerEmail,
      phone: booking.customerPhone,
      subject,
      message,
      channels,
    });
    notification.status = "sent";
    await notification.save();
  } catch {
    notification.status = "failed";
    await notification.save();
  }

  return notification;
}

export async function promoteNextWaitlist({ restaurantId, date, time }) {
  const nextEntry = await Waitlist.findOne({
    restaurantId,
    date,
    time,
    status: "waiting",
  }).sort({ position: 1, createdAt: 1 });

  if (!nextEntry?.bookingId) return null;

  const booking = await Booking.findById(nextEntry.bookingId);
  if (!booking) return null;

  const assignment = await findAvailableTableAssignment({
    restaurantId,
    date,
    time,
    guests: booking.guests,
    preferredType: booking.tableType,
    preferredTableIds: booking.linkedTableIds,
    combineTables: booking.splitTableBooking,
  });

  if (!assignment) return null;

  booking.status = "confirmed";
  booking.waitlistPosition = null;
  booking.tableId = assignment.tableId;
  booking.tableType = assignment.tableType;
  booking.splitTableBooking = assignment.splitTableBooking;
  booking.linkedTableIds = assignment.assignedTables;
  booking.assignedTables = assignment.assignedTables;
  booking.qrCode = booking.qrCode || `QR-${booking._id}`;
  await booking.save();
  await syncTableStatusesForBooking(booking, booking.status);

  nextEntry.status = "notified";
  await nextEntry.save();
  await rebalanceWaitlistPositions(restaurantId, date, time);

  const notificationContent = buildBookingNotification({
    restaurantName: booking.restaurantName,
    city: booking.city,
    date: booking.date,
    time: booking.time,
    tableId: booking.tableId,
    bookingId: booking._id,
  });

  await notifyBookingUpdate({
    booking,
    subject: notificationContent.subject,
    message: `A table is now available for you.\n${notificationContent.message}`,
  });

  return booking;
}

export async function computeRestaurantSlotInsights({ restaurantId, date, time }) {
  if (!isDatabaseReady()) {
    const tables = fallbackTables.filter((table) => String(table.restaurantId?._id) === String(restaurantId));
    const totalTables = tables.length;
    const occupiedTables = 0;
    const emptyTables = totalTables;
    const occupancyRate = 0;

    return {
      tables,
      totalTables,
      occupiedTables,
      emptyTables,
      occupancyRate,
      crowdLabel: getCrowdLabel(occupancyRate),
      lastMinuteDiscount: 0,
    };
  }

  const tables = await Table.find({ restaurantId }).sort({ seats: 1, price: 1 });
  const bookings = date && time
    ? await Booking.find({
      restaurantId,
      date,
      time,
      status: { $in: ACTIVE_BOOKING_STATUSES },
    })
    : [];

  const statusMap = new Map();
  bookings.forEach((booking) => {
    const derivedStatus = booking.status === "checked_in" ? "occupied" : "booked";
    extractAssignedTableIds(booking).forEach((tableId) => {
      if (statusMap.get(tableId) !== "occupied") {
        statusMap.set(tableId, derivedStatus);
      }
    });
  });

  const resolvedTables = tables.map((table) => ({
    ...table.toObject(),
    status: statusMap.get(table.tableId) || table.status || "available",
  }));
  const occupiedTables = resolvedTables.filter((table) => table.status === "booked" || table.status === "occupied").length;
  const totalTables = resolvedTables.length;
  const emptyTables = Math.max(0, totalTables - occupiedTables);
  const occupancyRate = totalTables ? Math.round((occupiedTables / totalTables) * 100) : 0;
  const crowdLabel = getCrowdLabel(occupancyRate);

  let lastMinuteDiscount = 0;
  if (date && time) {
    const now = new Date();
    const selectedSlot = parseDateTime(date, time);
    if (selectedSlot && !Number.isNaN(selectedSlot.getTime())) {
      const minutesUntilSlot = Math.round((selectedSlot.getTime() - now.getTime()) / 60000);
      const isSameDay = now.toISOString().slice(0, 10) === date;
      if (isSameDay && minutesUntilSlot >= 0 && minutesUntilSlot <= 30 && emptyTables > 3) {
        lastMinuteDiscount = 20;
      }
    }
  }

  return {
    tables: resolvedTables,
    totalTables,
    occupiedTables,
    emptyTables,
    occupancyRate,
    crowdLabel,
    lastMinuteDiscount,
  };
}

export async function createRecurringRecords({ booking, frequency, endsOn, groupId }) {
  const dates = buildRecurringDates(booking.date, frequency, endsOn);
  if (!dates.length) return [];

  const records = [];
  for (const nextRun of dates) {
    records.push(
      await RecurringBooking.create({
        userId: String(booking.userId),
        bookingId: booking._id,
        restaurantId: booking.restaurantId,
        frequency,
        nextRun,
        groupId,
        totalOccurrences: dates.length + 1,
        active: true,
      }),
    );
  }
  return records;
}
