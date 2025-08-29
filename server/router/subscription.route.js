import express from "express";
import {
  getPricingPlans,
  createCheckoutSession,
  handleCheckoutSuccess,
  changePlan,
  cancelSubscription,
  reactivateSubscription,
  getCustomerPortalUrl,
  getSubscriptionDetails,
  getUsageStats,
} from "../controllers/subscription.controller.js";
import { verifyToken } from "../middleware/auth.js";
import { addOrganizationContext } from "../middleware/organization.js";

const router = express.Router();

// Public routes (no authentication required)
router.get("/plans", getPricingPlans);

// Protected routes (authentication required)
router.use(verifyToken);
router.use(addOrganizationContext);

// Subscription management
router.get("/details", getSubscriptionDetails);
router.get("/usage", getUsageStats);
router.post("/checkout", createCheckoutSession);
router.post("/change-plan", changePlan);
router.post("/cancel", cancelSubscription);
router.post("/reactivate", reactivateSubscription);
router.get("/portal", getCustomerPortalUrl);

// Checkout success/cancel handlers
router.get("/success", handleCheckoutSuccess);

export default router;
