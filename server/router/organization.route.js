import express from "express";
import { verifyToken, requireAdmin } from "../middleware/auth.js";
import {
  addOrganizationContext,
  checkSubscriptionLimits,
  filterByOrganization,
} from "../middleware/organization.js";
import Organization from "../models/organization.models.js";
import User from "../models/user.models.js";

const router = express.Router();

// Get available organizations for registration (public)
router.get("/available", async (req, res) => {
  try {
    const organizations = await Organization.find(
      { isActive: true },
      "name domain subscription.plan subscription.maxAssets"
    ).sort({ name: 1 });

    const orgList = organizations.map((org) => ({
      id: org._id,
      name: org.name,
      domain: org.domain,
      plan: org.subscription.plan,
      maxAssets: org.subscription.maxAssets,
    }));

    res.json({
      success: true,
      organizations: orgList,
    });
  } catch (error) {
    console.error("Get available organizations error:", error);
    res.status(500).json({ error: "Failed to get available organizations" });
  }
});

// Get organization details (admin only)
router.get(
  "/details",
  verifyToken,
  addOrganizationContext,
  async (req, res) => {
    try {
      const organization = req.organization;

      // Get user count for this organization
      const userCount = await User.countDocuments({
        organization: organization._id,
      });

      // Get asset count for this organization
      const Hardware = (await import("../models/hardware.models.js")).default;
      const assetCount = await Hardware.countDocuments({
        organization: organization._id,
      });

      const orgDetails = {
        _id: organization._id,
        name: organization.name,
        domain: organization.domain,
        subscription: organization.subscription,
        settings: organization.settings,
        stats: {
          userCount,
          assetCount,
          maxAssets: organization.subscription.maxAssets,
        },
        createdAt: organization.createdAt,
      };

      res.json(orgDetails);
    } catch (error) {
      console.error("Get organization details error:", error);
      res.status(500).json({ error: "Failed to get organization details" });
    }
  }
);

// Update organization settings (admin only)
router.put(
  "/settings",
  verifyToken,
  requireAdmin,
  addOrganizationContext,
  async (req, res) => {
    try {
      const { timezone, currency, language } = req.body;

      const organization = await Organization.findByIdAndUpdate(
        req.user.organization,
        {
          "settings.timezone": timezone,
          "settings.currency": currency,
          "settings.language": language,
        },
        { new: true }
      );

      res.json({
        message: "Organization settings updated successfully",
        settings: organization.settings,
      });
    } catch (error) {
      console.error("Update organization settings error:", error);
      res.status(500).json({ error: "Failed to update organization settings" });
    }
  }
);

// Get subscription information
router.get(
  "/subscription",
  verifyToken,
  addOrganizationContext,
  async (req, res) => {
    try {
      const organization = req.organization;

      // Calculate days remaining
      const daysRemaining = Math.ceil(
        (organization.subscription.endDate - new Date()) / (1000 * 60 * 60 * 24)
      );

      const subscriptionInfo = {
        ...organization.subscription.toObject(),
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
        isExpired: daysRemaining <= 0,
      };

      res.json(subscriptionInfo);
    } catch (error) {
      console.error("Get subscription info error:", error);
      res.status(500).json({ error: "Failed to get subscription information" });
    }
  }
);

// Update subscription (admin only)
router.put(
  "/subscription",
  verifyToken,
  requireAdmin,
  addOrganizationContext,
  async (req, res) => {
    try {
      const { plan, endDate, maxAssets, features } = req.body;

      const updateData = {};
      if (plan) updateData["subscription.plan"] = plan;
      if (endDate) updateData["subscription.endDate"] = new Date(endDate);
      if (maxAssets) updateData["subscription.maxAssets"] = maxAssets;
      if (features) updateData["subscription.features"] = features;

      const organization = await Organization.findByIdAndUpdate(
        req.user.organization,
        updateData,
        { new: true }
      );

      res.json({
        message: "Subscription updated successfully",
        subscription: organization.subscription,
      });
    } catch (error) {
      console.error("Update subscription error:", error);
      res.status(500).json({ error: "Failed to update subscription" });
    }
  }
);

// Get organization statistics
router.get("/stats", verifyToken, addOrganizationContext, async (req, res) => {
  try {
    const Hardware = (await import("../models/hardware.models.js")).default;
    const Software = (await import("../models/software.models.js")).default;
    const Telemetry = (await import("../models/telemetry.models.js")).default;
    const Ticket = (await import("../models/ticket.models.js")).default;

    const [userCount, assetCount, softwareCount, telemetryCount, ticketCount] =
      await Promise.all([
        User.countDocuments({ organization: req.user.organization }),
        Hardware.countDocuments({ organization: req.user.organization }),
        Software.countDocuments({ organization: req.user.organization }),
        Telemetry.countDocuments({ organization: req.user.organization }),
        Ticket.countDocuments({ organization: req.user.organization }),
      ]);

    res.json({
      users: userCount,
      assets: assetCount,
      software: softwareCount,
      telemetry: telemetryCount,
      tickets: ticketCount,
      maxAssets: req.organization.subscription.maxAssets,
      usagePercentage: Math.round(
        (assetCount / req.organization.subscription.maxAssets) * 100
      ),
    });
  } catch (error) {
    console.error("Get organization stats error:", error);
    res.status(500).json({ error: "Failed to get organization statistics" });
  }
});

export default router;
