import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/User.js";
import { isDatabaseReady } from "../config/database.js";
import { requireAuth } from "../middlewares/auth.js";
import { createMemoryUser, findMemoryUserByEmail, findMemoryUserById, updateMemoryUser } from "../utils/memoryStore.js";

const router = Router();

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@])[A-Za-z\d@#$%^&*()_+\-=[\]{};':"\\|,.<>/?!~`]{8,}$/;
const phonePattern = /^[1-9]\d{9}$/;
const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, phone: user.phone, picture: user.picture ?? "" };
}

function createUserToken(user) {
  return jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function createOtpCode() {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
}

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Enter a valid email address").normalizeEmail(),
    body("phone")
      .matches(phonePattern)
      .withMessage("Phone number must be exactly 10 digits and cannot start with 0"),
    body("password")
      .matches(passwordPattern)
      .withMessage("Password must be at least 8 characters and include uppercase, lowercase, number, and @"),
  ],
  async (request, response, next) => {
    try {
      const errors = validationResult(request);
      if (!errors.isEmpty()) {
        return response.status(400).json({ errors: errors.array() });
      }

      const { name, email, phone, password } = request.body;
      const normalizedEmail = email.toLowerCase().trim();
      const existing = isDatabaseReady()
        ? await User.findOne({ email: normalizedEmail })
        : findMemoryUserByEmail(normalizedEmail);
      if (existing) {
        return response.status(409).json({ message: "Email already registered" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = isDatabaseReady()
        ? await User.create({ name, email: normalizedEmail, phone, passwordHash })
        : createMemoryUser({ name, email: normalizedEmail, phone, passwordHash });
      const token = createUserToken(user);

      return response.status(201).json({
        token,
        user: publicUser(user),
      });
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
      if (!errors.isEmpty()) {
        return response.status(400).json({ errors: errors.array() });
      }

      const { email, password } = request.body;
      const normalizedEmail = email.toLowerCase().trim();
      const user = isDatabaseReady()
        ? await User.findOne({ email: normalizedEmail })
        : findMemoryUserByEmail(normalizedEmail);
      if (!user) {
        return response.status(401).json({ message: "Invalid credentials" });
      }
      if (user.isBlocked) {
        return response.status(403).json({ message: "Your account has been blocked by admin" });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return response.status(401).json({ message: "Invalid credentials" });
      }

      const token = createUserToken(user);

      return response.json({
        token,
        user: publicUser(user),
      });
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
    if (!errors.isEmpty()) {
      return response.status(400).json({ errors: errors.array() });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: request.body.credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      return response.status(401).json({ message: "Invalid Google account" });
    }

    const email = payload.email.toLowerCase().trim();
    const name = payload.name ?? payload.given_name ?? email.split("@")[0];
    const picture = payload.picture ?? "";
    const emailVerified = Boolean(payload.email_verified);

    const existing = isDatabaseReady()
      ? await User.findOne({ email })
      : findMemoryUserByEmail(email);

    let user = existing;
    if (!user) {
      const passwordHash = await bcrypt.hash(`${email}:${Date.now()}`, 10);
      user = isDatabaseReady()
        ? await User.create({ name, email, phone: "9999999999", passwordHash })
        : createMemoryUser({ name, email, phone: "9999999999", passwordHash });
    }

    const token = jwt.sign({ id: user._id, name: user.name, email: user.email, picture, emailVerified }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return response.json({
      token,
      user: { ...publicUser(user), picture, emailVerified },
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", requireAuth, async (request, response, next) => {
  try {
    const user = isDatabaseReady() ? await User.findById(request.user.id) : findMemoryUserById(request.user.id);
    if (!user) return response.status(404).json({ message: "User not found" });
    return response.json(publicUser(user));
  } catch (error) {
    return next(error);
  }
});

router.patch(
  "/me",
  requireAuth,
  [
    body("name").optional().trim().notEmpty().withMessage("Name is required"),
    body("email").optional().isEmail().withMessage("Enter a valid email address").normalizeEmail(),
    body("phone").optional().matches(phonePattern).withMessage("Phone number must be exactly 10 digits and cannot start with 0"),
    body("picture").optional().isString(),
  ],
  async (request, response, next) => {
    try {
      const errors = validationResult(request);
      if (!errors.isEmpty()) return response.status(400).json({ errors: errors.array() });

      const existingUser = isDatabaseReady() ? await User.findById(request.user.id) : findMemoryUserById(request.user.id);
      if (!existingUser) return response.status(404).json({ message: "User not found" });

      const updates = {
        ...(request.body.name ? { name: request.body.name.trim() } : {}),
        ...(request.body.phone ? { phone: request.body.phone.trim() } : {}),
        ...(request.body.picture !== undefined ? { picture: request.body.picture } : {}),
      };

      if (request.body.email) {
        const normalizedEmail = request.body.email.toLowerCase().trim();
        const duplicate = isDatabaseReady()
          ? await User.findOne({ email: normalizedEmail, _id: { $ne: request.user.id } })
          : findMemoryUserByEmail(normalizedEmail);

        if (duplicate && String(duplicate._id) !== String(request.user.id)) {
          return response.status(409).json({ message: "Email already registered" });
        }
        updates.email = normalizedEmail;
      }

      const user = isDatabaseReady()
        ? await User.findByIdAndUpdate(request.user.id, updates, { new: true })
        : updateMemoryUser(existingUser.email, updates);

      const token = createUserToken(user);
      return response.json({ token, user: publicUser(user) });
    } catch (error) {
      return next(error);
    }
  },
);

router.post(
  "/change-password",
  requireAuth,
  [
    body("oldPassword").notEmpty().withMessage("Old password is required"),
    body("newPassword")
      .matches(passwordPattern)
      .withMessage("Password must be at least 8 characters and include uppercase, lowercase, number, and @"),
  ],
  async (request, response, next) => {
    try {
      const errors = validationResult(request);
      if (!errors.isEmpty()) return response.status(400).json({ errors: errors.array() });

      const user = isDatabaseReady() ? await User.findById(request.user.id) : findMemoryUserById(request.user.id);
      if (!user) return response.status(404).json({ message: "User not found" });

      const validOldPassword = await bcrypt.compare(request.body.oldPassword, user.passwordHash);
      if (!validOldPassword) return response.status(400).json({ message: "Old password is incorrect" });

      const passwordHash = await bcrypt.hash(request.body.newPassword, 10);
      if (isDatabaseReady()) {
        await User.findByIdAndUpdate(request.user.id, { passwordHash, resetOtpHash: null, resetOtpExpiresAt: null });
      } else {
        updateMemoryUser(user.email, { passwordHash, resetOtpHash: null, resetOtpExpiresAt: null });
      }

      return response.json({ message: "Password updated successfully" });
    } catch (error) {
      return next(error);
    }
  },
);

router.post(
  "/forgot-password/request-otp",
  [body("email").isEmail().withMessage("Enter a valid email address").normalizeEmail()],
  async (request, response, next) => {
    try {
      const errors = validationResult(request);
      if (!errors.isEmpty()) return response.status(400).json({ errors: errors.array() });

      const email = request.body.email.toLowerCase().trim();
      const user = isDatabaseReady() ? await User.findOne({ email }) : findMemoryUserByEmail(email);
      if (!user) return response.status(404).json({ message: "Email not found" });

      const otp = createOtpCode();
      const resetOtpHash = hashOtp(otp);
      const resetOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      if (isDatabaseReady()) {
        await User.findByIdAndUpdate(user._id, { resetOtpHash, resetOtpExpiresAt });
      } else {
        updateMemoryUser(email, { resetOtpHash, resetOtpExpiresAt });
      }

      return response.json({
        message: "OTP sent to email",
        otp,
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.post(
  "/forgot-password/reset",
  [
    body("email").isEmail().withMessage("Enter a valid email address").normalizeEmail(),
    body("otp").trim().isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits"),
    body("newPassword")
      .matches(passwordPattern)
      .withMessage("Password must be at least 8 characters and include uppercase, lowercase, number, and @"),
  ],
  async (request, response, next) => {
    try {
      const errors = validationResult(request);
      if (!errors.isEmpty()) return response.status(400).json({ errors: errors.array() });

      const email = request.body.email.toLowerCase().trim();
      const user = isDatabaseReady() ? await User.findOne({ email }) : findMemoryUserByEmail(email);
      if (!user) return response.status(404).json({ message: "Email not found" });

      const otpMatches = user.resetOtpHash && user.resetOtpHash === hashOtp(request.body.otp);
      const otpActive = user.resetOtpExpiresAt && new Date(user.resetOtpExpiresAt).getTime() > Date.now();

      if (!otpMatches || !otpActive) {
        return response.status(400).json({ message: "OTP is invalid or expired" });
      }

      const passwordHash = await bcrypt.hash(request.body.newPassword, 10);
      if (isDatabaseReady()) {
        await User.findByIdAndUpdate(user._id, { passwordHash, resetOtpHash: null, resetOtpExpiresAt: null });
      } else {
        updateMemoryUser(email, { passwordHash, resetOtpHash: null, resetOtpExpiresAt: null });
      }

      return response.json({ message: "Password reset successfully" });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
