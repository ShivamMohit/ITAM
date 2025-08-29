"use client";

import { useState } from "react";
import {
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HardDrive,
  TrendingUp,
} from "lucide-react";
import { useSubscription } from "../contexts/SubscriptionContext";
import Link from "next/link";
import clsx from "clsx";

const SubscriptionWidget = () => {
  const { subscription, usage, loading, canAddAsset, hasFeature } =
    useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Subscription</h3>
          <XCircle className="w-5 h-5 text-red-500" />
        </div>
        <p className="text-gray-600 mb-4">No active subscription found.</p>
        <Link
          href="/subscription"
          className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          View Plans
        </Link>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-50 border-green-200";
      case "inactive":
        return "text-red-600 bg-red-50 border-red-200";
      case "cancelled":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "suspended":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "inactive":
      case "cancelled":
      case "suspended":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <XCircle className="w-4 h-4" />;
    }
  };

  const usagePercentage = usage
    ? Math.round((usage.hardware / subscription.maxAssets) * 100)
    : 0;
  const needsUpgrade = usagePercentage > 80;

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Subscription</h3>
          <div
            className={clsx(
              "flex items-center px-2 py-1 rounded-full text-xs font-medium border",
              getStatusColor(subscription.status)
            )}
          >
            {getStatusIcon(subscription.status)}
            <span className="ml-1 capitalize">{subscription.status}</span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Current Plan */}
          <div>
            <p className="text-sm text-gray-600 mb-1">Current Plan</p>
            <p className="text-lg font-semibold text-gray-900 capitalize">
              {subscription.plan}
            </p>
          </div>

          {/* Usage */}
          {usage && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-600">Asset Usage</p>
                <p className="text-sm font-medium text-gray-900">
                  {usage.hardware} / {subscription.maxAssets}
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={clsx(
                    "h-2 rounded-full transition-all duration-300",
                    usagePercentage > 90
                      ? "bg-red-500"
                      : usagePercentage > 75
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  )}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {usagePercentage}% of limit used
              </p>
            </div>
          )}

          {/* Warnings */}
          {subscription.cancelAtPeriodEnd && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-4 h-4 text-orange-600 mr-2" />
                <span className="text-orange-800 text-sm">
                  Subscription will cancel at period end
                </span>
              </div>
            </div>
          )}

          {needsUpgrade && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 text-yellow-600 mr-2" />
                <span className="text-yellow-800 text-sm">
                  Consider upgrading to add more assets
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Link
              href="/subscription/dashboard"
              className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Manage
            </Link>

            {needsUpgrade && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="flex-1 flex items-center justify-center px-3 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Upgrade
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Upgrade Your Plan
            </h3>
            <p className="text-gray-600 mb-6">
              You're using {usagePercentage}% of your asset limit. Consider
              upgrading to add more assets and unlock additional features.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Maybe Later
              </button>
              <Link
                href="/subscription"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
              >
                View Plans
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SubscriptionWidget;

