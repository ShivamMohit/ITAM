"use client";

import { useState } from "react";
import {
  CreditCard,
  BarChart3,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  HardDrive,
  Package,
} from "lucide-react";
import { useSubscription } from "../contexts/SubscriptionContext";
import clsx from "clsx";

const SubscriptionDashboard = () => {
  const {
    subscription,
    usage,
    loading,
    error,
    cancelSubscription,
    reactivateSubscription,
    openCustomerPortal,
  } = useSubscription();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No Subscription Found
          </h2>
          <p className="text-gray-600 mb-6">
            Please contact support to set up your subscription.
          </p>
        </div>
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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleCancelSubscription = async () => {
    setProcessing(true);
    try {
      await cancelSubscription(true); // Cancel at period end
      setShowCancelModal(false);
    } catch (error) {
      console.error("Error cancelling subscription:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setProcessing(true);
    try {
      await reactivateSubscription();
    } catch (error) {
      console.error("Error reactivating subscription:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      await openCustomerPortal();
    } catch (error) {
      // Error is already handled in the context
      console.error("Error opening customer portal:", error);
    }
  };

  const usagePercentage = usage
    ? Math.round((usage.hardware / subscription.maxAssets) * 100)
    : 0;

  // Check if we're in demo mode (backend not available)
  const isDemoMode = error && error.includes("Backend not available");

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Subscription Dashboard
        </h1>
        <p className="text-gray-600">
          Manage your subscription and monitor usage
        </p>
        {isDemoMode && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-blue-800 text-sm font-medium">
                Demo Mode: This is sample data. Connect to backend for full
                functionality.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Current Plan Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Current Plan</h2>
          <div
            className={clsx(
              "flex items-center px-3 py-1 rounded-full text-sm font-medium border",
              getStatusColor(subscription.status)
            )}
          >
            {getStatusIcon(subscription.status)}
            <span className="ml-1 capitalize">{subscription.status}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {subscription.plan}
            </h3>
            <p className="text-gray-600 text-sm">
              Your current subscription plan
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {subscription.maxAssets.toLocaleString()} Assets
            </h3>
            <p className="text-gray-600 text-sm">Maximum assets allowed</p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {subscription.features?.length || 0} Features
            </h3>
            <p className="text-gray-600 text-sm">Available features</p>
          </div>
        </div>

        {subscription.cancelAtPeriodEnd && (
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
              <span className="text-orange-800 text-sm font-medium">
                Your subscription will be cancelled at the end of the current
                period.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Usage Statistics */}
      {usage && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Usage Statistics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="flex items-center">
              <HardDrive className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Hardware Assets</p>
                <p className="text-2xl font-bold text-gray-900">
                  {usage.hardware}
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <Package className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Software Assets</p>
                <p className="text-2xl font-bold text-gray-900">
                  {usage.software}
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <Users className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {usage.users}
                </p>
              </div>
            </div>
          </div>

          {/* Usage Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Asset Usage
              </span>
              <span className="text-sm text-gray-600">
                {usage.hardware} / {subscription.maxAssets}
              </span>
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
              {usagePercentage}% of your asset limit used
            </p>
          </div>
        </div>
      )}

      {/* Subscription Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Subscription Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Current Period
            </h3>
            <p className="text-gray-900">
              {formatDate(subscription.currentPeriodStart)} -{" "}
              {formatDate(subscription.currentPeriodEnd)}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Billing Cycle
            </h3>
            <p className="text-gray-900">Monthly</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Features</h3>
            <div className="flex flex-wrap gap-2">
              {subscription.features?.map((feature, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize"
                >
                  {feature.replace("_", " ")}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
            <div
              className={clsx(
                "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border",
                getStatusColor(subscription.status)
              )}
            >
              {getStatusIcon(subscription.status)}
              <span className="ml-1 capitalize">{subscription.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Manage Subscription
        </h2>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleManageBilling}
            disabled={isDemoMode}
            className={clsx(
              "flex items-center px-4 py-2 rounded-lg transition-colors",
              isDemoMode
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            )}
            title={
              isDemoMode
                ? "Billing management requires backend connection"
                : "Manage billing and payment methods"
            }
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {isDemoMode ? "Manage Billing (Demo)" : "Manage Billing"}
          </button>

          {subscription.status === "active" &&
            !subscription.cancelAtPeriodEnd && (
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={isDemoMode}
                className={clsx(
                  "flex items-center px-4 py-2 rounded-lg transition-colors",
                  isDemoMode
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-red-600 text-white hover:bg-red-700"
                )}
                title={
                  isDemoMode
                    ? "Subscription management requires backend connection"
                    : "Cancel your subscription"
                }
              >
                <XCircle className="w-4 h-4 mr-2" />
                {isDemoMode
                  ? "Cancel Subscription (Demo)"
                  : "Cancel Subscription"}
              </button>
            )}

          {subscription.cancelAtPeriodEnd && (
            <button
              onClick={handleReactivateSubscription}
              disabled={processing || isDemoMode}
              className={clsx(
                "flex items-center px-4 py-2 rounded-lg transition-colors",
                isDemoMode || processing
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              )}
              title={
                isDemoMode
                  ? "Subscription management requires backend connection"
                  : "Reactivate your subscription"
              }
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {isDemoMode
                ? "Reactivate Subscription (Demo)"
                : "Reactivate Subscription"}
            </button>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Cancel Subscription
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel your subscription? You'll continue
              to have access until the end of your current billing period.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {processing ? "Cancelling..." : "Cancel Subscription"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionDashboard;
