import express from "express";
import {
  handleWebhook,
  testWebhook,
} from "../controllers/webhook.controller.js";

const router = express.Router();

// Stripe webhook endpoint (no authentication required)
router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  handleWebhook
);

// Test webhook endpoint
router.get("/test", testWebhook);

export default router;
