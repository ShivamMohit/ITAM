import stripe from "../config/stripe.js";
import { PRICING_PLANS } from "../config/stripe.js";
import dotenv from "dotenv";

dotenv.config();

async function setupStripeProducts() {
  try {
    console.log("Setting up Stripe products and prices...\n");

    // Create products and prices for each plan
    for (const [planKey, planDetails] of Object.entries(PRICING_PLANS)) {
      if (planKey === "free") {
        console.log(`Skipping free plan: ${planDetails.name}`);
        continue;
      }

      console.log(`Setting up ${planDetails.name} plan...`);

      // Create product
      const product = await stripe.products.create({
        name: `ITAM ${planDetails.name} Plan`,
        description: `IT Asset Management ${planDetails.name} subscription plan`,
        metadata: {
          planKey: planKey,
          maxAssets: planDetails.maxAssets.toString(),
          features: planDetails.features.join(","),
        },
      });

      console.log(`Created product: ${product.name} (${product.id})`);

      // Create price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: planDetails.price * 100, // Convert to cents
        currency: "usd",
        recurring: {
          interval: "month",
        },
        metadata: {
          planKey: planKey,
          maxAssets: planDetails.maxAssets.toString(),
        },
      });

      console.log(`Created price: $${planDetails.price}/month (${price.id})\n`);

      // Update the plan with the new price ID
      console.log(`Add this to your .env file:`);
      console.log(`STRIPE_${planKey.toUpperCase()}_PRICE_ID=${price.id}\n`);
    }

    console.log("Stripe setup completed!");
    console.log("\nNext steps:");
    console.log("1. Copy the price IDs above to your .env file");
    console.log("2. Set up webhook endpoints in your Stripe dashboard");
    console.log("3. Configure the webhook secret in your .env file");
  } catch (error) {
    console.error("Error setting up Stripe:", error);
  }
}

// Run the setup
setupStripeProducts();
