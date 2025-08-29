import { StripeService } from "../services/stripeService.js";
import { PRICING_PLANS, getPlanDetails } from "../config/stripe.js";
import Organization from "../models/organization.models.js";

// Get available pricing plans
export const getPricingPlans = async (req, res) => {
  try {
    const plans = Object.keys(PRICING_PLANS).map((planKey) => ({
      id: planKey,
      ...PRICING_PLANS[planKey],
    }));

    res.json({
      success: true,
      plans,
    });
  } catch (error) {
    console.error("Error getting pricing plans:", error);
    res.status(500).json({ error: "Failed to get pricing plans" });
  }
};

// Create checkout session for subscription
export const createCheckoutSession = async (req, res) => {
  try {
    const { planName, successUrl, cancelUrl } = req.body;

    if (!planName || !successUrl || !cancelUrl) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const planDetails = getPlanDetails(planName);
    if (!planDetails.stripePriceId) {
      return res.status(400).json({ error: "Invalid plan selected" });
    }

    const organization = req.organization;

    const session = await StripeService.createCheckoutSession(
      organization,
      planName,
      successUrl,
      cancelUrl
    );

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
};

// Handle successful checkout (webhook or redirect)
export const handleCheckoutSuccess = async (req, res) => {
  try {
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    // You might want to verify the session with Stripe here
    // For now, we'll just redirect to success page
    res.json({
      success: true,
      message: "Subscription activated successfully",
    });
  } catch (error) {
    console.error("Error handling checkout success:", error);
    res.status(500).json({ error: "Failed to process checkout success" });
  }
};

// Change subscription plan
export const changePlan = async (req, res) => {
  try {
    const { planName } = req.body;

    if (!planName) {
      return res.status(400).json({ error: "Plan name is required" });
    }

    const organization = req.organization;
    const currentPlan = organization.subscription.plan;

    if (currentPlan === planName) {
      return res.status(400).json({ error: "Already on this plan" });
    }

    const planDetails = getPlanDetails(planName);
    if (!planDetails.stripePriceId) {
      return res.status(400).json({ error: "Invalid plan selected" });
    }

    // If upgrading from free plan, create checkout session
    if (currentPlan === "free") {
      const successUrl = `${req.protocol}://${req.get(
        "host"
      )}/api/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${req.protocol}://${req.get(
        "host"
      )}/api/subscription/cancel`;

      const session = await StripeService.createCheckoutSession(
        organization,
        planName,
        successUrl,
        cancelUrl
      );

      return res.json({
        success: true,
        sessionId: session.id,
        url: session.url,
        action: "checkout",
      });
    }

    // If changing between paid plans, update subscription
    const subscription = await StripeService.updateSubscription(
      organization,
      planName
    );

    res.json({
      success: true,
      message: "Plan changed successfully",
      subscription: {
        plan: organization.subscription.plan,
        status: organization.subscription.status,
        maxAssets: organization.subscription.maxAssets,
        features: organization.subscription.features,
      },
    });
  } catch (error) {
    console.error("Error changing plan:", error);
    res.status(500).json({ error: "Failed to change plan" });
  }
};

// Cancel subscription
export const cancelSubscription = async (req, res) => {
  try {
    const { cancelAtPeriodEnd = true } = req.body;
    const organization = req.organization;

    if (!organization.subscription.stripeSubscriptionId) {
      return res.status(400).json({ error: "No active subscription found" });
    }

    await StripeService.cancelSubscription(organization, cancelAtPeriodEnd);

    res.json({
      success: true,
      message: cancelAtPeriodEnd
        ? "Subscription will be cancelled at the end of the current period"
        : "Subscription cancelled immediately",
      subscription: {
        status: organization.subscription.status,
        cancelAtPeriodEnd: organization.subscription.cancelAtPeriodEnd,
      },
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
};

// Reactivate subscription
export const reactivateSubscription = async (req, res) => {
  try {
    const organization = req.organization;

    if (!organization.subscription.stripeSubscriptionId) {
      return res.status(400).json({ error: "No subscription found" });
    }

    await StripeService.reactivateSubscription(organization);

    res.json({
      success: true,
      message: "Subscription reactivated successfully",
      subscription: {
        status: organization.subscription.status,
        cancelAtPeriodEnd: organization.subscription.cancelAtPeriodEnd,
      },
    });
  } catch (error) {
    console.error("Error reactivating subscription:", error);
    res.status(500).json({ error: "Failed to reactivate subscription" });
  }
};

// Get customer portal URL
export const getCustomerPortalUrl = async (req, res) => {
  try {
    const organization = req.organization;
    const returnUrl = `${req.protocol}://${req.get("host")}/dashboard`;

    const session = await StripeService.createCustomerPortalSession(
      organization,
      returnUrl
    );

    res.json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating customer portal session:", error);
    res.status(500).json({ error: "Failed to create customer portal session" });
  }
};

// Get subscription details
export const getSubscriptionDetails = async (req, res) => {
  try {
    const organization = req.organization;

    // Get local subscription details
    const localSubscription = {
      plan: organization.subscription.plan,
      status: organization.subscription.status,
      maxAssets: organization.subscription.maxAssets,
      features: organization.subscription.features,
      currentPeriodStart: organization.subscription.currentPeriodStart,
      currentPeriodEnd: organization.subscription.currentPeriodEnd,
      cancelAtPeriodEnd: organization.subscription.cancelAtPeriodEnd,
    };

    // Get Stripe subscription details if available
    let stripeSubscription = null;
    if (organization.subscription.stripeSubscriptionId) {
      try {
        stripeSubscription = await StripeService.getSubscriptionDetails(
          organization
        );
      } catch (error) {
        console.error("Error fetching Stripe subscription:", error);
      }
    }

    res.json({
      success: true,
      subscription: localSubscription,
      stripeSubscription: stripeSubscription
        ? {
            id: stripeSubscription.id,
            status: stripeSubscription.status,
            current_period_start: stripeSubscription.current_period_start,
            current_period_end: stripeSubscription.current_period_end,
            cancel_at_period_end: stripeSubscription.cancel_at_period_end,
          }
        : null,
    });
  } catch (error) {
    console.error("Error getting subscription details:", error);
    res.status(500).json({ error: "Failed to get subscription details" });
  }
};

// Get usage statistics
export const getUsageStats = async (req, res) => {
  try {
    const organization = req.organization;

    // Import models dynamically to avoid circular dependencies
    const { default: Hardware } = await import("../models/hardware.models.js");
    const { default: Software } = await import("../models/software.models.js");
    const { default: User } = await import("../models/user.models.js");

    const [hardwareCount, softwareCount, userCount] = await Promise.all([
      Hardware.countDocuments({ organization: organization._id }),
      Software.countDocuments({ organization: organization._id }),
      User.countDocuments({ organization: organization._id }),
    ]);

    const usage = {
      hardware: hardwareCount,
      software: softwareCount,
      users: userCount,
      maxAssets: organization.subscription.maxAssets,
      usagePercentage: Math.round(
        (hardwareCount / organization.subscription.maxAssets) * 100
      ),
    };

    res.json({
      success: true,
      usage,
    });
  } catch (error) {
    console.error("Error getting usage stats:", error);
    res.status(500).json({ error: "Failed to get usage statistics" });
  }
};
