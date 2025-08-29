import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const subscriptionService = {
  // Get available pricing plans
  getPricingPlans: async () => {
    try {
      const response = await api.get("/subscription/plans");
      return response.data;
    } catch (error) {
      console.error("Error fetching pricing plans:", error);
      throw error;
    }
  },

  // Get current subscription details
  getSubscriptionDetails: async () => {
    try {
      const response = await api.get("/subscription/details");
      return response.data;
    } catch (error) {
      console.error("Error fetching subscription details:", error);
      throw error;
    }
  },

  // Get usage statistics
  getUsageStats: async () => {
    try {
      const response = await api.get("/subscription/usage");
      return response.data;
    } catch (error) {
      console.error("Error fetching usage stats:", error);
      throw error;
    }
  },

  // Create checkout session
  createCheckoutSession: async (planName, successUrl, cancelUrl) => {
    try {
      const response = await api.post("/subscription/checkout", {
        planName,
        successUrl,
        cancelUrl,
      });
      return response.data;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      throw error;
    }
  },

  // Change subscription plan
  changePlan: async (planName) => {
    try {
      const response = await api.post("/subscription/change-plan", {
        planName,
      });
      return response.data;
    } catch (error) {
      console.error("Error changing plan:", error);
      throw error;
    }
  },

  // Cancel subscription
  cancelSubscription: async (cancelAtPeriodEnd = true) => {
    try {
      const response = await api.post("/subscription/cancel", {
        cancelAtPeriodEnd,
      });
      return response.data;
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      throw error;
    }
  },

  // Reactivate subscription
  reactivateSubscription: async () => {
    try {
      const response = await api.post("/subscription/reactivate");
      return response.data;
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      throw error;
    }
  },

  // Get customer portal URL
  getCustomerPortalUrl: async () => {
    try {
      const response = await api.get("/subscription/portal");
      return response.data;
    } catch (error) {
      console.error("Error getting customer portal URL:", error);
      throw error;
    }
  },
};

export default subscriptionService;
