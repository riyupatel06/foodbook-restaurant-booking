import { Router } from "express";
import { Invoice } from "../models/Invoice.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/", requireAuth, async (request, response, next) => {
  try {
    const invoice = await Invoice.create({
      userId: request.user.id,
      ...request.body,
    });
    return response.status(201).json(invoice);
  } catch (error) {
    return next(error);
  }
});

router.get("/", requireAuth, async (request, response, next) => {
  try {
    const invoices = await Invoice.find({ userId: request.user.id }).sort({ createdAt: -1 });
    return response.json(invoices);
  } catch (error) {
    return next(error);
  }
});

export default router;