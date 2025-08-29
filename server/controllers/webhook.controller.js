import stripe from "../config/stripe.js";
import { StripeService } from "../services/stripeService.js";

export const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Process the webhook event
    await StripeService.processWebhook(event);

    res.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};

// Test webhook endpoint (for development)
export const testWebhook = async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Webhook endpoint is working",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in test webhook:", error);
    res.status(500).json({ error: "Test webhook failed" });
  }
};
