import mongoose from "mongoose";

const SubscriptionSchema = new mongoose.Schema({
  plan: {
    type: String,
    enum: ["free", "basic", "professional", "enterprise"],
    default: "free",
  },
  status: {
    type: String,
    enum: ["active", "inactive", "suspended", "cancelled"],
    default: "active",
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    required: true,
  },
  maxAssets: {
    type: Number,
    default: 10, // Free tier limit
  },
  features: [
    {
      type: String,
      enum: [
        "basic_scanning",
        "advanced_analytics",
        "api_access",
        "priority_support",
        "custom_branding",
      ],
    },
  ],
  // Stripe integration fields
  stripeCustomerId: {
    type: String,
    trim: true,
  },
  stripeSubscriptionId: {
    type: String,
    trim: true,
  },
  stripePriceId: {
    type: String,
    trim: true,
  },
  currentPeriodStart: {
    type: Date,
  },
  currentPeriodEnd: {
    type: Date,
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false,
  },
});

const OrganizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    domain: {
      type: String,
      trim: true,
      lowercase: true,
    },
    subscription: {
      type: SubscriptionSchema,
      default: () => ({}),
    },
    settings: {
      timezone: {
        type: String,
        default: "UTC",
      },
      currency: {
        type: String,
        default: "USD",
      },
      language: {
        type: String,
        default: "en",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
OrganizationSchema.index({ domain: 1 });
OrganizationSchema.index({ "subscription.status": 1 });
OrganizationSchema.index({ "subscription.stripeCustomerId": 1 });
OrganizationSchema.index({ "subscription.stripeSubscriptionId": 1 });

const Organization = mongoose.model("Organization", OrganizationSchema);

export default Organization;
