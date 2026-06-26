import { Router } from "express";
import { Feedback } from "../models/Feedback.js";
import { Booking } from "../models/Booking.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/", requireAuth, async (request, response, next) => {
  try {
    const bookingId = request.body.bookingId;
    if (!bookingId) {
      return response.status(400).json({ message: "bookingId is required" });
    }

    const booking = await Booking.findOne({ _id: bookingId, userId: request.user.id });
    if (!booking) {
      return response.status(404).json({ message: "Booking not found for this user" });
    }

    const feedback = await Feedback.create({
      userId: request.user.id,
      bookingId,
      foodRating: Number(request.body.foodRating),
      serviceRating: Number(request.body.serviceRating),
      comment: request.body.comment?.trim() ?? "",
      ...request.body,
    });
    return response.status(201).json(feedback);
  } catch (error) {
    return next(error);
  }
});

export default router;
