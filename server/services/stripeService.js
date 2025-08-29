import stripe, {
  PRICING_PLANS,
  getPlanDetails,
  updateSubscriptionFromStripe,
} from "../config/stripe.js";
import Organization from "../models/organization.models.js";

export class StripeService {
  // Create a new Stripe customer for an organization
  static async createCustomer(organization) {
    try {
      const customer = await stripe.customers.create({
        name: organization.name,
        email: organization.domain
          ? `${organization.domain}@example.com`
          : undefined,
        metadata: {
          organizationId: organization._id.toString(),
        },
      });

      // Update organization with Stripe customer ID
      organization.subscription.stripeCustomerId = customer.id;
      await organization.save();

      return customer;
    } catch (error) {
      console.error("Error creating Stripe customer:", error);
      throw new Error("Failed to create Stripe customer");
    }
  }

  // Create a subscription for an organization
  static async createSubscription(organization, planName) {
    try {
      const planDetails = getPlanDetails(planName);

      if (!planDetails.stripePriceId) {
        throw new Error("Invalid plan or plan not configured in Stripe");
      }

      // Ensure organization has a Stripe customer
      if (!organization.subscription.stripeCustomerId) {
        await this.createCustomer(organization);
      }

      // Create subscription in Stripe
      const subscription = await stripe.subscriptions.create({
        customer: organization.subscription.stripeCustomerId,
        items: [{ price: planDetails.stripePriceId }],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent"],
      });

      // Update organization subscription details
      await updateSubscriptionFromStripe(organization, subscription);

      return subscription;
    } catch (error) {
      console.error("Error creating subscription:", error);
      throw new Error("Failed to create subscription");
    }
  }

  // Update subscription (change plan)
  static async updateSubscription(organization, newPlanName) {
    try {
      const planDetails = getPlanDetails(newPlanName);

      if (!planDetails.stripePriceId) {
        throw new Error("Invalid plan or plan not configured in Stripe");
      }

      if (!organization.subscription.stripeSubscriptionId) {
        // Create new subscription if none exists
        return await this.createSubscription(organization, newPlanName);
      }

      // Update existing subscription
      const subscription = await stripe.subscriptions.update(
        organization.subscription.stripeSubscriptionId,
        {
          items: [
            {
              id: organization.subscription.stripeSubscriptionId,
              price: planDetails.stripePriceId,
            },
          ],
          proration_behavior: "create_prorations",
        }
      );

      // Update organization subscription details
      await updateSubscriptionFromStripe(organization, subscription);

      return subscription;
    } catch (error) {
      console.error("Error updating subscription:", error);
      throw new Error("Failed to update subscription");
    }
  }

  // Cancel subscription
  static async cancelSubscription(organization, cancelAtPeriodEnd = true) {
    try {
      if (!organization.subscription.stripeSubscriptionId) {
        throw new Error("No active subscription found");
      }

      const subscription = await stripe.subscriptions.update(
        organization.subscription.stripeSubscriptionId,
        {
          cancel_at_period_end: cancelAtPeriodEnd,
        }
      );

      // Update organization subscription details
      await updateSubscriptionFromStripe(organization, subscription);

      return subscription;
    } catch (error) {
      console.error("Error canceling subscription:", error);
      throw new Error("Failed to cancel subscription");
    }
  }

  // Reactivate subscription
  static async reactivateSubscription(organization) {
    try {
      if (!organization.subscription.stripeSubscriptionId) {
        throw new Error("No subscription found");
      }

      const subscription = await stripe.subscriptions.update(
        organization.subscription.stripeSubscriptionId,
        {
          cancel_at_period_end: false,
        }
      );

      // Update organization subscription details
      await updateSubscriptionFromStripe(organization, subscription);

      return subscription;
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      throw new Error("Failed to reactivate subscription");
    }
  }

  // Get subscription details from Stripe
  static async getSubscriptionDetails(organization) {
    try {
      if (!organization.subscription.stripeSubscriptionId) {
        return null;
      }

      const subscription = await stripe.subscriptions.retrieve(
        organization.subscription.stripeSubscriptionId,
        {
          expand: ["latest_invoice", "customer"],
        }
      );

      return subscription;
    } catch (error) {
      console.error("Error retrieving subscription:", error);
      throw new Error("Failed to retrieve subscription details");
    }
  }

  // Create checkout session for subscription
  static async createCheckoutSession(
    organization,
    planName,
    successUrl,
    cancelUrl
  ) {
    try {
      const planDetails = getPlanDetails(planName);

      if (!planDetails.stripePriceId) {
        throw new Error("Invalid plan or plan not configured in Stripe");
      }

      // Ensure organization has a Stripe customer
      if (!organization.subscription.stripeCustomerId) {
        await this.createCustomer(organization);
      }

      const session = await stripe.checkout.sessions.create({
        customer: organization.subscription.stripeCustomerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price: planDetails.stripePriceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          organizationId: organization._id.toString(),
          planName: planName,
        },
      });

      return session;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      throw new Error("Failed to create checkout session");
    }
  }

  // Create customer portal session
  static async createCustomerPortalSession(organization, returnUrl) {
    try {
      if (!organization.subscription.stripeCustomerId) {
        throw new Error("No Stripe customer found for organization");
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: organization.subscription.stripeCustomerId,
        return_url: returnUrl,
      });

      return session;
    } catch (error) {
      console.error("Error creating customer portal session:", error);
      throw new Error("Failed to create customer portal session");
    }
  }

  // Process webhook events
  static async processWebhook(event) {
    try {
      switch (event.type) {
        case "customer.subscription.created":
        case "customer.subscription.updated":
          await this.handleSubscriptionUpdate(event.data.object);
          break;
        case "customer.subscription.deleted":
          await this.handleSubscriptionCancellation(event.data.object);
          break;
        case "invoice.payment_succeeded":
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case "invoice.payment_failed":
          await this.handlePaymentFailed(event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error("Error processing webhook:", error);
      throw error;
    }
  }

  // Handle subscription updates
  static async handleSubscriptionUpdate(stripeSubscription) {
    const organization = await Organization.findOne({
      "subscription.stripeSubscriptionId": stripeSubscription.id,
    });

    if (organization) {
      await updateSubscriptionFromStripe(organization, stripeSubscription);
    }
  }

  // Handle subscription cancellation
  static async handleSubscriptionCancellation(stripeSubscription) {
    const organization = await Organization.findOne({
      "subscription.stripeSubscriptionId": stripeSubscription.id,
    });

    if (organization) {
      organization.subscription.status = "cancelled";
      await organization.save();
    }
  }

  // Handle successful payment
  static async handlePaymentSucceeded(invoice) {
    const organization = await Organization.findOne({
      "subscription.stripeCustomerId": invoice.customer,
    });

    if (organization) {
      // Update subscription status if needed
      const subscription = await stripe.subscriptions.retrieve(
        invoice.subscription
      );
      await updateSubscriptionFromStripe(organization, subscription);
    }
  }

  // Handle failed payment
  static async handlePaymentFailed(invoice) {
    const organization = await Organization.findOne({
      "subscription.stripeCustomerId": invoice.customer,
    });

    if (organization) {
      // You might want to send notification or update status
      console.log(`Payment failed for organization: ${organization.name}`);
    }
  }
}
