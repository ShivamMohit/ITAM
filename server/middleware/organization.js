import Organization from "../models/organization.models.js";
import Hardware from "../models/hardware.models.js";

// Middleware to add organization context to request
export const addOrganizationContext = async (req, res, next) => {
  try {
    if (!req.user || !req.user.organization) {
      return res.status(400).json({ error: "User organization not found" });
    }

    const organization = await Organization.findById(req.user.organization);
    if (!organization) {
      return res.status(400).json({ error: "Organization not found" });
    }

    if (!organization.isActive) {
      return res.status(403).json({ error: "Organization is inactive" });
    }

    req.organization = organization;
    next();
  } catch (error) {
    console.error("Organization context error:", error);
    res.status(500).json({ error: "Failed to load organization context" });
  }
};

// Check subscription limits
export const checkSubscriptionLimits = async (req, res, next) => {
  try {
    const organization = req.organization;
    const subscription = organization.subscription;

    // Check if subscription is active
    if (subscription.status !== "active") {
      return res.status(403).json({
        error: "Subscription is not active",
        subscriptionStatus: subscription.status,
        plan: subscription.plan,
        message:
          "Please update your subscription to continue using the service.",
      });
    }

    // Check if subscription has expired (for non-Stripe subscriptions)
    if (subscription.endDate && new Date() > subscription.endDate) {
      return res.status(403).json({
        error: "Subscription has expired",
        expiredDate: subscription.endDate,
        plan: subscription.plan,
        message: "Please renew your subscription to continue.",
      });
    }

    // Check Stripe subscription period (if using Stripe)
    if (
      subscription.currentPeriodEnd &&
      new Date() > subscription.currentPeriodEnd
    ) {
      return res.status(403).json({
        error: "Subscription period has expired",
        expiredDate: subscription.currentPeriodEnd,
        plan: subscription.plan,
        message: "Please update your payment method or contact support.",
      });
    }

    // Check if subscription is set to cancel at period end
    if (subscription.cancelAtPeriodEnd) {
      console.log(
        `Subscription for organization ${organization.name} will cancel at period end`
      );
      // Don't block access, but could add a warning header
      res.set(
        "X-Subscription-Warning",
        "Subscription will cancel at period end"
      );
    }

    // Check asset limits for hardware creation
    if (req.method === "POST" && req.path.includes("/hardware")) {
      const currentAssetCount = await Hardware.countDocuments({
        organization: organization._id,
      });

      if (currentAssetCount >= subscription.maxAssets) {
        return res.status(403).json({
          error: "Asset limit reached",
          currentAssets: currentAssetCount,
          maxAssets: subscription.maxAssets,
          plan: subscription.plan,
          message: `You've reached the limit of ${subscription.maxAssets} assets for your ${subscription.plan} plan. Please upgrade to add more assets.`,
        });
      }
    }

    next();
  } catch (error) {
    console.error("Subscription check error:", error);
    res.status(500).json({ error: "Failed to check subscription limits" });
  }
};

// Check feature access based on subscription plan
export const checkFeatureAccess = (requiredFeature) => {
  return (req, res, next) => {
    try {
      const organization = req.organization;
      const subscription = organization.subscription;

      if (
        !subscription.features ||
        !subscription.features.includes(requiredFeature)
      ) {
        return res.status(403).json({
          error: "Feature not available",
          requiredFeature,
          currentPlan: subscription.plan,
          availableFeatures: subscription.features || [],
          message: `This feature requires a higher subscription plan.`,
        });
      }

      next();
    } catch (error) {
      console.error("Feature access check error:", error);
      res.status(500).json({ error: "Failed to check feature access" });
    }
  };
};

// Filter data by organization
export const filterByOrganization = (req, res, next) => {
  req.organizationFilter = { organization: req.user.organization };
  next();
};

// Require admin role
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};
