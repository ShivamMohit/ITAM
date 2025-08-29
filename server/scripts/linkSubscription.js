import mongoose from "mongoose";
import dotenv from "dotenv";
import Organization from "../models/organization.models.js";
import stripe, {
  getPlanNameFromStripePriceId,
  getPlanDetails,
} from "../config/stripe.js";

dotenv.config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

async function linkSubscription() {
  try {
    console.log("🔍 Linking Stripe subscription to user account...");

    // Get your organization (assuming you have one)
    const organization = await Organization.findOne();

    if (!organization) {
      console.log(
        "❌ No organization found. Please create an organization first."
      );
      return;
    }

    console.log(`📋 Found organization: ${organization.name}`);

    // Get all subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      limit: 10,
      status: "active",
    });

    console.log(
      `🔍 Found ${subscriptions.data.length} active subscriptions in Stripe`
    );

    if (subscriptions.data.length === 0) {
      console.log("❌ No active subscriptions found in Stripe");
      return;
    }

    // Show available subscriptions
    console.log("\n📋 Available Stripe subscriptions:");
    subscriptions.data.forEach((sub, index) => {
      console.log(`${index + 1}. ID: ${sub.id}`);
      console.log(`   Customer: ${sub.customer}`);
      console.log(`   Status: ${sub.status}`);
      console.log(
        `   Current period: ${new Date(
          sub.current_period_start * 1000
        ).toLocaleDateString()} - ${new Date(
          sub.current_period_end * 1000
        ).toLocaleDateString()}`
      );
      console.log(`   Price ID: ${sub.items.data[0]?.price?.id}`);
      console.log("");
    });

    // For now, let's link the first subscription
    const subscription = subscriptions.data[0];

    console.log(
      `🔗 Linking subscription ${subscription.id} to organization ${organization.name}...`
    );

    // Update organization with subscription details
    const planName = getPlanNameFromStripePriceId(
      subscription.items.data[0]?.price?.id
    );
    const planDetails = getPlanDetails(planName);

    organization.subscription = {
      plan: planName,
      status: subscription.status,
      startDate: new Date(subscription.current_period_start * 1000),
      endDate: new Date(subscription.current_period_end * 1000),
      maxAssets: planDetails.maxAssets,
      features: planDetails.features,
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price?.id,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };

    await organization.save();

    console.log("✅ Subscription linked successfully!");
    console.log(`📊 Updated subscription details:`);
    console.log(`   Plan: ${organization.subscription.plan}`);
    console.log(`   Status: ${organization.subscription.status}`);
    console.log(
      `   Customer ID: ${organization.subscription.stripeCustomerId}`
    );
    console.log(
      `   Subscription ID: ${organization.subscription.stripeSubscriptionId}`
    );
  } catch (error) {
    console.error("❌ Error linking subscription:", error);
  } finally {
    mongoose.connection.close();
  }
}

function getPlanFromPriceId(priceId) {
  // Map Stripe price IDs to plan names
  const planMap = {
    price_1OqXisUCSLB6Fc: "basic",
    price_1OqXisUCSLB6Fd: "professional",
    price_1OqXisUCSLB6Fe: "enterprise",
  };

  return planMap[priceId] || "basic";
}

function getMaxAssetsFromPlan(plan) {
  const planLimits = {
    free: 10,
    basic: 100,
    professional: 500,
    enterprise: 2000,
  };
  return planLimits[plan] || 10;
}

function getFeaturesFromPlan(plan) {
  const planFeatures = {
    free: ["basic_scanning"],
    basic: ["basic_scanning", "advanced_analytics"],
    professional: [
      "basic_scanning",
      "advanced_analytics",
      "api_access",
      "priority_support",
    ],
    enterprise: [
      "basic_scanning",
      "advanced_analytics",
      "api_access",
      "priority_support",
      "custom_branding",
    ],
  };
  return planFeatures[plan] || ["basic_scanning"];
}

// Run the script
linkSubscription();
