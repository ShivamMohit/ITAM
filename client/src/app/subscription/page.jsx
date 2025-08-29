"use client";

import PricingPlans from "../../components/PricingPlans";
import { SubscriptionProvider } from "../../contexts/SubscriptionContext";

const SubscriptionPage = () => {
  return (
    <SubscriptionProvider>
      <div className="min-h-screen bg-gray-50">
        <PricingPlans />
      </div>
    </SubscriptionProvider>
  );
};

export default SubscriptionPage;

