"use client";

import { createContext, useContext, useState, useEffect } from "react";
import subscriptionService from "../lib/subscriptionService";
import toast from "react-hot-toast";

const SubscriptionContext = createContext();

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default fallback data when API is not available
  const getFallbackData = () => {
    return {
      subscription: {
        plan: "free",
        status: "active",
        maxAssets: 10,
        features: ["basic_scanning"],
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        cancelAtPeriodEnd: false,
      },
      usage: {
        hardware: 0,
        software: 0,
        users: 1,
      },
      plans: [
        {
          id: "free",
          name: "Free",
          price: 0,
          maxAssets: 10,
          features: ["basic_scanning"],
        },
        {
          id: "basic",
          name: "Basic",
          price: 29,
          maxAssets: 100,
          features: ["basic_scanning", "advanced_analytics"],
        },
        {
          id: "professional",
          name: "Professional",
          price: 99,
          maxAssets: 500,
          features: [
            "basic_scanning",
            "advanced_analytics",
            "api_access",
            "priority_support",
          ],
        },
        {
          id: "enterprise",
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
        },
      ],
    };
  };

  // Load subscription data
  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to load from API
      const [subscriptionData, usageData, plansData] = await Promise.all([
        subscriptionService.getSubscriptionDetails(),
        subscriptionService.getUsageStats(),
        subscriptionService.getPricingPlans(),
      ]);

      setSubscription(subscriptionData.subscription);
      setUsage(usageData.usage);
      setPlans(plansData.plans);
    } catch (err) {
      console.error("Error loading subscription data:", err);

      // Check if it's a network error
      if (err.message === "Network Error" || err.code === "ERR_NETWORK") {
        console.log("Backend not available, using fallback data");
        const fallbackData = getFallbackData();
        setSubscription(fallbackData.subscription);
        setUsage(fallbackData.usage);
        setPlans(fallbackData.plans);
        setError("Backend not available - using demo data");
        toast.error("Backend not available - using demo data");
      }
      // Check if it's an authentication error
      else if (err.response?.status === 401) {
        console.log("User not authenticated, using fallback data");
        const fallbackData = getFallbackData();
        setSubscription(fallbackData.subscription);
        setUsage(fallbackData.usage);
        setPlans(fallbackData.plans);
        setError("Please log in to view subscription details");
        toast.error("Please log in to view subscription details");
      } else {
        setError(err.message || "Failed to load subscription data");
        toast.error("Failed to load subscription information");

        // Use fallback data on any error
        const fallbackData = getFallbackData();
        setSubscription(fallbackData.subscription);
        setUsage(fallbackData.usage);
        setPlans(fallbackData.plans);
      }
    } finally {
      setLoading(false);
    }
  };

  // Refresh subscription data
  const refreshSubscription = async () => {
    await loadSubscriptionData();
  };

  // Create checkout session
  const createCheckout = async (planName) => {
    try {
      const successUrl = `${window.location.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}/subscription/cancel`;

      const response = await subscriptionService.createCheckoutSession(
        planName,
        successUrl,
        cancelUrl
      );

      if (response.success && response.url) {
        window.location.href = response.url;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (err) {
      console.error("Error creating checkout:", err);

      if (err.message === "Network Error" || err.code === "ERR_NETWORK") {
        toast.error("Backend not available - please start the server first");
      } else if (err.response?.status === 401) {
        toast.error("Please log in to create a subscription");
      } else {
        toast.error(
          err.response?.data?.error || "Failed to create checkout session"
        );
      }
      throw err;
    }
  };

  // Change plan
  const changePlan = async (planName) => {
    try {
      const response = await subscriptionService.changePlan(planName);

      if (response.action === "checkout") {
        // Redirect to checkout for new subscriptions
        window.location.href = response.url;
      } else {
        // Plan changed successfully
        await refreshSubscription();
        toast.success("Plan changed successfully");
      }

      return response;
    } catch (err) {
      console.error("Error changing plan:", err);

      if (err.message === "Network Error" || err.code === "ERR_NETWORK") {
        toast.error("Backend not available - please start the server first");
      } else if (err.response?.status === 401) {
        toast.error("Please log in to change your plan");
      } else {
        toast.error(err.response?.data?.error || "Failed to change plan");
      }
      throw err;
    }
  };

  // Cancel subscription
  const cancelSubscription = async (cancelAtPeriodEnd = true) => {
    try {
      const response = await subscriptionService.cancelSubscription(
        cancelAtPeriodEnd
      );
      await refreshSubscription();
      toast.success(response.message || "Subscription cancelled successfully");
      return response;
    } catch (err) {
      console.error("Error cancelling subscription:", err);

      if (err.message === "Network Error" || err.code === "ERR_NETWORK") {
        toast.error("Backend not available - please start the server first");
      } else if (err.response?.status === 401) {
        toast.error("Please log in to manage your subscription");
      } else {
        toast.error(
          err.response?.data?.error || "Failed to cancel subscription"
        );
      }
      throw err;
    }
  };

  // Reactivate subscription
  const reactivateSubscription = async () => {
    try {
      const response = await subscriptionService.reactivateSubscription();
      await refreshSubscription();
      toast.success("Subscription reactivated successfully");
      return response;
    } catch (err) {
      console.error("Error reactivating subscription:", err);

      if (err.message === "Network Error" || err.code === "ERR_NETWORK") {
        toast.error("Backend not available - please start the server first");
      } else if (err.response?.status === 401) {
        toast.error("Please log in to manage your subscription");
      } else {
        toast.error(
          err.response?.data?.error || "Failed to reactivate subscription"
        );
      }
      throw err;
    }
  };

  // Open customer portal
  const openCustomerPortal = async () => {
    try {
      const response = await subscriptionService.getCustomerPortalUrl();
      if (response.success && response.url) {
        window.location.href = response.url;
      } else {
        throw new Error("Failed to get customer portal URL");
      }
    } catch (err) {
      console.error("Error opening customer portal:", err);

      if (err.message === "Network Error" || err.code === "ERR_NETWORK") {
        toast.error("Backend not available - please start the server first");
        // Don't throw error in demo mode
        return;
      } else if (err.response?.status === 401) {
        toast.error("Please log in to access the customer portal");
        // Don't throw error for auth issues
        return;
      } else {
        toast.error("Failed to open customer portal");
        // Don't throw error for other issues
        return;
      }
    }
  };

  // Check if user has access to a feature
  const hasFeature = (featureName) => {
    if (!subscription) return false;
    return subscription.features?.includes(featureName) || false;
  };

  // Check if user can add more assets
  const canAddAsset = () => {
    if (!subscription || !usage) return false;
    return usage.hardware < subscription.maxAssets;
  };

  // Get current plan details
  const getCurrentPlan = () => {
    if (!subscription || !plans.length) return null;
    return plans.find((plan) => plan.id === subscription.plan);
  };

  // Load data on mount
  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const value = {
    subscription,
    usage,
    plans,
    loading,
    error,
    refreshSubscription,
    createCheckout,
    changePlan,
    cancelSubscription,
    reactivateSubscription,
    openCustomerPortal,
    hasFeature,
    canAddAsset,
    getCurrentPlan,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
