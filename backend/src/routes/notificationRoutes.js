import { Router } from "express";
import { body, validationResult } from "express-validator";
import { Notification } from "../models/Notification.js";
import { requireAuth } from "../middlewares/auth.js";
import { buildBookingNotification, sendNotification } from "../utils/notify.js";

const router = Router();

router.get("/", requireAuth, async (request, response, next) => {
  try {
    const notifications = await Notification.find({ userId: String(request.user.id) })
      .populate("bookingId", "restaurantName city date time tableId status")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return response.json(notifications);
  } catch (error) {
    return next(error);
  }
});

router.post(
  "/",
  requireAuth,
  [
    body("bookingId").notEmpty().withMessage("bookingId is required"),
    body("channels").optional().isArray({ min: 1 }).withMessage("channels must be a non-empty array"),
    body("message").optional().isString(),
    body("email").optional().isEmail().withMessage("email must be valid"),
    body("phone").optional().isString(),
  ],
  async (request, response, next) => {
    try {
      const errors = validationResult(request);
      if (!errors.isEmpty()) {
        return response.status(400).json({ errors: errors.array() });
      }

      const notification = await Notification.create({
        userId: request.user.id,
        ...request.body,
        status: "queued",
      });

      const template = buildBookingNotification({
        restaurantName: request.body.restaurantName ?? "your restaurant",
        city: request.body.city ?? "your city",
        date: request.body.date ?? "",
        time: request.body.time ?? "",
        tableId: request.body.tableId ?? "",
        total: request.body.total ?? request.body.amount ?? null,
        bookingId: request.body.bookingId ?? notification.bookingId,
      });

      try {
        await sendNotification({
          email: request.body.email,
          phone: request.body.phone,
          subject: request.body.subject ?? template.subject,
          message: request.body.message ?? template.message,
          channels: request.body.channels,
        });
      } catch (error) {
        notification.status = "failed";
        await notification.save();
        return response.status(502).json({
          message: error.message || "Notification delivery failed",
          notification,
        });
      }

      notification.status = "sent";
      await notification.save();

      return response.status(201).json(notification);
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
