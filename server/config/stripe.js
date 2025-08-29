import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
});

// Define pricing plans
export const PRICING_PLANS = {
  free: {
    name: "Free",
    price: 0,
    maxAssets: 10,
    features: ["basic_scanning"],
    stripePriceId: null,
  },
  basic: {
    name: "Basic",
    price: 29,
    maxAssets: 100,
    features: ["basic_scanning", "advanced_analytics"],
    stripePriceId: process.env.STRIPE_BASIC_PRICE_ID,
  },
  professional: {
    name: "Professional",
    price: 99,
    maxAssets: 500,
    features: [
      "basic_scanning",
      "advanced_analytics",
      "api_access",
      "priority_support",
    ],
    stripePriceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
  },
  enterprise: {
    name: "Enterprise",
    price: 299,
    maxAssets: 2000,
    features: [
      "basic_scanning",
      "advanced_analytics",
      "api_access",
      "priority_support",
      "custom_branding",
    ],
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
  },
};

// Helper function to get plan details
export const getPlanDetails = (planName) => {
  return PRICING_PLANS[planName] || PRICING_PLANS.free;
};

// Helper function to calculate subscription end date
export const calculateSubscriptionEndDate = (planName) => {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription
  return endDate;
};

// Helper function to update organization subscription from Stripe
export const updateSubscriptionFromStripe = async (
  organization,
  stripeSubscription
) => {
  const planName = getPlanNameFromStripePriceId(
    stripeSubscription.items.data[0].price.id
  );
  const planDetails = getPlanDetails(planName);

  organization.subscription.plan = planName;
  organization.subscription.status =
    stripeSubscription.status === "active" ? "active" : "inactive";
  organization.subscription.maxAssets = planDetails.maxAssets;
  organization.subscription.features = planDetails.features;
  organization.subscription.stripeSubscriptionId = stripeSubscription.id;
  organization.subscription.stripePriceId =
    stripeSubscription.items.data[0].price.id;
  organization.subscription.currentPeriodStart = new Date(
    stripeSubscription.current_period_start * 1000
  );
  organization.subscription.currentPeriodEnd = new Date(
    stripeSubscription.current_period_end * 1000
  );
  organization.subscription.cancelAtPeriodEnd =
    stripeSubscription.cancel_at_period_end;

  await organization.save();
};

// Helper function to get plan name from Stripe price ID
export const getPlanNameFromStripePriceId = (priceId) => {
  for (const [planName, planDetails] of Object.entries(PRICING_PLANS)) {
    if (planDetails.stripePriceId === priceId) {
      return planName;
    }
  }
  return "free";
};

export default stripe;
