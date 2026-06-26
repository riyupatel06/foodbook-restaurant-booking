import { Router } from "express";
import { AiLog } from "../models/AiLog.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/log", requireAuth, async (request, response, next) => {
  try {
    const aiLog = await AiLog.create({
      userId: request.user.id,
      query: request.body.query,
      response: request.body.response,
      metadata: request.body.metadata ?? {},
    });
    return response.status(201).json(aiLog);
  } catch (error) {
    return next(error);
  }
});

export default router;