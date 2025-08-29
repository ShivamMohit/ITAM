"use client";

import { useState } from "react";
import { Check, Star, Zap, Shield, Crown } from "lucide-react";
import { useSubscription } from "../contexts/SubscriptionContext";
import clsx from "clsx";

const PricingPlans = () => {
  const { plans, subscription, createCheckout, changePlan, loading } =
    useSubscription();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [processing, setProcessing] = useState(false);

  const currentPlan = subscription?.plan;

  const getPlanIcon = (planId) => {
    switch (planId) {
      case "free":
        return <Shield className="w-6 h-6" />;
      case "basic":
        return <Zap className="w-6 h-6" />;
      case "professional":
        return <Star className="w-6 h-6" />;
      case "enterprise":
        return <Crown className="w-6 h-6" />;
      default:
        return <Shield className="w-6 h-6" />;
    }
  };

  const getPlanColor = (planId) => {
    switch (planId) {
      case "free":
        return "border-gray-200 bg-white";
      case "basic":
        return "border-blue-200 bg-blue-50";
      case "professional":
        return "border-purple-200 bg-purple-50";
      case "enterprise":
        return "border-yellow-200 bg-yellow-50";
      default:
        return "border-gray-200 bg-white";
    }
  };

  const handlePlanAction = async (plan) => {
    if (plan.id === "free") return;

    setProcessing(true);
    try {
      if (currentPlan === "free") {
        // New subscription
        await createCheckout(plan.id);
      } else if (currentPlan !== plan.id) {
        // Change plan
        await changePlan(plan.id);
      }
    } catch (error) {
      console.error("Error handling plan action:", error);
    } finally {
      setProcessing(false);
    }
  };

  const getActionButton = (plan) => {
    if (plan.id === "free") {
      return (
        <button
          disabled
          className="w-full px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed"
        >
          Current Plan
        </button>
      );
    }

    if (currentPlan === plan.id) {
      return (
        <button
          disabled
          className="w-full px-4 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg cursor-not-allowed"
        >
          Current Plan
        </button>
      );
    }

    return (
      <button
        onClick={() => handlePlanAction(plan)}
        disabled={processing}
        className={clsx(
          "w-full px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors",
          plan.id === "enterprise"
            ? "bg-yellow-600 hover:bg-yellow-700"
            : plan.id === "professional"
            ? "bg-purple-600 hover:bg-purple-700"
            : "bg-blue-600 hover:bg-blue-700",
          processing && "opacity-50 cursor-not-allowed"
        )}
      >
        {processing
          ? "Processing..."
          : currentPlan === "free"
          ? "Upgrade"
          : "Change Plan"}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pricing plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          Choose Your Plan
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          Select the perfect plan for your IT asset management needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={clsx(
              "relative p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-lg",
              getPlanColor(plan.id),
              currentPlan === plan.id && "ring-2 ring-blue-500 ring-offset-2"
            )}
          >
            {currentPlan === plan.id && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Current Plan
                </span>
              </div>
            )}

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div
                  className={clsx(
                    "p-3 rounded-full",
                    plan.id === "enterprise"
                      ? "bg-yellow-100 text-yellow-600"
                      : plan.id === "professional"
                      ? "bg-purple-100 text-purple-600"
                      : plan.id === "basic"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-600"
                  )}
                >
                  {getPlanIcon(plan.id)}
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {plan.name}
              </h3>

              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  ${plan.price}
                </span>
                <span className="text-gray-600">/month</span>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Max Assets</span>
                  <span className="text-sm font-medium text-gray-900">
                    {plan.maxAssets.toLocaleString()}
                  </span>
                </div>

                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700 capitalize">
                      {feature.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>

              {getActionButton(plan)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500">
          All plans include 24/7 support and automatic updates. Cancel or change
          your plan at any time.
        </p>
      </div>
    </div>
  );
};

export default PricingPlans;

