import { Router } from "express";
import { body, validationResult } from "express-validator";
import { Booking } from "../models/Booking.js";
import { Payment } from "../models/Payment.js";
import { requireAuth } from "../middlewares/auth.js";
import { syncTableStatusesForBooking } from "../utils/bookingEngine.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  [
    body("bookingId").notEmpty().withMessage("bookingId is required"),
    body("amount").isFloat({ gt: 0 }).withMessage("amount must be greater than 0"),
    body("status").optional().isIn(["pending", "paid", "failed"]).withMessage("status is invalid"),
    body("provider").optional().isString(),
    body("method").optional().isString(),
    body("transactionId").optional().isString(),
  ],
  async (request, response, next) => {
    try {
      const errors = validationResult(request);
      if (!errors.isEmpty()) {
        return response.status(400).json({ errors: errors.array() });
      }

      const booking = await Booking.findOne({
        _id: request.body.bookingId,
        userId: String(request.user.id),
      });
      if (!booking) {
        return response.status(404).json({ message: "Booking not found" });
      }

      if (request.body.transactionId) {
        const existingPayment = await Payment.findOne({
          transactionId: request.body.transactionId,
          userId: String(request.user.id),
        });
        if (existingPayment) {
          return response.json(existingPayment);
        }
      }

      const payment = await Payment.create({
        bookingId: booking._id,
        userId: String(request.user.id),
        provider: request.body.provider ?? "razorpay",
        amount: Number(request.body.amount),
        status: request.body.status ?? "paid",
        method: request.body.method ?? "Razorpay",
        transactionId: request.body.transactionId,
      });

      if (payment.status === "paid" && booking.status === "pending") {
        booking.status = "confirmed";
        await booking.save();
        await syncTableStatusesForBooking(booking, booking.status);
      }

      return response.status(201).json(payment);
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
