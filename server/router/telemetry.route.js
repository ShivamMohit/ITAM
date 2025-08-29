import express from "express";
import {
  receiveTelemetry,
  getTelemetry,
  getHealthSummary,
} from "../controllers/telemetry.controller.js";
import { verifyToken, requireAdmin } from "../middleware/auth.js";
import {
  checkSubscriptionLimits,
  addOrganizationContext,
} from "../middleware/organization.js";

const router = express.Router();

// Public route for receiving telemetry data from scanners
router.post("/", receiveTelemetry);

// Protected routes
router.get(
  "/health-summary",
  verifyToken,
  requireAdmin,
  addOrganizationContext,
  checkSubscriptionLimits,
  getHealthSummary
);
router.get(
  "/:mac_address",
  verifyToken,
  addOrganizationContext,
  checkSubscriptionLimits,
  getTelemetry
);

export default router;
