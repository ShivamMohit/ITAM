"use client";

import SubscriptionDashboard from "../../../components/SubscriptionDashboard";
import { SubscriptionProvider } from "../../../contexts/SubscriptionContext";

const SubscriptionDashboardPage = () => {
  return (
    <SubscriptionProvider>
      <div className="min-h-screen bg-gray-50">
        <SubscriptionDashboard />
      </div>
    </SubscriptionProvider>
  );
};

export default SubscriptionDashboardPage;

